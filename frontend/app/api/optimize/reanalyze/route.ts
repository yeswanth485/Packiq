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
      const assignment = ml.assignments && ml.assignments[0]

      const breakdown = assignment?.score_breakdown || null
      const finalScore = breakdown ? (Object.values(breakdown as any).reduce((s: any, v: any) => s + Number(v), 0)) : null

      const updatePayload: any = {
        ml_score: finalScore,
        score_breakdown: breakdown,
        alternatives: assignment?.alternatives ? assignment.alternatives : null,
        new_box_name: assignment?.assignedBox?.name || null,
        new_box_dims: assignment?.assignedBox ? `${assignment.assignedBox.length_cm}x${assignment.assignedBox.width_cm}x${assignment.assignedBox.height_cm}` : null,
        new_box_length_cm: assignment?.assignedBox?.length_cm || null,
        new_box_width_cm: assignment?.assignedBox?.width_cm || null,
        new_box_height_cm: assignment?.assignedBox?.height_cm || null,
        savings_amount: assignment?.savings || 0,
        volume_utilization: assignment?.volume_utilization || null,
        is_optimized: assignment?.fits || false,
        recommendation_reason: assignment?.recommendation_reason || null,
        failure_reason: assignment?.failure_reason || null,
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
          const boxSnap = assignment?.assignedBox ? {
            id: assignment.assignedBox.id,
            name: assignment.assignedBox.name,
            length_cm: assignment.assignedBox.length_cm,
            width_cm: assignment.assignedBox.width_cm,
            height_cm: assignment.assignedBox.height_cm,
            cost: assignment.assignedBox.cost
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
