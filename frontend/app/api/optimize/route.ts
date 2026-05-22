import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runMLOptimization } from '@/lib/optimization/mlOptimizer'

export const maxDuration = 60

const getAdminClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── Default Box Catalog (fallback) ────────────────────────────────────────
const DEFAULT_CATALOG = [
  { id: 'mailer-xs1', name: 'Premium XS Flap Enveloper',  sku: 'MLR-XS1', length_cm: 15.2, width_cm: 10.2, height_cm:  2.0, weight_limit_kg:  1, cost: 0.12, eco_certified: true,  double_wall: false },
  { id: 'box-m1',     name: 'Fulfillment Box M1',         sku: 'BX-M1',   length_cm: 25.0, width_cm: 20.0, height_cm: 15.0, weight_limit_kg:  8, cost: 0.48, eco_certified: true,  double_wall: false },
  { id: 'box-l1',     name: 'Enterprise Box L1',          sku: 'BX-L1',   length_cm: 35.0, width_cm: 25.0, height_cm: 20.0, weight_limit_kg: 15, cost: 0.72, eco_certified: true,  double_wall: false },
]

export async function POST(request: NextRequest) {
  const adminClient = getAdminClient()
  try {
    // ━━━ 1. GET USER ID CORRECTLY ━━━
    const authHeader = request.headers.get('Authorization')
    const { data: { user }, error: authError } = await adminClient.auth.getUser(
      authHeader?.replace('Bearer ', '') ?? ''
    )
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { products, fileName } = body

    if (!Array.isArray(products)) {
      return NextResponse.json({ error: 'Products array is required' }, { status: 400 })
    }

    // ━━━ EXECUTE OPTIMIZATION LOGIC ━━━
    // Load box catalog
    const { data: dbBoxes } = await adminClient.from('box_catalog').select('*')
    const boxes = (dbBoxes && dbBoxes.length > 0)
      ? dbBoxes.map(b => ({
          id: b.id,
          name: b.name,
          sku: b.sku,
          length_cm: Number(b.length_cm),
          width_cm: Number(b.width_cm),
          height_cm: Number(b.height_cm),
          weight_limit_kg: Number(b.weight_limit_kg || 30),
          cost: Number(b.cost || 0.50),
          eco_certified: b.eco_certified || false,
          double_wall: b.double_wall || false,
        }))
      : DEFAULT_CATALOG

    // Map input to ML optimizer format
    const mappedProducts = products.map((p, idx) => ({
      product_id: p.sku || p.product_id || `SKU-${idx}`,
      product_name: p.product_name || p.name || `Item ${idx}`,
      length_cm: Number(p.length_cm || p.l || 0),
      width_cm: Number(p.width_cm || p.w || 0),
      height_cm: Number(p.height_cm || p.h || 0),
      weight_kg: Number(p.weight_kg || p.weight || 0.5),
      fragility: p.fragility || 'low'
    }))

    const mlResult = await runMLOptimization(mappedProducts, boxes)
    const allResults = mlResult.assignments.map((a: any) => {
      const p = mappedProducts.find(mp => mp.product_id === a.sku)
      return {
        sku: a.sku,
        productName: a.name || p?.product_name || 'Unknown',
        optimized: a.fits && !!a.assignedBox,
        reasonCode: a.fits ? 'SUCCESS' : 'NO_FIT',
        reason: a.fits ? 'Optimal box found' : (a.failure_reason || 'No suitable box found'),
        explanation: a.fits ? 'Box selected based on volume utilization.' : 'Product dimensions exceed all available boxes.',
        recommendation: a.fits ? 'Use recommended box.' : 'Consider custom packaging or splitting shipment.',
        fragility: (a.fragility || p?.fragility || 'low').toUpperCase(),
        fragilityScore: a.fragility === 'high' ? 90 : a.fragility === 'medium' ? 60 : 30,
        whyChosen: a.recommendation_reason || 'Best fit.',
        baselineBox: p ? `${p.length_cm}x${p.width_cm}x${p.height_cm}` : 'N/A',
        optimizedBox: a.assignedBox ? a.assignedBox.name : null,
        baselineCost: a.baselineCost || 10, // Mock baseline
        shippingCost: a.assignedBox ? (a.assignedBox.cost + 5) : null,
        savings: a.savings || 0,
        savingsPercent: a.savings ? (a.savings / 10 * 100) : 0,
        volumeUtil: a.volume_utilization || 0,
        weight: a.weight || p?.weight_kg || 0,
        lengthCm: a.dimensions?.l || p?.length_cm || 0,
        widthCm: a.dimensions?.w || p?.width_cm || 0,
        heightCm: a.dimensions?.h || p?.height_cm || 0,
        optimizedDims: a.assignedBox ? { l: a.assignedBox.length_cm, w: a.assignedBox.width_cm, h: a.assignedBox.height_cm } : null
      }
    })

    const optimizedResults = allResults.filter(r => r.optimized)
    const notOptimizedResults = allResults.filter(r => !r.optimized)
    const totalSavings = optimizedResults.reduce((sum, r) => sum + (r.savings || 0), 0)

    // ━━━ 3. CREATE OPTIMIZATION SESSION FIRST ━━━
    let session: any
    try {
      const { data, error: sessionError } = await adminClient
        .from('optimization_sessions')
        .insert({
          user_id: user.id,
          file_name: fileName ?? 'upload.csv',
          total_processed: allResults.length,
          total_optimized: optimizedResults.length,
          total_not_optimized: notOptimizedResults.length,
          total_savings: totalSavings,
          success_rate: allResults.length > 0 ? (optimizedResults.length / allResults.length) * 100 : 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (sessionError) throw sessionError
      session = data
    } catch (err: any) {
      console.error('SESSION INSERT ERROR:', {
        code: err.code,
        message: err.message,
        details: err.details,
        hint: err.hint
      })
      return NextResponse.json({ error: err.message }, { status: 500 })
    }

    // ━━━ 4. INSERT OPTIMIZATION_RESULTS (one per product) ━━━
    try {
      const resultsToInsert = allResults.map(r => ({
        session_id: session.id,
        user_id: user.id,
        sku: r.sku,
        product_name: r.productName,
        optimized: r.optimized,
        reason_code: r.reasonCode ?? null,
        reason: r.reason ?? null,
        explanation: r.explanation ?? null,
        recommendation: r.recommendation ?? null,
        fragility: r.fragility,
        fragility_score: r.fragilityScore,
        why_chosen: r.whyChosen ?? null,
        baseline_box: r.baselineBox,
        optimized_box: r.optimizedBox ?? null,
        baseline_cost: r.baselineCost,
        shipping_cost: r.shippingCost ?? null,
        savings: r.savings ?? 0,
        savings_percent: r.savingsPercent ?? 0,
        volume_util: r.volumeUtil ?? 0,
        weight: r.weight,
        dimensions: { l: r.lengthCm, w: r.widthCm, h: r.heightCm },
        optimized_dims: r.optimizedDims ?? null,
        created_at: new Date().toISOString()
      }))

      const { error: resultsError } = await adminClient
        .from('optimization_results')
        .insert(resultsToInsert)

      if (resultsError) throw resultsError
    } catch (err: any) {
      console.error('RESULTS INSERT ERROR:', {
        code: err.code,
        message: err.message,
        details: err.details,
        hint: err.hint
      })
    }

    // ━━━ 5. INSERT ORDERS (one per OPTIMIZED product only) ━━━
    const ordersToInsert = optimizedResults.map(r => ({
      user_id: user.id,
      session_id: session.id,
      product_snapshot: {
        sku: r.sku,
        product_name: r.productName,
        weight_kg: r.weight,
        length_cm: r.lengthCm,
        width_cm: r.widthCm,
        height_cm: r.heightCm,
        fragility: r.fragility
      },
      baseline_box: r.baselineBox,
      optimized_box: r.optimizedBox,
      optimized_dims: r.optimizedDims,
      product_dims: { l: r.lengthCm, w: r.widthCm, h: r.heightCm },
      savings: r.savings,
      total_cost: r.shippingCost,
      baseline_cost: r.baselineCost,
      risk_level: r.fragility === 'CRITICAL' || r.fragility === 'HIGH' ? 'HIGH'
                : r.fragility === 'MEDIUM' ? 'MEDIUM' : 'LOW',
      fragility: r.fragility,
      weight: r.weight,
      status: 'optimized',
      created_at: new Date().toISOString()
    }))

    const orderResults = await Promise.allSettled(
      ordersToInsert.map(order =>
        adminClient.from('orders').insert(order).select().single()
      )
    )

    const orderErrors = orderResults
      .filter(r => r.status === 'rejected' ||
        (r.status === 'fulfilled' && r.value.error))
      .map(r => r.status === 'rejected'
        ? r.reason
        : (r as any).value.error)

    if (orderErrors.length > 0) {
      orderErrors.forEach(err => {
        console.error('ORDER INSERT ERROR:', {
          code: err?.code,
          message: err?.message,
          details: err?.details,
          hint: err?.hint
        })
      })
    }

    // ━━━ 6. RETURN FULL RESPONSE ━━━
    return NextResponse.json({
      success: true,
      session_id: session.id,
      total_processed: allResults.length,
      total_optimized: optimizedResults.length,
      total_not_optimized: notOptimizedResults.length,
      total_savings: totalSavings,
      order_inserts: {
        attempted: ordersToInsert.length,
        succeeded: orderResults.filter(r => r.status === 'fulfilled' && !(r as any).value.error).length,
        errors: orderErrors
      },
      results: allResults
    })

  } catch (err: any) {
    console.error('FATAL OPTIMIZE ERROR:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
