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
  // 1. Extra Small Envelopes & Flap Mailers
  { id: 'mailer-xs1', name: 'Premium XS Flap Enveloper',  sku: 'MLR-XS1', lengthCm: 15.2, widthCm: 10.2, heightCm:  2.0, maxWeightKg:  1, costUsd: 0.12, material: 'Kraft Paper', ecoCertified: true,  doubleWall: false },
  { id: 'mailer-xs2', name: 'Document Kraft Envelope S',  sku: 'MLR-XS2', lengthCm: 18.0, widthCm: 12.0, heightCm:  2.0, maxWeightKg:  1.5, costUsd: 0.15, material: 'Kraft Paper', ecoCertified: true,  doubleWall: false },
  { id: 'mailer-xs3', name: 'Document Kraft Envelope M',  sku: 'MLR-XS3', lengthCm: 20.0, widthCm: 15.0, heightCm:  2.5, maxWeightKg:  2, costUsd: 0.18, material: 'Kraft Paper', ecoCertified: true,  doubleWall: false },
  
  // 2. Small Envelopes & Bubble Mailers
  { id: 'mailer-sm1', name: 'Eco-Bubble Mailer S',        sku: 'MLR-SM1', lengthCm: 22.0, widthCm: 16.0, heightCm:  3.0, maxWeightKg:  2, costUsd: 0.22, material: 'Compostable', ecoCertified: true,  doubleWall: false },
  { id: 'mailer-sm2', name: 'Eco-Bubble Mailer M',        sku: 'MLR-SM2', lengthCm: 25.0, widthCm: 18.0, heightCm:  3.5, maxWeightKg:  3, costUsd: 0.26, material: 'Compostable', ecoCertified: true,  doubleWall: false },
  { id: 'mailer-sm3', name: 'Eco-Bubble Mailer L',        sku: 'MLR-SM3', lengthCm: 28.0, widthCm: 20.0, heightCm:  4.0, maxWeightKg:  4, costUsd: 0.30, material: 'Compostable', ecoCertified: true,  doubleWall: false },

  // 3. USPS / FedEx Standard Small Boxes
  { id: 'usps-sm',    name: 'USPS Small Flat Rate Box',   sku: 'USPS-SM', lengthCm: 21.9, widthCm: 14.3, heightCm:  4.8, maxWeightKg:  5, costUsd: 0.35, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'box-xs-cub', name: 'Micro Cube Box XS',          sku: 'BX-XSC',  lengthCm: 10.0, widthCm: 10.0, heightCm: 10.0, maxWeightKg:  2, costUsd: 0.25, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'box-sm-cub', name: 'Mini Cube Box S',            sku: 'BX-SMC',  lengthCm: 15.0, widthCm: 15.0, heightCm: 15.0, maxWeightKg:  4, costUsd: 0.32, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'box-s1',     name: 'Courier Box S1',             sku: 'BX-S1',   lengthCm: 20.0, widthCm: 15.0, heightCm: 10.0, maxWeightKg:  5, costUsd: 0.38, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'box-s2',     name: 'Courier Box S2',             sku: 'BX-S2',   lengthCm: 20.0, widthCm: 20.0, heightCm: 15.0, maxWeightKg:  6, costUsd: 0.44, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },

  // 4. Medium Boxes & Packing Cartons
  { id: 'box-m1',     name: 'Fulfillment Box M1',         sku: 'BX-M1',   lengthCm: 25.0, widthCm: 20.0, heightCm: 15.0, maxWeightKg:  8, costUsd: 0.48, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'box-m2',     name: 'Fulfillment Box M2',         sku: 'BX-M2',   lengthCm: 30.0, widthCm: 20.0, heightCm: 15.0, maxWeightKg: 10, costUsd: 0.55, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'box-m3',     name: 'Fulfillment Box M3',         sku: 'BX-M3',   lengthCm: 30.0, widthCm: 25.0, heightCm: 20.0, maxWeightKg: 12, costUsd: 0.62, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'box-md-cub', name: 'Standard Cube Box M1',       sku: 'BX-MDC1', lengthCm: 20.0, widthCm: 20.0, heightCm: 20.0, maxWeightKg:  8, costUsd: 0.46, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'box-md-cu2', name: 'Standard Cube Box M2',       sku: 'BX-MDC2', lengthCm: 25.0, widthCm: 25.0, heightCm: 25.0, maxWeightKg: 10, costUsd: 0.58, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'usps-md1',   name: 'USPS Medium Flat Rate 1',    sku: 'USPS-MD1',lengthCm: 28.0, widthCm: 22.0, heightCm: 15.0, maxWeightKg:  8, costUsd: 0.60, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'usps-md2',   name: 'USPS Medium Flat Rate 2',    sku: 'USPS-MD2',lengthCm: 35.0, widthCm: 30.0, heightCm: 12.0, maxWeightKg: 10, costUsd: 0.68, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },

  // 5. Large Carton Boxes
  { id: 'box-l1',     name: 'Enterprise Box L1',          sku: 'BX-L1',   lengthCm: 35.0, widthCm: 25.0, heightCm: 20.0, maxWeightKg: 15, costUsd: 0.72, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'box-l2',     name: 'Enterprise Box L2',          sku: 'BX-L2',   lengthCm: 35.0, widthCm: 30.0, heightCm: 25.0, maxWeightKg: 18, costUsd: 0.80, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'box-l3',     name: 'Enterprise Box L3',          sku: 'BX-L3',   lengthCm: 40.0, widthCm: 30.0, heightCm: 20.0, maxWeightKg: 20, costUsd: 0.88, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'box-lg-cub', name: 'Master Cube Box L',          sku: 'BX-LGC',  lengthCm: 30.0, widthCm: 30.0, heightCm: 30.0, maxWeightKg: 18, costUsd: 0.78, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'usps-lg',    name: 'USPS Large Flat Rate Box',   sku: 'USPS-LG', lengthCm: 31.0, widthCm: 31.0, heightCm: 14.0, maxWeightKg: 15, costUsd: 0.75, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'fedex-lg',   name: 'FedEx Standard Large Box',   sku: 'FDX-LG',  lengthCm: 45.0, widthCm: 35.0, heightCm: 25.0, maxWeightKg: 25, costUsd: 1.05, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },

  // 6. Extra Large & Heavy Duty Double-Wall Cartons
  { id: 'box-xl1',    name: 'Master Box XL1',             sku: 'BX-XL1',  lengthCm: 45.0, widthCm: 40.0, heightCm: 30.0, maxWeightKg: 30, costUsd: 1.25, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'box-xl2',    name: 'Master Box XL2',             sku: 'BX-XL2',  lengthCm: 50.0, widthCm: 40.0, heightCm: 30.0, maxWeightKg: 35, costUsd: 1.45, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'box-xl-cub', name: 'Industrial Cube Box XL',     sku: 'BX-XLC',  lengthCm: 40.0, widthCm: 40.0, heightCm: 40.0, maxWeightKg: 35, costUsd: 1.38, material: 'Corrugated',  ecoCertified: true,  doubleWall: false },
  { id: 'dw-hd1',     name: 'Heavy Duty DW Double-Wall S',sku: 'DW-S1',   lengthCm: 30.0, widthCm: 25.0, heightCm: 20.0, maxWeightKg: 25, costUsd: 1.10, material: 'Corrugated',  ecoCertified: false, doubleWall: true  },
  { id: 'dw-hd2',     name: 'Heavy Duty DW Double-Wall M',sku: 'DW-M1',   lengthCm: 40.0, widthCm: 40.0, heightCm: 30.0, maxWeightKg: 40, costUsd: 1.65, material: 'Corrugated',  ecoCertified: false, doubleWall: true  },
  { id: 'dw-hd3',     name: 'Heavy Duty DW Double-Wall L',sku: 'DW-L1',   lengthCm: 50.0, widthCm: 50.0, heightCm: 40.0, maxWeightKg: 50, costUsd: 2.25, material: 'Corrugated',  ecoCertified: false, doubleWall: true  },
]

