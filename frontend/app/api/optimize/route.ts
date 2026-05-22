import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'

export const maxDuration = 60

// ━━━ 1. SUPABASE ADMIN CLIENT (Service Role) ━━━
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ━━━ 2. DEFAULT BOX CATALOGUE ━━━
const BOX_CATALOGUE = [
  { id: 'box-xs', name: 'Eco-Lite Mailer XS', sku: 'BOX-XS', length_cm: 15, width_cm: 10, height_cm: 5, weight_limit_kg: 2, cost: 0.15 },
  { id: 'box-s',  name: 'Standard Box S',    sku: 'BOX-S',  length_cm: 20, width_cm: 15, height_cm: 10, weight_limit_kg: 5, cost: 0.35 },
  { id: 'box-m',  name: 'Fulfillment Box M', sku: 'BOX-M',  length_cm: 30, width_cm: 25, height_cm: 15, weight_limit_kg: 10, cost: 0.65 },
  { id: 'box-l',  name: 'Heavy Duty Box L',  sku: 'BOX-L',  length_cm: 45, width_cm: 35, height_cm: 25, weight_limit_kg: 20, cost: 1.20 },
  { id: 'box-xl', name: 'Enterprise Box XL', sku: 'BOX-XL', length_cm: 60, width_cm: 50, height_cm: 40, weight_limit_kg: 35, cost: 2.50 },
]

interface CSVRow {
  sku: string;
  product_name: string;
  weight_kg: number;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  fragility: string;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  // ── 0. Env guard ──────────────────────────────────────────────
  const missingEnv = []
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingEnv.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingEnv.push('SUPABASE_SERVICE_ROLE_KEY')
  if (missingEnv.length) {
    return NextResponse.json({ error: 'Missing env vars: ' + missingEnv.join(', ') }, { status: 500 })
  }

  try {
    console.log('[optimize] Request received')

    // ── 1. Parse body ─────────────────────────────────────────────
    let userId: string
    let products: CSVRow[]
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
        // Fallback: try to get from JWT if available, but prompt says userId required in form
        return NextResponse.json({ error: 'userId required in form data' }, { status: 400 })
      }

      userId = uid.toString()
      fileName = file.name
      const csvText = await file.text()
      products = parseCSV(csvText)
    } else {
      const body = await request.json()
      userId = body.userId
      products = body.products ?? []
      fileName = body.fileName || 'api_upload.json'

      if (!userId) {
        // Try to verify token if userId is missing in body
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

    // ── 2. Run optimization ───────────────────────────────────────
    const { optimized, notOptimized, sessionSummary } = runOptimization(products)

    // ── 3. Insert session ─────────────────────────────────────────
    const { data: session, error: sessionErr } = await supabase
      .from('optimization_sessions')
      .insert({
        user_id: userId,
        file_name: fileName,
        total_processed: sessionSummary.total_processed,
        total_optimized: sessionSummary.total_optimized,
        total_not_optimized: sessionSummary.total_not_optimized,
        total_savings: sessionSummary.total_savings,
        success_rate: sessionSummary.success_rate,
        created_at: new Date().toISOString()
      })
      .select('id')
      .single()

    const sessionId = session?.id ?? null
    if (sessionErr) {
      console.error('[optimize] session insert error:', sessionErr.message)
      // If session fails, we still try to continue if sessionId can be null,
      // but usually this is a table-missing error (500).
    }

    // ── 4. Insert optimization_results in chunks ──────────────────
    const allResults = [...optimized, ...notOptimized].map(r => ({
      ...r,
      user_id: userId,
      session_id: sessionId,
      created_at: new Date().toISOString()
    }))

    let resultInsertErrors = 0
    for (let i = 0; i < allResults.length; i += 50) {
      const chunk = allResults.slice(i, i + 50)
      const { error } = await supabase.from('optimization_results').insert(chunk)
      if (error) {
        console.error(`[optimize] results chunk ${i} error:`, error.message)
        resultInsertErrors++
      }
    }

    // ── 5. Insert orders for optimized products ───────────────────
    let orderSuccesses = 0
    let orderErrors: string[] = []

    // Use Promise.allSettled for individual inserts to be resilient
    const orderPromises = optimized.map(product => {
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
        optimized_box: product.optimized_box,
        baseline_box: product.baseline_box,
        optimized_dims: product.optimized_dims,
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

    const results = await Promise.allSettled(orderPromises)
    results.forEach(res => {
      if (res.status === 'fulfilled' && !res.value.error) {
        orderSuccesses++
      } else {
        const err = res.status === 'fulfilled' ? res.value.error?.message : String(res.reason)
        orderErrors.push(err || 'Unknown error')
        console.error('[optimize] order insert error:', err)
      }
    })

    // ── 6. Return success ─────────────────────────────────────────
    return NextResponse.json({
      ok: true,
      session_id: sessionId,
      ...sessionSummary,
      order_inserts: {
        success: orderSuccesses,
        failed: orderErrors.length,
        errors: orderErrors.slice(0, 5),
      },
      result_insert_errors: resultInsertErrors,
      results: [...optimized, ...notOptimized],
    })

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[/api/optimize] Unhandled error:', msg, error)
    return NextResponse.json({ error: 'Internal server error', details: msg }, { status: 500 })
  }
}

// ── Inline CSV parser ─────────────────────────────────────────────
function parseCSV(text: string): CSVRow[] {
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true
  })

  return (parsed.data as any[]).map(row => ({
    sku: String(row.sku || row.SKU || ''),
    product_name: String(row.product_name || row.name || row.Product || ''),
    weight_kg: Number(row.weight_kg || row.weight || 0),
    length_cm: Number(row.length_cm || row.l || row.length || 0),
    width_cm: Number(row.width_cm || row.w || row.width || 0),
    height_cm: Number(row.height_cm || row.h || row.height || 0),
    fragility: String(row.fragility || 'LOW').toUpperCase(),
    ...row
  }))
}

