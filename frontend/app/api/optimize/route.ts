import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseDimensions } from '@/lib/utils/parser'
import { runOptimization, LIGHTWEIGHT_MODEL, FREE_MODEL } from '@/lib/openrouter'

export const maxDuration = 60 // Max 60 seconds for Pro plan on Vercel

// ─── In-memory rate limiter ─────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT_MAX = 50          
const RATE_LIMIT_WINDOW_MS = 60_000 

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

// ─── Local Heuristic Optimization (Fast Fallback) ────────────────────────────
function localHeuristicOptimization(prod: any, catalog: any[]): any {
  const { l, w, h } = parseDimensions(prod['product L*W*H'] || prod['product_dims'] || '') || { l: 0, w: 0, h: 0 }
  if (l === 0) return null

  const sortedCatalog = [...catalog].sort((a, b) => a.costUsd - b.costUsd || (a.lengthCm * a.widthCm * a.heightCm) - (b.lengthCm * b.widthCm * b.heightCm))

  const bestBox = sortedCatalog.find(box => {
    const dims = [box.lengthCm, box.widthCm, box.heightCm].sort((a, b) => a - b)
    const pDims = [l, w, h].sort((a, b) => a - b)
    return dims[0] >= pDims[0] && dims[1] >= pDims[1] && dims[2] >= pDims[2]
  })

  if (!bestBox) return null

  const originalBoxPrice = parseFloat(prod['box_price'] || prod['box price'] || '1.00')
  const vol = l * w * h
  const boxVol = bestBox.lengthCm * bestBox.widthCm * bestBox.heightCm
  const utilization = Math.min(100, Math.round((vol / boxVol) * 100))

  return {
    recommendedBoxId: bestBox.id,
    recommendedBoxName: bestBox.name,
    recommendedBoxDims: `${bestBox.lengthCm}x${bestBox.widthCm}x${bestBox.heightCm}`,
    efficiencyScore: 70 + (utilization / 4),
    spaceUtilization: utilization,
    productPriceUsd: parseFloat(prod['price'] || '0'),
    boxPriceUsd: bestBox.costUsd,
    costSavingsUsd: Math.max(0.1, originalBoxPrice - bestBox.costUsd),
    co2SavingsKg: 0.15,
    reasoning: `Mathematically selected the smallest fitting box (${bestBox.name}) to minimize void space.`,
    packingTips: ['Place item diagonally.', 'Fill remaining space with dunnage.'],
    model: 'Local Heuristic v1.0'
  }
}

const DEFAULT_CATALOG = [
  { id: 'amz-a1', name: 'Amazon A1 (Extra Small)',   sku: 'AMZ-A1', lengthCm: 15.0, widthCm: 10.0, heightCm:  5.0, maxWeightKg:  2, costUsd: 0.35, material: 'Corrugated',    ecoCertified: true },
  { id: 'amz-a2', name: 'Amazon A2 (Small)',         sku: 'AMZ-A2', lengthCm: 20.0, widthCm: 15.0, heightCm: 10.0, maxWeightKg:  5, costUsd: 0.55, material: 'Corrugated',    ecoCertified: true },
  { id: 'amz-a3', name: 'Amazon A3 (Medium)',        sku: 'AMZ-A3', lengthCm: 25.0, widthCm: 20.0, heightCm: 15.0, maxWeightKg:  8, costUsd: 0.75, material: 'Corrugated',    ecoCertified: true },
  { id: 'amz-a4', name: 'Amazon A4 (Large)',         sku: 'AMZ-A4', lengthCm: 35.0, widthCm: 25.0, heightCm: 20.0, maxWeightKg: 12, costUsd: 0.95, material: 'Corrugated',    ecoCertified: true },
  { id: 'amz-m1', name: 'Amazon Mailer S1',          sku: 'AMZ-M1', lengthCm: 20.0, widthCm: 12.0, heightCm:  2.0, maxWeightKg:  1, costUsd: 0.20, material: 'Kraft Paper',   ecoCertified: true },
  { id: 'gen-c1', name: 'Generic Cube (Small)',      sku: 'GEN-C1', lengthCm: 10.0, widthCm: 10.0, heightCm: 10.0, maxWeightKg:  2, costUsd: 0.30, material: 'Corrugated',    ecoCertified: true },
]

