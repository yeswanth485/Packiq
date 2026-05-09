import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseDimensions } from '@/lib/utils/parser'
import { runOptimization, LIGHTWEIGHT_MODEL, FREE_MODEL } from '@/lib/openrouter'

// ─── In-memory rate limiter ─────────────────────────────────────────────────
// Map<userId, { count: number; windowStart: number }>
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT_MAX = 10          // max requests
const RATE_LIMIT_WINDOW_MS = 60_000 // per 60 seconds

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW_MS }
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const resetIn = RATE_LIMIT_WINDOW_MS - (now - entry.windowStart)
    return { allowed: false, remaining: 0, resetIn }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetIn: RATE_LIMIT_WINDOW_MS - (now - entry.windowStart) }
}

// ─── Dimension validation ────────────────────────────────────────────────────
function validateDimensions(l: number, w: number, h: number): string | null {
  if (!isFinite(l) || !isFinite(w) || !isFinite(h)) return 'Non-finite dimension value'
  if (l <= 0 || w <= 0 || h <= 0) return 'All dimensions must be positive'
  if (l > 300 || w > 300 || h > 300) return 'Dimensions exceed maximum (300 cm)'
  return null
}

// ─── Default box catalog ─────────────────────────────────────────────────────
const DEFAULT_CATALOG = [
  { id: 'amz-a1', name: 'Amazon A1',           sku: 'AMZ-A1', lengthCm: 15.2, widthCm: 10.1, heightCm:  8.5, maxWeightKg:  5, costUsd: 0.45, material: 'Corrugated',    ecoCertified: true },
  { id: 'amz-a3', name: 'Amazon A3',           sku: 'AMZ-A3', lengthCm: 22.8, widthCm: 15.2, heightCm: 10.1, maxWeightKg:  8, costUsd: 0.65, material: 'Corrugated',    ecoCertified: true },
  { id: 'amz-a4', name: 'Amazon A4',           sku: 'AMZ-A4', lengthCm: 30.4, widthCm: 22.8, heightCm: 12.7, maxWeightKg: 10, costUsd: 0.85, material: 'Corrugated',    ecoCertified: true },
  { id: 'amz-m1', name: 'Amazon Mailer M1',    sku: 'AMZ-M1', lengthCm: 25.4, widthCm: 15.2, heightCm:  2.5, maxWeightKg:  2, costUsd: 0.25, material: 'Kraft Bubble',  ecoCertified: true },
  { id: 'flp-f1', name: 'Flipkart F1',         sku: 'FLP-F1', lengthCm: 18.0, widthCm: 12.0, heightCm: 12.0, maxWeightKg:  5, costUsd: 0.85, material: 'Double Wall',   ecoCertified: true },
  { id: 'flp-f2', name: 'Flipkart F2',         sku: 'FLP-F2', lengthCm: 25.0, widthCm: 20.0, heightCm: 15.0, maxWeightKg: 10, costUsd: 1.20, material: 'Double Wall',   ecoCertified: true },
  { id: 'flp-s1', name: 'Flipkart S1',         sku: 'FLP-S1', lengthCm: 10.0, widthCm: 10.0, heightCm: 10.0, maxWeightKg:  3, costUsd: 0.35, material: 'Corrugated',    ecoCertified: true },
  { id: 'zep-b1', name: 'Zepto Grocery Bag',   sku: 'ZEP-B1', lengthCm: 35.0, widthCm: 20.0, heightCm: 15.0, maxWeightKg:  5, costUsd: 0.15, material: 'Recycled Paper',ecoCertified: true },
  { id: 'zep-b2', name: 'Zepto Large Bag',     sku: 'ZEP-B2', lengthCm: 45.0, widthCm: 25.0, heightCm: 20.0, maxWeightKg: 10, costUsd: 0.25, material: 'Recycled Paper',ecoCertified: true },
  { id: 'bli-b1', name: 'Blinkit Paper Bag',   sku: 'BLI-B1', lengthCm: 30.0, widthCm: 18.0, heightCm: 12.0, maxWeightKg:  5, costUsd: 0.12, material: 'Kraft Paper',   ecoCertified: true },
  { id: 'bli-b2', name: 'Blinkit Cold Bag',    sku: 'BLI-B2', lengthCm: 25.0, widthCm: 20.0, heightCm: 15.0, maxWeightKg:  5, costUsd: 0.55, material: 'Insulated Foil',ecoCertified: true },
  { id: 'fdx-s',  name: 'FedEx Small',         sku: 'FDX-S',  lengthCm: 31.0, widthCm: 27.6, heightCm:  3.8, maxWeightKg:  3, costUsd: 0.50, material: 'Recycled',      ecoCertified: true },
  { id: 'ups-m',  name: 'UPS Medium',          sku: 'UPS-M',  lengthCm: 30.0, widthCm: 20.0, heightCm: 20.0, maxWeightKg: 10, costUsd: 1.10, material: 'Corrugated',    ecoCertified: true },
]