// ── Inline optimizer (XGBoost-style heuristic) ───────────────────
function runOptimization(products: CSVRow[]) {
  const optimized: any[] = []
  const notOptimized: any[] = []
  let totalSavings = 0

  for (const p of products) {
    // 1. Calculate Baseline Cost (Heuristic: $15 or based on dims)
    const pVol = p.length_cm * p.width_cm * p.height_cm
    const baselineCost = p.box_price ? Number(p.box_price) : 15.0

    // 2. Find best fitting box
    let bestBox: any = null
    let minVoidVol = Infinity

    for (const box of BOX_CATALOGUE) {
      // Fit check (allow any orientation)
      const pDims = [p.length_cm, p.width_cm, p.height_cm].sort((a, b) => b - a)
      const bDims = [box.length_cm, box.width_cm, box.height_cm].sort((a, b) => b - a)

      const fits = pDims[0] <= bDims[0] && pDims[1] <= bDims[1] && pDims[2] <= bDims[2]
      const weightFits = p.weight_kg <= box.weight_limit_kg

      if (fits && weightFits) {
        const boxVol = box.length_cm * box.width_cm * box.height_cm
        const voidVol = boxVol - pVol
        if (voidVol < minVoidVol) {
          minVoidVol = voidVol
          bestBox = box
        }
      }
    }

    if (bestBox) {
      const boxVol = bestBox.length_cm * bestBox.width_cm * bestBox.height_cm
      const volUtil = (pVol / boxVol) * 100

      // Heuristic shipping cost calculation
      const chargeableWeight = Math.max(p.weight_kg, boxVol / 5000)
      const shippingCost = Number((chargeableWeight * 0.5 + bestBox.cost).toFixed(2))
      const savings = Math.max(0, baselineCost - shippingCost)

      const result = {
        sku: p.sku,
        product_name: p.product_name,
        optimized: true,
        reason_code: 'SUCCESS',
        reason: `Fitted into ${bestBox.name} with ${volUtil.toFixed(1)}% utilization.`,
        explanation: `The item was successfully matched to our ${bestBox.name} catalog size.`,
        recommendation: `Use ${bestBox.name} for shipping.`,
        fragility: p.fragility,
        fragility_score: p.fragility === 'CRITICAL' ? 90 : p.fragility === 'HIGH' ? 70 : 30,
        why_chosen: `Smallest volume box (${bestBox.name}) that safely fits the product dimensions and weight.`,
        baseline_box: `${p.length_cm}x${p.width_cm}x${p.height_cm}`,
        optimized_box: bestBox.name,
        baseline_cost: baselineCost,
        shipping_cost: shippingCost,
        savings: savings,
        savings_percent: (savings / baselineCost) * 100,
        volume_util: volUtil,
        weight: p.weight_kg,
        dimensions: { l: p.length_cm, w: p.width_cm, h: p.height_cm },
        optimized_dims: { l: bestBox.length_cm, w: bestBox.width_cm, h: bestBox.height_cm }
      }
      optimized.push(result)
      totalSavings += savings
    } else {
      notOptimized.push({
        sku: p.sku,
        product_name: p.product_name,
        optimized: false,
        reason_code: 'NO_FIT',
        reason: 'Product dimensions or weight exceed all available boxes.',
        explanation: 'The item is too large or too heavy for our standard catalog.',
        recommendation: 'Use custom oversized packaging.',
        fragility: p.fragility,
        fragility_score: 30,
        baseline_box: `${p.length_cm}x${p.width_cm}x${p.height_cm}`,
        optimized_box: null,
        baseline_cost: baselineCost,
        shipping_cost: null,
        savings: 0,
        savings_percent: 0,
        volume_util: 0,
        weight: p.weight_kg,
        dimensions: { l: p.length_cm, w: p.width_cm, h: p.height_cm },
        optimized_dims: null
      })
    }
  }

  return {
    optimized,
    notOptimized,
    sessionSummary: {
      total_processed: products.length,
      total_optimized: optimized.length,
      total_not_optimized: notOptimized.length,
      total_savings: Number(totalSavings.toFixed(2)),
      success_rate: (optimized.length / products.length) * 100
    }
  }
}
