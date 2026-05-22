import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { runMLOptimization } from '@/lib/optimization/mlOptimizer'

export const maxDuration = 60

// ━━━ 1. SUPABASE ADMIN CLIENT (Service Role) ━━━
const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ━━━ 2. DEFAULT BOX CATALOGUE ━━━
const DEFAULT_BOXES = [
  { id: 'box-xs', name: 'Eco-Lite Mailer XS', sku: 'BOX-XS', length_cm: 15, width_cm: 10, height_cm: 5, weight_limit_kg: 2, cost: 0.15, eco_certified: true },
  { id: 'box-s',  name: 'Standard Box S',    sku: 'BOX-S',  length_cm: 20, width_cm: 15, height_cm: 10, weight_limit_kg: 5, cost: 0.35, eco_certified: true },
  { id: 'box-m',  name: 'Fulfillment Box M', sku: 'BOX-M',  length_cm: 30, width_cm: 25, height_cm: 15, weight_limit_kg: 10, cost: 0.65, eco_certified: true },
  { id: 'box-l',  name: 'Heavy Duty Box L',  sku: 'BOX-L',  length_cm: 45, width_cm: 35, height_cm: 25, weight_limit_kg: 20, cost: 1.20, eco_certified: true },
  { id: 'box-xl', name: 'Enterprise Box XL', sku: 'BOX-XL', length_cm: 60, width_cm: 50, height_cm: 40, weight_limit_kg: 35, cost: 2.50, eco_certified: true },
]