// ─── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const startTime = Date.now()

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Rate limiting ──────────────────────────────────────────────────────
    const rl = checkRateLimit(user.id)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again shortly.', resetIn: Math.ceil(rl.resetIn / 1000) },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rl.resetIn / 1000)),
          },
        }
      )
    }

    // ── Parse body ─────────────────────────────────────────────────────────
    const body = await req.json().catch(() => null)
    if (!body || !Array.isArray(body.products) || body.products.length === 0) {
      return NextResponse.json({ error: 'Invalid request: products array required' }, { status: 400 })
    }

    const products: any[] = body.products.slice(0, 500) // hard cap per request

    // ── Load box catalog ───────────────────────────────────────────────────
    const { data: dbBoxes } = await supabase.from('box_catalog').select('*')
    const boxCatalog =
      dbBoxes && dbBoxes.length > 0
        ? (dbBoxes as any[]).map(b => ({
            id: b.id,
            name: b.name,
            sku: b.sku,
            lengthCm: b.length_cm,
            widthCm: b.width_cm,
            heightCm: b.height_cm,
            maxWeightKg: b.max_weight_kg,
            costUsd: b.cost_usd,
            material: b.material,
            ecoCertified: b.eco_certified,
          }))
        : DEFAULT_CATALOG

    // ── Per-product processor ──────────────────────────────────────────────
    const processProduct = async (p: any) => {
      const prodDimStr: string = p['product L*W*H'] || p['product_l*w*h'] || ''
      const boxDimStr: string  = p['box L*W*H']     || p['box_l*w*h']     || ''
      const price = parseFloat(p['price'] || p['box_price'] || '0')
      const productName: string = p['product_name'] || p['product name'] || 'Unknown Product'
      const productId: string   = p['product_id']   || p['product id']   || `auto-${Date.now()}`

      try {
        const prodDim = parseDimensions(prodDimStr)
        if (!prodDim) throw new Error(`Cannot parse dimensions: "${prodDimStr}"`)

        const dimErr = validateDimensions(prodDim.l, prodDim.w, prodDim.h)
        if (dimErr) throw new Error(dimErr)

        if (isNaN(price) || price < 0) throw new Error('Invalid price value')

        // 1. Cache lookup
        const { data: cached } = await supabase
          .from('optimizations')
          .select('*')
          .eq('product_snapshot->product L*W*H', prodDimStr)
          .order('created_at', { ascending: false })
          .limit(1)
          .single() as any

        if (cached?.ai_response) {
          return {
            product_id: productId,
            product_name: productName,
            original_box: boxDimStr,
            optimized_box: cached.recommended_box,
            cost_before: price,
            cost_after: Math.max(0, price - (cached.cost_savings_usd ?? 0)),
            savings: cached.cost_savings_usd ?? 0,
            efficiency_score: cached.efficiency_score ?? null,
            space_utilization: cached.space_utilization ?? null,
            confidence: cached.ai_response?.confidence ?? null,
            model: cached.ai_model,
            reasoning: cached.ai_response?.reasoning ?? '',
            cached: true,
          }
        }

        // 2. AI optimization — try lightweight Claude first, fall back to free model
        let aiResult: any
        let modelUsed = LIGHTWEIGHT_MODEL
        try {
          aiResult = await runOptimization(
            { productName, weightKg: 0, lengthCm: prodDim.l, widthCm: prodDim.w, heightCm: prodDim.h, fragile: false, availableBoxes: boxCatalog },
            LIGHTWEIGHT_MODEL
          )
        } catch (e1) {
          console.warn('[optimize] Claude failed, falling back to free model:', (e1 as Error).message)
          try {
            aiResult = await runOptimization(
              { productName, weightKg: 0, lengthCm: prodDim.l, widthCm: prodDim.w, heightCm: prodDim.h, fragile: false, availableBoxes: boxCatalog },
              FREE_MODEL
            )
            modelUsed = FREE_MODEL
          } catch (e2) {
            throw new Error(`All AI models failed: ${(e2 as Error).message}`)
          }
        }

        // 3. Persist result
        try {
          await supabase
            .from('optimizations')
            .insert({
              user_id: user.id,
              status: 'completed',
              product_snapshot: p,
              ai_response: aiResult,
              recommended_box: aiResult.recommendedBoxName,
              cost_savings_usd: aiResult.costSavingsUsd,
              efficiency_score: aiResult.efficiencyScore,
              space_utilization: aiResult.spaceUtilization,
              ai_model: modelUsed,
            } as any)
        } catch (dbErr: any) {
          console.warn('[optimize] DB insert failed (non-fatal):', dbErr.message)
        }

        return {
          product_id: productId,
          product_name: productName,
          original_box: boxDimStr,
          optimized_box: aiResult.recommendedBoxName,
          cost_before: price,
          cost_after: Math.max(0, price - aiResult.costSavingsUsd),
          savings: aiResult.costSavingsUsd,
          efficiency_score: aiResult.efficiencyScore ?? null,
          space_utilization: aiResult.spaceUtilization ?? null,
          confidence: aiResult.confidence ?? null,
          model: modelUsed,
          reasoning: aiResult.reasoning ?? '',
          cached: false,
        }
      } catch (err: any) {
        console.error('[optimize] Product error:', err.message)
        return {
          product_id: productId,
          product_name: productName,
          error: err.message,
          status: 'error',
        }
      }
    }

    // ── Parallel execution ─────────────────────────────────────────────────
    const allResults = await Promise.allSettled(products.map(processProduct))
    const results  = allResults.filter(r => r.status === 'fulfilled' && !(r as any).value?.error).map(r => (r as any).value)
    const failed   = allResults.filter(r => r.status === 'rejected' || (r as any).value?.error).map(r =>
      r.status === 'rejected' ? { error: (r as any).reason?.message } : (r as any).value
    )

    const elapsedMs = Date.now() - startTime

    return NextResponse.json(
      {
        success: true,
        results,
        failed,
        count: results.length,
        failedCount: failed.length,
        rateLimit: { remaining: rl.remaining },
      },
      {
        headers: {
          'X-Response-Time': `${elapsedMs}ms`,
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': String(rl.remaining),
        },
      }
    )
  } catch (error: any) {
    const elapsedMs = Date.now() - startTime
    console.error('[optimize] Route error:', error.message)
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500, headers: { 'X-Response-Time': `${elapsedMs}ms` } }
    )
  }
}