export async function POST(req: Request) {
  const startTime = Date.now()
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rl = checkRateLimit(user.id)
    if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const body = await req.json().catch(() => null)
    if (!body || !Array.isArray(body.products)) return NextResponse.json({ error: 'Invalid products' }, { status: 400 })

    const products: any[] = body.products.slice(0, 500)
    const { data: dbBoxes } = await supabase.from('box_catalog').select('*')
    const boxCatalog = dbBoxes && dbBoxes.length > 0 ? (dbBoxes as any[]).map(b => ({
      id: b.id, name: b.name, sku: b.sku, lengthCm: b.length_cm, widthCm: b.width_cm, heightCm: b.height_cm,
      maxWeightKg: b.max_weight_kg, costUsd: b.cost_usd, material: b.material, ecoCertified: b.eco_certified,
    })) : DEFAULT_CATALOG

    const processProduct = async (p: any) => {
      const prodDimStr = (p['product L*W*H'] || p['product_dims'] || p['product_l*w*h'] || '').toString()
      const boxDimStr = (p['box L*W*H'] || p['box_dims'] || '').toString()
      const productPrice = parseFloat(p['price'] || '0')
      const originalBoxPrice = parseFloat(p['box_price'] || p['box price'] || '0')
      const productName = p['product_name'] || p['name'] || 'Unknown'
      const productId = p['product_id'] || p['sku'] || `id-${Date.now()}`

      try {
        const prodDim = parseDimensions(prodDimStr)
        if (!prodDim) throw new Error('No dims')

        // 1. Cache
        const { data: cached } = await supabase.from('optimizations').select('*').eq('product_snapshot->product L*W*H', prodDimStr).limit(1).single() as any
        if (cached?.ai_response) return { ...cached.ai_response, product_id: productId, product_name: productName, original_box: boxDimStr, cached: true }

        // 2. AI with Timeout
        let aiResult: any
        let modelUsed = LIGHTWEIGHT_MODEL
        const optInput = { productName, productPriceUsd: productPrice, weightKg: 0.5, lengthCm: prodDim.l, widthCm: prodDim.w, heightCm: prodDim.h, fragile: false, currentBoxDims: boxDimStr, currentBoxPrice: originalBoxPrice, availableBoxes: boxCatalog }

        try {
          const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 20000))
          aiResult = await Promise.race([runOptimization(optInput, LIGHTWEIGHT_MODEL), timeout])
        } catch (e) {
          console.warn('[AI Failed] Falling back to heuristic:', e)
          aiResult = localHeuristicOptimization(p, boxCatalog)
          modelUsed = 'heuristic'
        }

        if (!aiResult) throw new Error('No result')

        // 3. Persist
        await supabase.from('optimizations').insert({
          user_id: user.id, status: 'completed', product_snapshot: p, ai_response: aiResult,
          recommended_box: aiResult.recommendedBoxName, cost_savings_usd: aiResult.costSavingsUsd,
          efficiency_score: aiResult.efficiencyScore, space_utilization: aiResult.spaceUtilization, ai_model: modelUsed,
        } as any).catch(e => console.warn('DB error', e))

        return {
          product_id: productId, product_name: productName, product_price: productPrice, box_price: aiResult.boxPriceUsd,
          original_box: boxDimStr, original_box_price: originalBoxPrice, optimized_box: aiResult.recommendedBoxName,
          optimized_box_dims: aiResult.recommendedBoxDims, optimized_box_cost: aiResult.boxPriceUsd,
          cost_before: originalBoxPrice, cost_after: aiResult.boxPriceUsd, savings: aiResult.costSavingsUsd,
          efficiency_score: aiResult.efficiencyScore, space_utilization: aiResult.spaceUtilization, model: modelUsed, cached: false,
        }
      } catch (err: any) {
        return { product_id: productId, product_name: productName, error: err.message, status: 'error' }
      }
    }

    const allResults = await Promise.allSettled(products.map(processProduct))
    const results = allResults.filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && !r.value.error).map(r => r.value)
    return NextResponse.json({ success: true, results, count: results.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message, success: false }, { status: 500 })
  }
}
