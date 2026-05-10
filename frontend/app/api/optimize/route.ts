import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseDimensions } from '@/lib/utils/parser'
import { runOptimization, LIGHTWEIGHT_MODEL } from '@/lib/openrouter'
import { runHeuristicOptimization, normalizeInput } from '@/lib/optimization/engine'
import type { FragilityLevel, ShippingMethod } from '@/lib/optimization/engine'

export const maxDuration = 60

// ─── Rate Limiter ─────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; windowStart: number }>()
const RATE_LIMIT_MAX = 50
const RATE_LIMIT_WINDOW_MS = 60_000

function checkRateLimit(userId: string) {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 }
  }
  if (entry.count >= RATE_LIMIT_MAX) return { allowed: false, remaining: 0 }
  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count }
}

// ─── Default Box Catalog ──────────────────────────────────────────────────
const DEFAULT_CATALOG = [
  { id: 'amz-a1', name: 'Amazon A1 (Extra Small)',  sku: 'AMZ-A1', lengthCm: 15.0, widthCm: 10.0, heightCm:  5.0, maxWeightKg:  2, costUsd: 0.35, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'amz-a2', name: 'Amazon A2 (Small)',        sku: 'AMZ-A2', lengthCm: 20.0, widthCm: 15.0, heightCm: 10.0, maxWeightKg:  5, costUsd: 0.55, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'amz-a3', name: 'Amazon A3 (Medium)',       sku: 'AMZ-A3', lengthCm: 25.0, widthCm: 20.0, heightCm: 15.0, maxWeightKg:  8, costUsd: 0.75, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'amz-a4', name: 'Amazon A4 (Large)',        sku: 'AMZ-A4', lengthCm: 35.0, widthCm: 25.0, heightCm: 20.0, maxWeightKg: 12, costUsd: 0.95, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'amz-a5', name: 'Amazon A5 (XL)',           sku: 'AMZ-A5', lengthCm: 45.0, widthCm: 35.0, heightCm: 25.0, maxWeightKg: 20, costUsd: 1.35, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'amz-m1', name: 'Amazon Mailer S1',         sku: 'AMZ-M1', lengthCm: 20.0, widthCm: 12.0, heightCm:  2.0, maxWeightKg:  1, costUsd: 0.20, material: 'Kraft Paper', ecoCertified: true,  doubleWall: false },
  { id: 'gen-c1', name: 'Generic Cube (Small)',     sku: 'GEN-C1', lengthCm: 10.0, widthCm: 10.0, heightCm: 10.0, maxWeightKg:  2, costUsd: 0.30, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'dw-001', name: 'Heavy Duty Box (DW)',      sku: 'DW-001', lengthCm: 30.0, widthCm: 25.0, heightCm: 20.0, maxWeightKg: 15, costUsd: 1.20, material: 'Corrugated',  ecoCertified: false, doubleWall: true  },
  { id: 'fk-s1',  name: 'Flipkart S1',             sku: 'FK-S1',  lengthCm: 18.0, widthCm: 12.0, heightCm:  8.0, maxWeightKg:  5, costUsd: 0.40, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'fk-m1',  name: 'Flipkart M1',             sku: 'FK-M1',  lengthCm: 28.0, widthCm: 18.0, heightCm: 12.0, maxWeightKg:  8, costUsd: 0.70, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
]

// ─── Map raw product row → engine input ──────────────────────────────────
function mapProductToEngineInput(p: any, boxCatalog: typeof DEFAULT_CATALOG) {
  const prodDimStr = (p['product L*W*H'] || p['product_dims'] || p['product_l*w*h'] || '').toString()
  const prodDim = parseDimensions(prodDimStr) || { l: 0, w: 0, h: 0 }

  const fragMap: Record<string, FragilityLevel> = {
    low: 'low', medium: 'medium', high: 'high', extreme: 'extreme',
    '1': 'low', '2': 'medium', '3': 'high', '4': 'extreme',
  }
  const rawFragility = (p['fragility'] || p['fragile'] || 'low').toString().toLowerCase()
  const fragility: FragilityLevel = fragMap[rawFragility] || 'low'

  const shipMap: Record<string, ShippingMethod> = {
    standard: 'standard', express: 'express', 'same-day': 'same-day', sameday: 'same-day',
  }
  const rawShip = (p['shipping_method'] || p['shipping'] || 'standard').toString().toLowerCase()
  const shippingMethod: ShippingMethod = shipMap[rawShip] || 'standard'

  return {
    productName:        p['product_name'] || p['name'] || 'Unknown',
    productId:          p['product_id'] || p['sku'] || `id-${Date.now()}`,
    productPriceUsd:    parseFloat(p['price'] || '0'),
    lengthCm:           prodDim.l,
    widthCm:            prodDim.w,
    heightCm:           prodDim.h,
    weightKg:           parseFloat(p['weight_kg'] || p['weight'] || '0.5'),
    fragility,
    quantity:           parseInt(p['quantity'] || '1', 10),
    category:           p['category'] || 'general',
    destinationZone:    Math.min(6, Math.max(1, parseInt(p['zone'] || p['destination_zone'] || '2', 10))),
    shippingMethod,
    currentBoxName:     p['box L*W*H'] || p['box_dims'] || p['current_box'] || undefined,
    currentBoxCostUsd:  parseFloat(p['box_price'] || p['box price'] || '0') || undefined,
    availableBoxes:     boxCatalog,
  }
}

// ─── Map engine recommendation → API response ────────────────────────────
function mapRecommendationToResponse(rec: any, engineInput: any) {
  return {
    product_id:             rec.productId,
    product_name:           rec.productName,
    product_price:          engineInput.productPriceUsd || 0,
    product_dims:           `${engineInput.lengthCm}x${engineInput.widthCm}x${engineInput.heightCm}`,
    product_weight:         engineInput.weightKg,

    original_box:           engineInput.currentBoxName || 'Not specified',
    original_box_cost:      engineInput.currentBoxCostUsd || 0,
    optimized_box:          rec.recommendedBoxName,
    optimized_box_sku:      rec.recommendedBoxSku,
    optimized_box_dims:     rec.recommendedBoxDims,
    optimized_box_cost:     rec.packagingCost,

    packaging_material:     rec.packagingMaterial,
    fill_material:          rec.fillMaterial,

    packaging_cost:         rec.packagingCost,
    shipping_cost:          rec.shippingCost,
    total_cost:             rec.totalCost,
    baseline_cost:          rec.baselineCost,
    cost_before:            rec.baselineCost,
    cost_after:             rec.totalCost,

    savings:                rec.savings,
    savings_percent:        rec.savingsPercent,

    damage_risk:            rec.damageRisk,
    space_utilization:      rec.spaceUtilization,
    confidence_score:       rec.confidenceScore,
    void_reduction:         rec.spaceUtilization,

    fit_score:              rec.fitScore,
    void_score:             rec.voidScore,
    cost_score:             rec.costScore,
    sustainability_score:   rec.sustainabilityScore,
    final_score:            rec.finalScore,

    alternative_box_name:   rec.alternativeBoxName,
    alternative_box_dims:   rec.alternativeBoxDims,

    reasoning:              rec.reasoning,
    packing_tips:           rec.packingTips,
    candidates_evaluated:   rec.candidatesEvaluated,

    model:                  rec.model,
    data_quality:           rec.dataQuality,
    cached:                 false,
  }
}

// ─── POST Handler ─────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rl = checkRateLimit(user.id)
    if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    const body = await req.json().catch(() => null)
    if (!body || !Array.isArray(body.products)) {
      return NextResponse.json({ error: 'Invalid request: products array required' }, { status: 400 })
    }

    const products: any[] = body.products.slice(0, 500)

    // Load box catalog from DB or use default
    const { data: dbBoxes } = await supabase.from('box_catalog').select('*')
    const boxCatalog = (dbBoxes && dbBoxes.length > 0)
      ? (dbBoxes as any[]).map(b => ({
          id: b.id, name: b.name, sku: b.sku,
          lengthCm: b.length_cm, widthCm: b.width_cm, heightCm: b.height_cm,
          maxWeightKg: b.max_weight_kg, costUsd: b.cost_usd,
          material: b.material, ecoCertified: b.eco_certified,
          doubleWall: b.double_wall || false,
        }))
      : DEFAULT_CATALOG

    const processProduct = async (p: any) => {
      const engineInput = mapProductToEngineInput(p, boxCatalog)

      // Validate basic dimensions
      if (engineInput.lengthCm <= 0 || engineInput.widthCm <= 0 || engineInput.heightCm <= 0) {
        return {
          product_id: engineInput.productId,
          product_name: engineInput.productName,
          error: 'Invalid or missing dimensions',
          status: 'error',
        }
      }

      try {
        // Check cache first
        const prodDimStr = `${engineInput.lengthCm}x${engineInput.widthCm}x${engineInput.heightCm}`
        const { data: cached } = await supabase
          .from('optimizations')
          .select('*')
          .eq('product_snapshot->product_dims', prodDimStr)
          .limit(1)
          .single() as any

        if (cached?.ai_response?.recommendedBoxName) {
          const mapped = mapRecommendationToResponse(cached.ai_response, engineInput)
          return { ...mapped, cached: true }
        }

        // Run AI with timeout, fall back to heuristic engine
        let rec: any = null
        let modelUsed = LIGHTWEIGHT_MODEL

        try {
          const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 20000))
          rec = await Promise.race([runOptimization(engineInput, LIGHTWEIGHT_MODEL), timeout])
          modelUsed = LIGHTWEIGHT_MODEL
        } catch (aiErr) {
          console.warn('[AI Failed] Using heuristic engine:', aiErr)
          rec = runHeuristicOptimization(engineInput)
          modelUsed = 'PackVision Heuristic v2.0'
        }

        if (!rec) {
          return {
            product_id: engineInput.productId,
            product_name: engineInput.productName,
            error: 'No suitable box found in catalog',
            status: 'error',
          }
        }

        const response = mapRecommendationToResponse(rec, engineInput)

        // Persist to DB
        try {
          await supabase.from('optimizations').insert({
            user_id: user.id,
            status: 'completed',
            product_snapshot: { ...p, product_dims: prodDimStr },
            ai_response: rec,
            recommended_box: rec.recommendedBoxName,
            cost_savings_usd: rec.savings,
            efficiency_score: rec.finalScore,
            space_utilization: rec.spaceUtilization,
            ai_model: modelUsed,
          } as any)
        } catch (dbErr) {
          console.warn('[DB] Insert failed (non-fatal):', dbErr)
        }

        return response
      } catch (err: any) {
        return {
          product_id: engineInput.productId,
          product_name: engineInput.productName,
          error: err.message,
          status: 'error',
        }
      }
    }

    const allSettled = await Promise.allSettled(products.map(processProduct))
    const results = allSettled
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && !(r.value as any)?.error)
      .map(r => r.value)

    const errors = allSettled
      .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && (r.value as any)?.error))
      .length

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
      errors,
      total: products.length,
    })
  } catch (error: any) {
    console.error('[Optimize API] Fatal error:', error)
    return NextResponse.json({ error: error.message, success: false }, { status: 500 })
  }
}
