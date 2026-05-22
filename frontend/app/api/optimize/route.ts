import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { runMLOptimization } from '@/lib/optimization/mlOptimizer'

export const maxDuration = 60

// ━━━ 1. USE SERVICE ROLE CLIENT FOR ALL INSERTS ━━━
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
    // ━━━ 2. GET USER ID CORRECTLY ━━━
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      console.error('Optimization API: Missing Authorization header')
      return NextResponse.json({ error: 'Unauthorized: Missing token' }, { status: 401 })
    }

    const { data: { user }, error: authError } = await adminClient.auth.getUser(token)

    if (authError || !user) {
      console.error('Optimization API: Auth error or user not found', authError)
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 })
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
      fragility: p.fragility || 'low',
      current_box: p.current_box || null,
      box_price: p.box_price ? Number(p.box_price) : null
    }))

    // Call Python Backend for each product or batch
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

    const resultsFromBackend = await Promise.all(mappedProducts.map(async (p) => {
      try {
        const response = await fetch(`${BACKEND_URL}/optimize/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_name: p.product_name,
            sku: p.product_id,
            length_cm: p.length_cm,
            width_cm: p.width_cm,
            height_cm: p.height_cm,
            weight_kg: p.weight_kg,
            fragility: p.fragility,
            available_boxes: boxes.map(b => ({
              id: b.id,
              name: b.name,
              sku: b.sku,
              length_cm: b.length_cm,
              width_cm: b.width_cm,
              height_cm: b.height_cm,
              max_weight_kg: b.weight_limit_kg,
              cost_usd: b.cost,
              eco_certified: b.eco_certified,
              double_wall: b.double_wall
            })),
            destination_zone: 2,
            shipping_method: 'standard',
            current_box_length: p.current_box ? parseFloat(p.current_box.split('x')[0]) : null,
            current_box_width: p.current_box ? parseFloat(p.current_box.split('x')[1]) : null,
            current_box_height: p.current_box ? parseFloat(p.current_box.split('x')[2]) : null,
            current_box_cost_usd: p.box_price
          })
        })
        return await response.json()
      } catch (err) {
        console.error('Python Backend Call Failed:', err)
        return null
      }
    }))

    const allResults = resultsFromBackend.map((res, idx) => {
      const p = mappedProducts[idx]
      if (!res || res.detail) {
        return {
          sku: p.product_id,
          productName: p.product_name,
          optimized: false,
          reasonCode: 'BACKEND_ERROR',
          reason: 'Python backend failed or returned error',
          explanation: 'Could not reach optimization engine.',
          recommendation: 'Try again later.',
          fragility: p.fragility.toUpperCase(),
          fragilityScore: 30,
          whyChosen: 'N/A',
          baselineBox: `${p.length_cm}x${p.width_cm}x${p.height_cm}`,
          optimizedBox: null,
          baselineCost: 15,
          shippingCost: null,
          savings: 0,
          savingsPercent: 0,
          volumeUtil: 0,
          weight: p.weight_kg,
          lengthCm: p.length_cm,
          widthCm: p.width_cm,
          heightCm: p.height_cm,
          optimizedDims: null
        }
      }

      return {
        sku: p.product_id,
        productName: p.product_name,
        optimized: res.fit_check_passed,
        reasonCode: res.fit_check_passed ? 'SUCCESS' : 'NO_FIT',
        reason: res.reasoning,
        explanation: res.reasoning,
        recommendation: res.fit_check_passed ? 'Use recommended box.' : 'Consider custom packaging.',
        fragility: p.fragility.toUpperCase(),
        fragilityScore: res.confidence_score,
        whyChosen: res.reasoning,
        baselineBox: `${p.length_cm}x${p.width_cm}x${p.height_cm}`,
        optimizedBox: res.recommended_box_name,
        baselineCost: res.baseline_cost,
        shippingCost: res.total_cost,
        savings: res.savings,
        savingsPercent: res.savings_percent,
        volumeUtil: res.space_utilization,
        weight: p.weight_kg,
        lengthCm: p.length_cm,
        widthCm: p.width_cm,
        heightCm: p.height_cm,
        optimizedDims: res.recommended_box_dims ? {
          l: parseFloat(res.recommended_box_dims.split('x')[0]),
          w: parseFloat(res.recommended_box_dims.split('x')[1]),
          h: parseFloat(res.recommended_box_dims.split('x')[2])
        } : null
      }
    })

    const optimizedResults = allResults.filter(r => r.optimized)
    const notOptimizedResults = allResults.filter(r => !r.optimized)
    const totalSavings = optimizedResults.reduce((sum, r) => sum + (r.savings || 0), 0)

    // ━━━ 3. CREATE OPTIMIZATION SESSION FIRST ━━━
    const { data: session, error: sessionError } = await adminClient
      .from('optimization_sessions')
      .insert({
        user_id: user.id,
        file_name: fileName ?? 'upload.csv',
        total_processed: allResults.length,
        total_optimized: optimizedResults.length,
        total_not_optimized: notOptimizedResults.length,
        total_savings: totalSavings,
        success_rate: (optimizedResults.length / allResults.length) * 100,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (sessionError) {
      console.error('SESSION INSERT ERROR:', {
        code: sessionError.code,
        message: sessionError.message,
        details: sessionError.details,
        hint: sessionError.hint
      })
      return NextResponse.json({ error: sessionError.message }, { status: 500 })
    }

    // ━━━ 4. INSERT OPTIMIZATION_RESULTS (one per product) ━━━
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

    if (resultsError) {
      console.error('RESULTS INSERT ERROR:', {
        code: resultsError.code,
        message: resultsError.message,
        details: resultsError.details,
        hint: resultsError.hint
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