// ─── Flexible column value finder ────────────────────────────────────────
// Searches for a value in a row object by trying multiple key variants.
// This makes the system resilient to different CSV column naming styles.
function findValue(p: any, ...keys: string[]): string {
  // First try exact matches
  for (const k of keys) {
    if (p[k] !== undefined && p[k] !== null && p[k] !== '') return String(p[k])
  }
  // Then try case-insensitive + normalized matching against all row keys
  const normalizedKeys = keys.map(k => k.toLowerCase().replace(/[\s_\-]+/g, ''))
  for (const rowKey of Object.keys(p)) {
    const normalized = rowKey.toLowerCase().replace(/[\s_\-]+/g, '')
    for (const target of normalizedKeys) {
      // Match if normalized key contains or equals the target
      if (normalized === target || normalized.startsWith(target) || normalized.includes(target)) {
        if (p[rowKey] !== undefined && p[rowKey] !== null && p[rowKey] !== '') return String(p[rowKey])
      }
    }
  }
  return ''
}

// ─── Map raw product row → engine input ──────────────────────────────────
function mapProductToEngineInput(p: any, boxCatalog: typeof DEFAULT_CATALOG) {
  // Product dimensions — supports: "product L*W*H", "product_L*W*H_cm", "product_dims", etc.
  const prodDimStr = findValue(p, 'product L*W*H', 'product_L*W*H', 'product_L*W*H_cm', 'product_dims', 'product_l*w*h', 'dimensions', 'dims', 'lwh')
  const prodDim = parseDimensions(prodDimStr) || { l: 0, w: 0, h: 0 }

  // Fragility mapping
  const fragMap: Record<string, FragilityLevel> = {
    low: 'low', medium: 'medium', high: 'high', extreme: 'extreme',
    '1': 'low', '2': 'medium', '3': 'high', '4': 'extreme',
  }
  const rawFragility = findValue(p, 'fragility', 'fragile') || 'low'
  const fragility: FragilityLevel = fragMap[rawFragility.toLowerCase()] || 'low'

  // Shipping method — includes "surface" mapped to "standard"
  const shipMap: Record<string, ShippingMethod> = {
    standard: 'standard', express: 'express', 'same-day': 'same-day', sameday: 'same-day',
    surface: 'standard', ground: 'standard', economy: 'standard',
  }
  const rawShip = findValue(p, 'shipping_method', 'shipping') || 'standard'
  const shippingMethod: ShippingMethod = shipMap[rawShip.toLowerCase()] || 'standard'

  // Zone — supports numeric (1-6) AND text-based regions (South, North, East, West)
  const zoneTextMap: Record<string, number> = {
    local: 1, south: 2, west: 3, north: 4, east: 5, international: 6,
    zone1: 1, zone2: 2, zone3: 3, zone4: 4, zone5: 5, zone6: 6,
  }
  const rawZone = findValue(p, 'zone', 'destination_zone') || '2'
  const parsedZone = parseInt(rawZone, 10)
  const destinationZone = !isNaN(parsedZone)
    ? Math.min(6, Math.max(1, parsedZone))
    : (zoneTextMap[rawZone.toLowerCase()] || 2)

  // Price — supports price, price_inr, price_usd
  const rawPrice = findValue(p, 'price', 'price_inr', 'price_usd', 'mrp') || '0'

  // Box dimensions — supports: "box L*W*H", "box_L*W*H_cm", "box_dims", etc.
  const boxDimStr = findValue(p, 'box L*W*H', 'box_L*W*H', 'box_L*W*H_cm', 'box_dims', 'current_box', 'current_box_dims')

  // Box price — supports: "box_price", "box price", "box_price_inr"
  const rawBoxPrice = findValue(p, 'box_price', 'box price', 'box_price_inr', 'box_price_usd', 'box_cost') || '0'

  // Parse current box dimensions if available
  let currentBoxLength: number | undefined
  let currentBoxWidth: number | undefined
  let currentBoxHeight: number | undefined

  if (boxDimStr) {
    const parts = boxDimStr.toLowerCase().split(/[x*]/).map(p => parseFloat(p.trim()))
    if (parts.length === 3 && parts.every(p => !isNaN(p))) {
      [currentBoxLength, currentBoxWidth, currentBoxHeight] = parts
    }
  }

  return {
    productName:        findValue(p, 'product_name', 'name') || 'Unknown',
    productId:          findValue(p, 'product_id', 'sku') || `id-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productPriceUsd:    parseFloat(rawPrice) || 0,
    lengthCm:           prodDim.l,
    widthCm:            prodDim.w,
    heightCm:           prodDim.h,
    weightKg:           parseFloat(findValue(p, 'weight_kg', 'weight') || '0.5'),
    fragility,
    quantity:           parseInt(findValue(p, 'quantity', 'qty') || '1', 10),
    category:           findValue(p, 'category', 'product_category') || 'general',
    destinationZone,
    shippingMethod,
    currentBoxName:     boxDimStr || undefined,
    currentBoxLength,
    currentBoxWidth,
    currentBoxHeight,
    currentBoxCostUsd:  parseFloat(rawBoxPrice) || undefined,
    availableBoxes:     boxCatalog,
  }
}

// ─── Map engine recommendation → API response ────────────────────────────
function mapRecommendationToResponse(rec: any, engineInput: any) {
  // Map both AI and Heuristic engine outputs
  const isAI = !!rec.recommended_box
  
  const boxName = isAI ? rec.recommended_box.name : rec.recommendedBoxName
  const boxSku = isAI ? rec.recommended_box.sku : rec.recommendedBoxSku
  const boxDims = isAI ? `${rec.recommended_box.length}x${rec.recommended_box.width}x${rec.recommended_box.height}` : rec.recommendedBoxDims

  return {
    product_id:             rec.productId || engineInput.productId,
    product_name:           rec.productName || engineInput.productName,
    product_price:          engineInput.productPriceUsd || 0,
    product_dims:           `${engineInput.lengthCm}x${engineInput.widthCm}x${engineInput.heightCm}`,
    product_weight:         engineInput.weightKg,

    original_box:           engineInput.currentBoxName || 'Not specified',
    original_box_cost:      engineInput.currentBoxCostUsd || 0,
    optimized_box:          boxName,
    optimized_box_sku:      boxSku,
    optimized_box_dims:     boxDims,
    optimized_box_cost:     rec.packagingCost,

    packaging_material:     rec.packagingMaterial || 'Corrugated',
    fill_material:          rec.fillMaterial || 'Paper Dunnage',

    packaging_cost:         rec.packagingCost,
    shipping_cost:          rec.shippingCost,
    total_cost:             rec.totalCost,
    baseline_cost:          rec.baselineCost || 0,
    cost_before:            rec.baselineCost || 0,
    cost_after:             rec.totalCost,

    savings:                rec.savings || (rec.volume_saved_cm3 ? (rec.estimated_cost_saving_usd || 0) : 0),
    savings_percent:        rec.savingsPercent || rec.volume_saved_percent || 0,

    damage_risk:            rec.damageRisk || 'Low',
    space_utilization:      rec.spaceUtilization || 100 - (rec.voidScore || 0),
    confidence_score:       rec.confidenceScore || (rec.confidence === 'high' ? 95 : rec.confidence === 'medium' ? 75 : 50),
    void_reduction:         rec.voidScore || 0,

    final_score:            rec.finalScore || 85,
    optimization_status:    (engineInput.currentBoxLength && boxDims) ? 
                              (parseFloat(boxDims.split('x')[0]) * parseFloat(boxDims.split('x')[1]) * parseFloat(boxDims.split('x')[2]) < engineInput.currentBoxLength * engineInput.currentBoxWidth * engineInput.currentBoxHeight ? 'improved' : 'larger_than_baseline') : 'standard',

    alternative_box_name:   rec.alternativeBoxName,
    alternative_box_dims:   rec.alternativeBoxDims,

    reasoning:              rec.reasoning,
    packing_tips:           rec.packingTips || [],
    candidates_evaluated:   rec.candidatesEvaluated || 1,

    model:                  rec.model || 'Unknown',
    data_quality:           rec.dataQuality || 'complete',
    cached:                 false,
    
    // New fields from PackIQ prompt
    volume_saved_cm3:       rec.volume_saved_cm3,
    dim_weight_reduction:   rec.dim_weight_reduction_kg,
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

    const products: any[] = body.products

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
          original_box: engineInput.currentBoxName || 'Not specified',
          error: 'Invalid or missing dimensions',
          status: 'error',
          savings: 0,
          total_cost: engineInput.currentBoxCostUsd || 0,
          baseline_cost: engineInput.currentBoxCostUsd || 0,
        }
      }

      try {
        const isBulk = products.length > 1
        const prodDimStr = `${engineInput.lengthCm}x${engineInput.widthCm}x${engineInput.heightCm}`

        if (isBulk) {
          // Bulk uploads skip external network/LLM dependencies for sub-millisecond local speed
          const rec = runHeuristicOptimization(engineInput)
          if (!rec) {
            return {
              product_id: engineInput.productId,
              product_name: engineInput.productName,
              error: 'No suitable smaller box found in catalog',
              status: 'no_smaller_box_available',
            }
          }
          const response = mapRecommendationToResponse(rec, engineInput)

          // Persist to DB asynchronously inside a safe IIFE to bypass write blocking latency
          ;(async () => {
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
                ai_model: 'PackVision Heuristic v2.0',
              } as any)
            } catch (dbErr) {
              console.warn('[DB] Insert failed asynchronously (non-fatal):', dbErr)
            }
          })()

          return response
        }

        // Single-product: Check cache first
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
        const { runOptimization, runQCReview, FREE_MODEL } = await import('@/lib/openrouter')
        let modelUsed = FREE_MODEL

        try {
          const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000))
          rec = await Promise.race([runOptimization(engineInput, FREE_MODEL), timeout])
          modelUsed = FREE_MODEL
          
          if (rec && rec.status === 'no_smaller_box_available') {
            return {
              product_id: engineInput.productId,
              product_name: engineInput.productName,
              original_box: engineInput.currentBoxName || 'Not specified',
              error: rec.reason || 'No smaller box available',
              status: 'no_smaller_box_available',
              savings: 0,
              total_cost: engineInput.currentBoxCostUsd || 0,
              baseline_cost: engineInput.currentBoxCostUsd || 0,
              optimized_box: 'No Smaller Box Fits',
              optimized_box_dims: '—'
            }
          }

          // Quality Control Step
          if (rec) {
            const qc = await runQCReview(rec)
            if (!qc.valid) {
              console.warn('[QC Failed] AI recommendation rejected:', qc.error)
              // If QC fails, we can try heuristic or just return no smaller box
              rec = runHeuristicOptimization(engineInput)
              modelUsed = 'PackVision Heuristic v2.0'
            }
          }

        } catch (aiErr) {
          console.warn('[AI Failed] Using heuristic engine:', aiErr)
          rec = runHeuristicOptimization(engineInput)
          modelUsed = 'PackVision Heuristic v2.0'
        }

        if (!rec) {
          return {
            product_id: engineInput.productId,
            product_name: engineInput.productName,
            error: 'No suitable smaller box found in catalog',
            status: 'no_smaller_box_available',
          }
        }

        const response = mapRecommendationToResponse(rec, engineInput)

        // Log optimization results
        if (response.optimization_status === 'larger_than_baseline') {
          console.warn(`[Optimization] Product ${engineInput.productId} recommended a LARGER box than baseline.`)
        } else if (response.savings > 0) {
          console.log(`[Optimization] Product ${engineInput.productId} optimized! Savings: $${response.savings.toFixed(2)}`)
        }

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
    const results = allSettled.map(r => r.status === 'fulfilled' ? r.value : { error: 'Process failed', status: 'error' })

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
      errorCount: results.filter((r: any) => r.status === 'error').length
    })
  } catch (error: any) {
    console.error('[Optimize API] Fatal error:', error)
    return NextResponse.json({ error: error.message, success: false }, { status: 500 })
  }
}
