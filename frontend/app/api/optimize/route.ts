import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseDimensions } from '@/lib/utils/parser'
import { runOptimization, LIGHTWEIGHT_MODEL, FREE_MODEL } from '@/lib/openrouter'

export const maxDuration = 60 // Max 60 seconds for Pro plan on Vercel

// ─── In-memory rate limiter ─────────────────────────────────────────────────
// Map<userId, { count: number; windowStart: number }>
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT_MAX = 50          // increased for batching
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
  // Amazon Standards
  { id: 'amz-a1', name: 'Amazon A1 (Extra Small)',   sku: 'AMZ-A1', lengthCm: 15.0, widthCm: 10.0, heightCm:  5.0, maxWeightKg:  2, costUsd: 0.35, material: 'Corrugated',    ecoCertified: true },
  { id: 'amz-a2', name: 'Amazon A2 (Small)',         sku: 'AMZ-A2', lengthCm: 20.0, widthCm: 15.0, heightCm: 10.0, maxWeightKg:  5, costUsd: 0.55, material: 'Corrugated',    ecoCertified: true },
  { id: 'amz-a3', name: 'Amazon A3 (Medium)',        sku: 'AMZ-A3', lengthCm: 25.0, widthCm: 20.0, heightCm: 15.0, maxWeightKg:  8, costUsd: 0.75, material: 'Corrugated',    ecoCertified: true },
  { id: 'amz-a4', name: 'Amazon A4 (Large)',         sku: 'AMZ-A4', lengthCm: 35.0, widthCm: 25.0, heightCm: 20.0, maxWeightKg: 12, costUsd: 0.95, material: 'Corrugated',    ecoCertified: true },
  { id: 'amz-m1', name: 'Amazon Mailer S1',          sku: 'AMZ-M1', lengthCm: 20.0, widthCm: 12.0, heightCm:  2.0, maxWeightKg:  1, costUsd: 0.20, material: 'Kraft Paper',   ecoCertified: true },

  // Flipkart Standards
  { id: 'flp-s1', name: 'Flipkart Small (S1)',       sku: 'FLP-S1', lengthCm: 18.0, widthCm: 12.0, heightCm:  8.0, maxWeightKg:  3, costUsd: 0.40, material: 'Double Wall',   ecoCertified: true },
  { id: 'flp-m1', name: 'Flipkart Medium (M1)',      sku: 'FLP-M1', lengthCm: 28.0, widthCm: 18.0, heightCm: 12.0, maxWeightKg:  7, costUsd: 0.70, material: 'Double Wall',   ecoCertified: true },
  { id: 'flp-l1', name: 'Flipkart Large (L1)',       sku: 'FLP-L1', lengthCm: 40.0, widthCm: 30.0, heightCm: 25.0, maxWeightKg: 15, costUsd: 1.10, material: 'Double Wall',   ecoCertified: true },

  // Zepto/Blinkit (Quick Commerce)
  { id: 'zep-b1', name: 'Zepto Eco Bag (S)',         sku: 'ZEP-B1', lengthCm: 30.0, widthCm: 20.0, heightCm: 10.0, maxWeightKg:  4, costUsd: 0.12, material: 'Recycled Paper',ecoCertified: true },
  { id: 'zep-b2', name: 'Zepto Cargo Bag (M)',       sku: 'ZEP-B2', lengthCm: 45.0, widthCm: 30.0, heightCm: 15.0, maxWeightKg:  8, costUsd: 0.22, material: 'Recycled Paper',ecoCertified: true },
  { id: 'bli-c1', name: 'Blinkit Chill Bag',         sku: 'BLI-C1', lengthCm: 25.0, widthCm: 20.0, heightCm: 20.0, maxWeightKg:  6, costUsd: 0.65, material: 'Thermal Foil',  ecoCertified: true },

  // Global Shippers
  { id: 'fdx-s1', name: 'FedEx Small Box',           sku: 'FDX-S1', lengthCm: 31.4, widthCm: 23.8, heightCm:  3.0, maxWeightKg:  5, costUsd: 0.85, material: 'Cardboard',     ecoCertified: true },
  { id: 'ups-m1', name: 'UPS Medium Box',            sku: 'UPS-M1', lengthCm: 40.0, widthCm: 30.0, heightCm: 30.0, maxWeightKg: 15, costUsd: 1.45, material: 'Heavy Duty',    ecoCertified: true },
  { id: 'dhl-j1', name: 'DHL Jumbo Box',             sku: 'DHL-J1', lengthCm: 60.0, widthCm: 50.0, heightCm: 40.0, maxWeightKg: 30, costUsd: 2.80, material: 'Triple Wall',   ecoCertified: true },

  // Generic / Custom
  { id: 'gen-c1', name: 'Generic Cube (Small)',      sku: 'GEN-C1', lengthCm: 10.0, widthCm: 10.0, heightCm: 10.0, maxWeightKg:  2, costUsd: 0.30, material: 'Corrugated',    ecoCertified: true },
  { id: 'gen-p1', name: 'Poster Tube (L)',           sku: 'GEN-P1', lengthCm: 60.0, widthCm:  8.0, heightCm:  8.0, maxWeightKg:  3, costUsd: 1.20, material: 'Fiberboard',    ecoCertified: true },
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
      // Find aliases for dimensions
      const prodDimStr: string = (p['product L*W*H'] || p['product_l*w*h'] || p['product_dims'] || p['dims'] || p['Dimensions'] || p['product_dimensions'] || '').toString()
      const boxDimStr: string  = (p['box L*W*H'] || p['box_l*w*h'] || p['box_dims'] || p['current used box L*W*H'] || p['original_box'] || '').toString()
      
      // Find aliases for prices
      const productPrice = parseFloat(p['price'] || p['product_price'] || p['product price'] || p['Product Price'] || '0')
      const originalBoxPrice = parseFloat(p['box_price'] || p['box price'] || p['current_box_price'] || p['Original Box Cost'] || '0')
      
      // Find aliases for names/ids
      const productName: string = p['product_name'] || p['product name'] || p['Product Name'] || p['name'] || 'Unknown Product'
      const productId: string   = p['product_id'] || p['product id'] || p['Product ID'] || p['sku'] || p['SKU'] || `auto-${Date.now()}`

      try {
        const prodDim = parseDimensions(prodDimStr)
        if (!prodDim) throw new Error(`Cannot parse dimensions: "${prodDimStr}"`)

        const dimErr = validateDimensions(prodDim.l, prodDim.w, prodDim.h)
        if (dimErr) throw new Error(dimErr)

        if (isNaN(productPrice)) throw new Error('Invalid product price value')

        // 1. Cache lookup
        const { data: cached } = await supabase
          .from('optimizations')
          .select('*')
          .eq('product_snapshot->product L*W*H', prodDimStr)
          .order('created_at', { ascending: false })
          .limit(1)
          .single() as any

        if (cached?.ai_response) {
          const aiRes = cached.ai_response
          return {
            product_id: productId,
            product_name: productName,
            product_price: productPrice,
            box_price: aiRes.boxPriceUsd || 0,
            original_box: boxDimStr,
            original_box_price: originalBoxPrice,
            optimized_box: cached.recommended_box,
            optimized_box_dims: aiRes.recommendedBoxDims || '20x15x10',
            optimized_box_cost: aiRes.boxPriceUsd || 0,
            cost_before: originalBoxPrice, // Assuming cost refers to shipping/box cost
            cost_after: aiRes.boxPriceUsd || 0,
            savings: Math.max(0, originalBoxPrice - (aiRes.boxPriceUsd || 0)),
            efficiency_score: cached.efficiency_score ?? null,
            space_utilization: cached.space_utilization ?? null,
            model: cached.ai_model,
            reasoning: aiRes.reasoning ?? '',
            cached: true,
          }
        }

        // 2. AI optimization
        let aiResult: any
        let modelUsed = LIGHTWEIGHT_MODEL
        const optInput: any = { 
          productName, 
          productPriceUsd: productPrice,
          weightKg: 0, 
          lengthCm: prodDim.l, 
          widthCm: prodDim.w, 
          heightCm: prodDim.h, 
          fragile: false, 
          currentBoxDims: boxDimStr,
          currentBoxPrice: originalBoxPrice,
          availableBoxes: boxCatalog 
        }

        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AI Request Timed Out')), 25000)
          );

          try {
            aiResult = await Promise.race([
              runOptimization(optInput, LIGHTWEIGHT_MODEL),
              timeoutPromise
            ]);
          } catch (e1) {
            console.warn('[optimize] Claude/Timeout failed, falling back to free model:', (e1 as Error).message);
            aiResult = await Promise.race([
              runOptimization(optInput, FREE_MODEL),
              timeoutPromise
            ]);
            modelUsed = FREE_MODEL;
          }
        } catch (e2) {
          console.warn(`[optimize] All AI models failed or timed out: ${(e2 as Error).message}. Using fallback result.`);
          // FALLBACK RESULT: Ensure the pipeline never breaks
          aiResult = {
            recommendedBoxId: 'fallback-id',
            recommendedBoxName: boxDimStr || 'Standard Fallback Box',
            recommendedBoxDims: boxDimStr || '20x15x10',
            efficiencyScore: 50,
            spaceUtilization: 50,
            productPriceUsd: productPrice,
            boxPriceUsd: originalBoxPrice,
            costSavingsUsd: 0,
            co2SavingsKg: 0,
            reasoning: 'System overloaded. Using fallback dimensions to ensure processing continuity.',
            packingTips: ['Standard packing recommended.']
          };
          modelUsed = 'fallback';
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
              cost_savings_usd: Math.max(0, originalBoxPrice - (aiResult.boxPriceUsd || 0)),
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
          product_price: productPrice,
          box_price: aiResult.boxPriceUsd || 0,
          original_box: boxDimStr,
          original_box_price: originalBoxPrice,
          optimized_box: aiResult.recommendedBoxName,
          optimized_box_dims: aiResult.recommendedBoxDims || '20x15x10',
          optimized_box_cost: aiResult.boxPriceUsd || 0,
          cost_before: originalBoxPrice,
          cost_after: aiResult.boxPriceUsd || 0,
          savings: Math.max(0, originalBoxPrice - (aiResult.boxPriceUsd || 0)),
          efficiency_score: aiResult.efficiencyScore ?? null,
          space_utilization: aiResult.spaceUtilization ?? null,
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
    
    const results = allResults
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && !r.value.error)
      .map(r => r.value)
    
    const failed = allResults
      .map((r, idx) => {
        if (r.status === 'rejected') return { product_name: products[idx]?.product_name || 'Unknown', error: r.reason?.message || 'Unknown rejection' }
        if (r.value.error) return r.value
        return null
      })
      .filter(f => f !== null)

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
