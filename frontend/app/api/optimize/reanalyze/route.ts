import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { runMLOptimization } from '@/lib/optimization/mlOptimizer'

export const maxDuration = 60

export async function POST(req: Request) {
  const supabase = await createClient()
  const supabaseAdmin = await createServiceClient()
  const admin: any = supabaseAdmin as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const orderIds: string[] = (body.order_ids || [])
  const sessionId: string | undefined = body.session_id

  try {
    // Resolve target optimization_result ids
    let resultIds: string[] = []

    if (orderIds.length > 0) {
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('id, optimization_result_id')
        .in('id', orderIds)

      resultIds = (orders || []).map((o: any) => o.optimization_result_id).filter(Boolean)
    } else if (sessionId) {
      const { data: rows } = await supabaseAdmin
        .from('optimization_results')
        .select('id')
        .eq('session_id', sessionId)

      resultIds = (rows || []).map((r: any) => r.id)
    } else {
      return NextResponse.json({ error: 'order_ids or session_id required' }, { status: 400 })
    }

    if (resultIds.length === 0) {
      return NextResponse.json({ updated: [] })
    }

    // Load box catalog for scoring
    const { data: boxRows } = await admin.from('box_catalog').select('*')
    const boxes = (boxRows || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      sku: b.sku,
      length_cm: Number(b.length_cm),
      width_cm: Number(b.width_cm),
      height_cm: Number(b.height_cm),
      weight_limit_kg: Number(b.weight_limit_kg || b.max_weight_kg || 30),
      cost: Number(b.cost_usd || b.cost || 0.5),
      eco_certified: b.eco_certified || false,
      double_wall: b.double_wall || false,
    }))

    // Fetch optimization results to re-run
    const { data: results } = await admin
      .from('optimization_results')
      .select('*')
      .in('id', resultIds)

    const updated: any[] = []

    for (const r of ((results || []) as any[])) {
      const productInput = [{
        product_id: r.sku || `sku-${r.id}`,
        product_name: r.product_name || r.sku || 'Unknown',
        length_cm: Number(r.length_cm || 0),
        width_cm: Number(r.width_cm || 0),
        height_cm: Number(r.height_cm || 0),
        weight_kg: Number(r.weight_kg || 0.5),
        quantity: Number(r.quantity || 1),
        current_box_name: r.old_box_name || null,
        current_box_length: r.new_box_length_cm ? Number(r.new_box_length_cm) : undefined,
        current_box_width: r.new_box_width_cm ? Number(r.new_box_width_cm) : undefined,
        current_box_height: r.new_box_height_cm ? Number(r.new_box_height_cm) : undefined,
      }]

      // Run local JS ML optimizer (fallback to ensure execution in serverless env)
      const ml = await runMLOptimization(productInput as any, boxes as any)
      const assignment = ml.results && ml.results[0]

      const finalScore = assignment?.fit_score || 0

      const updatePayload: any = {
        ml_score: finalScore,
        new_box_name: assignment?.recommended_box_name || null,
        new_box_dims: assignment?.new_box_dims ? `${assignment.new_box_dims.l}x${assignment.new_box_dims.w}x${assignment.new_box_dims.h}` : null,
        new_box_length_cm: assignment?.new_box_dims?.l || null,
        new_box_width_cm: assignment?.new_box_dims?.w || null,
        new_box_height_cm: assignment?.new_box_dims?.h || null,
        savings_amount: assignment?.savings_per_unit || 0,
        volume_utilization: finalScore,
        is_optimized: assignment?.recommended_box_name !== 'No box found',
      }

      await admin
        .from('optimization_results')
        .update(updatePayload)
        .eq('id', r.id)

      // Update any orders linked to this optimization result
      const { data: ordersForResult } = await admin
        .from('orders')
        .select('*')
        .eq('optimization_result_id', r.id)

      if (ordersForResult && ordersForResult.length > 0) {
        for (const o of ordersForResult) {
          const boxSnap = assignment?.recommended_box_name !== 'No box found' ? {
            name: assignment?.recommended_box_name,
            length_cm: assignment?.new_box_dims?.l,
            width_cm: assignment?.new_box_dims?.w,
            height_cm: assignment?.new_box_dims?.h,
            cost: assignment?.new_box_price
          } : o.box_snapshot || null

          await admin
            .from('orders')
            .update({ status: 'reanalyzed', box_snapshot: boxSnap })
            .eq('id', o.id)
        }
      }

      updated.push({ id: r.id, updated: updatePayload })
    }

    return NextResponse.json({ updated })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 })
  }
}