export async function POST(request: NextRequest) {
  // ── 0. Env guard ──────────────────────────────────────────────
  const missingEnv = []
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingEnv.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingEnv.push('SUPABASE_SERVICE_ROLE_KEY')
  if (missingEnv.length) {
    return NextResponse.json({ error: 'Missing env vars: ' + missingEnv.join(', ') }, { status: 500 })
  }

  const supabase = getSupabase()

  try {
    console.log('[optimize] Request received')

    // ── 1. Parse body ─────────────────────────────────────────────
    let userId: string | undefined
    let products: any[]
    let fileName = 'upload.csv'

    const contentType = request.headers.get('content-type') ?? ''

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const file = form.get('file')
      const uid = form.get('userId')

      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
      }
      if (!uid) {
        // Try Auth Header fallback
        const authHeader = request.headers.get('Authorization')
        const token = authHeader?.replace('Bearer ', '')
        if (token) {
          const { data: { user } } = await supabase.auth.getUser(token)
          if (user) userId = user.id
        }
      } else {
        userId = uid.toString()
      }

      fileName = file.name
      const csvText = await file.text()
      products = parseCSV(csvText)
    } else {
      const body = await request.json()
      userId = body.userId
      products = body.products ?? []
      fileName = body.fileName || 'api_upload.json'

      if (!userId) {
        const authHeader = request.headers.get('Authorization')
        const token = authHeader?.replace('Bearer ', '')
        if (token) {
          const { data: { user } } = await supabase.auth.getUser(token)
          if (user) userId = user.id
        }
      }
    }

    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    if (!products.length) return NextResponse.json({ error: 'No products to optimize' }, { status: 400 })

    console.log(`[optimize] Starting: ${products.length} products, user: ${userId}`)

    // ── 2. Get Box Catalog ────────────────────────────────────────
    const { data: dbBoxes } = await supabase.from('box_catalog').select('*')
    const boxCatalog = (dbBoxes && dbBoxes.length > 0) ? dbBoxes.map(b => ({
      id: b.id,
      name: b.name,
      sku: b.sku,
      length_cm: Number(b.length_cm),
      width_cm: Number(b.width_cm),
      height_cm: Number(b.height_cm),
      weight_limit_kg: Number(b.weight_limit_kg || 30),
      cost: Number(b.cost || 0.5),
      eco_certified: b.eco_certified || false
    })) : DEFAULT_BOXES

    // ── 3. Run optimization ───────────────────────────────────────
    const mlResult = await runMLOptimization(products, boxCatalog)

    // ── 4. Insert session ─────────────────────────────────────────
    const { data: session, error: sessionErr } = await supabase
      .from('optimization_sessions')
      .insert({
        user_id: userId,
        file_name: fileName,
        total_processed: mlResult.total_processed,
        total_optimized: mlResult.total_optimized,
        total_not_optimized: mlResult.total_not_optimized,
        total_savings: mlResult.total_savings,
        success_rate: mlResult.success_rate,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    const sessionId = session?.id ?? null
    if (sessionErr) console.error('[optimize] session insert error:', sessionErr.message)

    // ── 5. Insert optimization_results in chunks ──────────────────
    const allResultsToInsert = mlResult.results.map(r => ({
      session_id: sessionId,
      user_id: userId,
      sku: r.sku,
      product_name: r.product_name,
      optimized: r.optimized,
      reason_code: r.optimized ? 'SUCCESS' : 'NO_FIT',
      reason: r.recommendation_reason || r.failure_reason,
      explanation: r.recommendation_reason,
      recommendation: r.optimized ? 'Use recommended box.' : 'Consider custom packaging.',
      fragility: r.fragility,
      fragility_score: r.score_breakdown.fragility_match_score,
      why_chosen: r.recommendation_reason,
      baseline_box: `${r.dimensions.l}x${r.dimensions.w}x${r.dimensions.h}`,
      optimized_box: r.assigned_box?.name || null,
      baseline_cost: r.baseline_cost,
      shipping_cost: r.shipping_cost,
      savings: r.savings,
      savings_percent: r.baseline_cost > 0 ? (r.savings / r.baseline_cost) * 100 : 0,
      volume_util: r.volume_utilization,
      weight: r.weight,
      dimensions: r.dimensions,
      optimized_dims: r.assigned_box ? { l: r.assigned_box.length_cm, w: r.assigned_box.width_cm, h: r.assigned_box.height_cm } : null,
      created_at: new Date().toISOString()
    }))

    for (let i = 0; i < allResultsToInsert.length; i += 50) {
      const chunk = allResultsToInsert.slice(i, i + 50)
      const { error } = await supabase.from('optimization_results').insert(chunk)
      if (error) console.error(`[optimize] results chunk ${i} error:`, error.message)
    }

    // ── 6. Insert orders for optimized products ───────────────────
    const optimizedItems = mlResult.results.filter(r => r.optimized)
    const orderPromises = optimizedItems.map(product => {
      return supabase.from('orders').insert({
        user_id: userId,
        session_id: sessionId,
        product_snapshot: {
          sku: product.sku,
          product_name: product.product_name,
          weight_kg: product.weight,
          length_cm: product.dimensions.l,
          width_cm: product.dimensions.w,
          height_cm: product.dimensions.h,
          fragility: product.fragility
        },
        optimized_box: product.assigned_box?.name,
        baseline_box: `${product.dimensions.l}x${product.dimensions.w}x${product.dimensions.h}`,
        optimized_dims: product.assigned_box ? { l: product.assigned_box.length_cm, w: product.assigned_box.width_cm, h: product.assigned_box.height_cm } : null,
        product_dims: product.dimensions,
        savings: product.savings,
        total_cost: product.shipping_cost,
        baseline_cost: product.baseline_cost,
        risk_level: product.fragility === 'HIGH' || product.fragility === 'CRITICAL' ? 'HIGH' : 'LOW',
        fragility: product.fragility,
        weight: product.weight,
        status: 'pending',
        created_at: new Date().toISOString()
      })
    })

    const orderResults = await Promise.allSettled(orderPromises)
    const orderSuccesses = orderResults.filter(res => res.status === 'fulfilled' && !res.value.error).length

    // ── 7. Return success ─────────────────────────────────────────
    return NextResponse.json({
      success: true,
      ok: true,
      session_id: sessionId,
      total_processed: mlResult.total_processed,
      total_optimized: mlResult.total_optimized,
      total_not_optimized: mlResult.total_not_optimized,
      total_savings: mlResult.total_savings,
      success_rate: mlResult.success_rate,
      order_inserts: {
        success: orderSuccesses,
        failed: optimizedItems.length - orderSuccesses,
      },
      results: mlResult.results.map(r => ({
        ...r,
        // Map to frontend expected names
        productName: r.product_name,
        volumeUtil: r.volume_utilization,
        optimizedBox: r.assigned_box?.name,
        optimizedDims: r.assigned_box ? { l: r.assigned_box.length_cm, w: r.assigned_box.width_cm, h: r.assigned_box.height_cm } : null,
        lengthCm: r.dimensions.l,
        widthCm: r.dimensions.w,
        heightCm: r.dimensions.h,
        reason: r.recommendation_reason
      }))
    })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[/api/optimize] Unhandled error:', msg, error)
    return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 })
  }
}

function parseCSV(text: string): any[] {
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true
  })

  return (parsed.data as any[]).map(row => ({
    product_id: String(row.sku || row.SKU || row.product_id || ''),
    product_name: String(row.product_name || row.name || row.Product || ''),
    weight_kg: Number(row.weight_kg || row.weight || 0.5),
    length_cm: Number(row.length_cm || row.l || row.length || 0),
    width_cm: Number(row.width_cm || row.w || row.width || 0),
    height_cm: Number(row.height_cm || row.h || row.height || 0),
    fragility: String(row.fragility || 'LOW').toUpperCase(),
    box_price: row.box_price ? Number(row.box_price) : undefined,
    current_box_length: row.current_box_length ? Number(row.current_box_length) : undefined,
    current_box_width: row.current_box_width ? Number(row.current_box_width) : undefined,
    current_box_height: row.current_box_height ? Number(row.current_box_height) : undefined,
    ...row
  }))
}
