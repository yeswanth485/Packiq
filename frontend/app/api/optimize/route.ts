import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { parseDimensions } from '@/lib/utils/parser'
import { runOptimization, LIGHTWEIGHT_MODEL } from '@/lib/openrouter'
import { runHeuristicOptimization, normalizeInput, runProductionOptimization } from '@/lib/optimization/engine'
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
  // Then try case-insensitive + normalized EXACT matching against all row keys
  const normalizedKeys = keys.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''))
  for (const rowKey of Object.keys(p)) {
    const normalized = rowKey.toLowerCase().replace(/[^a-z0-9]/g, '')
    for (const target of normalizedKeys) {
      if (normalized === target) {
        if (p[rowKey] !== undefined && p[rowKey] !== null && p[rowKey] !== '') return String(p[rowKey])
      }
    }
  }
  // If still not found, try relaxed matching but ensure target length similarity to prevent false matching
  for (const rowKey of Object.keys(p)) {
    const normalized = rowKey.toLowerCase().replace(/[^a-z0-9]/g, '')
    for (const target of normalizedKeys) {
      if (normalized.includes(target) && Math.abs(normalized.length - target.length) <= 3) {
        if (p[rowKey] !== undefined && p[rowKey] !== null && p[rowKey] !== '') return String(p[rowKey])
      }
    }
  }
  return ''
}

// ─── Map raw product row → engine input ──────────────────────────────────
function mapProductToEngineInput(p: any, boxCatalog: typeof DEFAULT_CATALOG) {
  // Parse product dimensions — supports separate columns AND combined string
  let l = 0, w = 0, h = 0
  const plVal = findValue(p, 'product_length', 'product_l', 'length', 'l', 'len')
  const pwVal = findValue(p, 'product_width', 'product_w', 'width', 'w')
  const phVal = findValue(p, 'product_height', 'product_h', 'height', 'h')

  if (plVal && pwVal && phVal) {
    l = parseFloat(plVal)
    w = parseFloat(pwVal)
    h = parseFloat(phVal)
  } else {
    const prodDimStr = findValue(
      p, 
      'product L*W*H', 'product_L*W*H', 'product_L*W*H_cm', 'product_dims', 'product_dimensions',
      'product_l*w*h', 'dimensions', 'dims', 'lwh', 'product_l_w_h',
      'item_dims', 'item L*W*H'
    )
    const prodDim = parseDimensions(prodDimStr)
    if (prodDim) {
      l = prodDim.l
      w = prodDim.w
      h = prodDim.h
    }
  }

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

  // Parse baseline / current box dimensions — supports separate columns AND combined string
  let currentBoxLength: number | undefined
  let currentBoxWidth: number | undefined
  let currentBoxHeight: number | undefined

  const blVal = findValue(p, 'current_box_length', 'current_box_l', 'box_length', 'box_l', 'baseline_length', 'baseline_l', 'original_box_length', 'original_box_l')
  const bwVal = findValue(p, 'current_box_width', 'current_box_w', 'box_width', 'box_w', 'baseline_width', 'baseline_w', 'original_box_width', 'original_box_w')
  const bhVal = findValue(p, 'current_box_height', 'current_box_h', 'box_height', 'box_h', 'baseline_height', 'baseline_h', 'original_box_height', 'original_box_h')

  if (blVal && bwVal && bhVal) {
    currentBoxLength = parseFloat(blVal)
    currentBoxWidth = parseFloat(bwVal)
    currentBoxHeight = parseFloat(bhVal)
  }

  const boxDimStr = findValue(
    p, 
    'box L*W*H', 'box_L*W*H', 'box_L*W*H_cm', 'box_dims', 'box_dimensions',
    'current_box', 'current_box_dims', 'current_box_dimensions',
    'current used box L*W*H', 'current_used_box_l_w_h',
    'baseline_box', 'baseline_box_dims', 'baseline_box_dimensions', 'baseline box L*W*H',
    'box', 'original_box', 'original box'
  )

  if ((!currentBoxLength || !currentBoxWidth || !currentBoxHeight) && boxDimStr) {
    const parts = boxDimStr.toLowerCase().split(/[x*]/).map(p => parseFloat(p.trim()))
    if (parts.length === 3 && parts.every(p => !isNaN(p))) {
      [currentBoxLength, currentBoxWidth, currentBoxHeight] = parts
    }
  }

  // Box price — supports: "box_price", "box price", "box_price_inr"
  const rawBoxPrice = findValue(
    p, 
    'box_price', 'box price', 'box_price_inr', 'box_price_usd', 'box_cost', 'box cost',
    'current_box_price', 'current_box_cost', 'baseline_box_price', 'baseline_box_cost'
  ) || '0'

  return {
    productName:        findValue(p, 'product_name', 'name') || 'Unknown',
    productId:          findValue(p, 'product_id', 'sku') || `id-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    productPriceUsd:    parseFloat(rawPrice) || 0,
    lengthCm:           l,
    widthCm:            w,
    heightCm:           h,
    weightKg:           parseFloat(findValue(p, 'weight_kg', 'weight') || '0.5'),
    fragility,
    quantity:           parseInt(findValue(p, 'quantity', 'qty') || '1', 10),
    category:           findValue(p, 'category', 'product_category') || 'general',
    destinationZone,
    shippingMethod,
    currentBoxName:     boxDimStr || (currentBoxLength ? `${currentBoxLength}x${currentBoxWidth}x${currentBoxHeight}` : undefined),
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
    volume_saved_cm3:       rec.volumeSavedCm3 || rec.volume_saved_cm3 || 0,
    dim_weight_reduction:   rec.dimWeightReduction || rec.dim_weight_reduction_kg || 0,
    top_alternatives:       rec.topAlternatives || [],
    score_breakdown:        rec.scoreBreakdown || null,
    engine_version:         rec.engineVersion || 'PackVision Heuristic v2.0',
    fit_check_passed:       rec.fitCheckPassed ?? true,
    clearance_used:         rec.clearanceUsed || 0,
  }
}

import { runMLOptimization } from '@/lib/optimization/mlOptimizer'

// ─── POST Handler ─────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = await createServiceClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rl = checkRateLimit(user.id)
    if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })

    // 1. Fetch user profile plan details
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const plan = (profile as any)?.plan || 'free'
    
    // Quota Limit Rules: Free (20), Starter (100), Growth (500), Enterprise (Unlimited)
    let limit = 20
    if (plan === 'starter') limit = 100
    if (plan === 'growth') limit = 500
    if (plan === 'enterprise') limit = 9999999
    
    // 2. Query total optimizations count from optimization_sessions
    const { count } = await supabase
      .from('optimization_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      
    const currentUsage = count || 0
    if (currentUsage >= limit) {
      return NextResponse.json({
        error: 'QUOTA_EXCEEDED',
        message: `Subscription limit exceeded. You have used ${currentUsage} of your ${limit} allotted optimizations under the ${plan.toUpperCase()} plan. Please upgrade your plan in the Subscriptions tab to continue optimizing.`,
        limit,
        usage: currentUsage
      }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    if (!body || !Array.isArray(body.products)) {
      return NextResponse.json({ error: 'Invalid request: products array required' }, { status: 400 })
    }

    const products: any[] = body.products
    const fileName = body.file_name || 'Bulk Upload'

    // Load box catalog from DB or use default
    const { data: dbBoxes } = await supabase.from('box_catalog').select('*')
    const boxes = (dbBoxes && dbBoxes.length > 0)
      ? (dbBoxes as any[]).map(b => ({
          id: b.id,
          name: b.name,
          sku: b.sku,
          length_cm: Number(b.length_cm),
          width_cm: Number(b.width_cm),
          height_cm: Number(b.height_cm),
          weight_limit_kg: Number(b.weight_limit_kg || b.max_weight_kg || 30),
          cost: Number(b.cost_usd || b.cost || 0.50),
          eco_certified: b.eco_certified || false,
          double_wall: b.double_wall || false,
        }))
      : DEFAULT_CATALOG.map(b => ({
          id: b.id,
          name: b.name,
          sku: b.sku,
          length_cm: b.lengthCm,
          width_cm: b.widthCm,
          height_cm: b.heightCm,
          weight_limit_kg: b.maxWeightKg,
          cost: b.costUsd,
          eco_certified: b.ecoCertified,
          double_wall: b.doubleWall
        }))

    // Map input products to exact format required by ML optimizer
    const mappedProducts = products.map((p, idx) => {
      let l = 0, w = 0, h = 0
      const plVal = findValue(p, 'product_length', 'product_l', 'length', 'l', 'len', 'length_cm')
      const pwVal = findValue(p, 'product_width', 'product_w', 'width', 'w', 'width_cm')
      const phVal = findValue(p, 'product_height', 'product_h', 'height', 'h', 'height_cm')

      if (plVal && pwVal && phVal) {
        l = parseFloat(plVal)
        w = parseFloat(pwVal)
        h = parseFloat(phVal)
      } else {
        const prodDimStr = findValue(
          p, 
          'product L*W*H', 'product_L*W*H', 'product_L*W*H_cm', 'product_dims', 'product_dimensions',
          'product_l*w*h', 'dimensions', 'dims', 'lwh', 'product_l_w_h',
          'item_dims', 'item L*W*H'
        )
        const prodDim = parseDimensions(prodDimStr)
        if (prodDim) {
          l = prodDim.l
          w = prodDim.w
          h = prodDim.h
        }
      }

      const blVal = findValue(p, 'current_box_length', 'current_box_l', 'box_length', 'box_l', 'baseline_length', 'baseline_l', 'original_box_length', 'original_box_l', 'current_box_l_cm')
      const bwVal = findValue(p, 'current_box_width', 'current_box_w', 'box_width', 'box_w', 'baseline_width', 'baseline_w', 'original_box_width', 'original_box_w', 'current_box_w_cm')
      const bhVal = findValue(p, 'current_box_height', 'current_box_h', 'box_height', 'box_h', 'baseline_height', 'baseline_h', 'original_box_height', 'original_box_h', 'current_box_h_cm')
      
      let bl: number | undefined
      let bw: number | undefined
      let bh: number | undefined
      if (blVal && bwVal && bhVal) {
        bl = parseFloat(blVal)
        bw = parseFloat(bwVal)
        bh = parseFloat(bhVal)
      }

      return {
        product_id: findValue(p, 'product_id', 'sku') || `SKU-AUTO-${idx + 1}`,
        product_name: findValue(p, 'product_name', 'name') || `Item ${idx + 1}`,
        name: findValue(p, 'product_name', 'name') || `Item ${idx + 1}`,
        length_cm: l,
        width_cm: w,
        height_cm: h,
        weight_kg: parseFloat(findValue(p, 'weight_kg', 'weight') || '0.5'),
        category: findValue(p, 'category', 'product_category') || 'general',
        fragility: findValue(p, 'fragility', 'fragile') || 'low',
        quantity: parseInt(findValue(p, 'quantity', 'qty') || '1', 10),
        current_box_name: findValue(p, 'current_box_name', 'box') || (bl ? `${bl}x${bw}x${bh}` : undefined),
        current_box_length: bl,
        current_box_width: bw,
        current_box_height: bh
      }
    })

    // Execute XGBoost-inspired ML optimization
    const mlResult = runMLOptimization(mappedProducts, boxes)

    // STEP 1: Create the session record
    const successful = mlResult.assignments.filter(a => a.fits === true && a.assignedBox !== null);
    const failed = mlResult.assignments.filter(a => !a.fits || !a.assignedBox);
    
    const { data: session, error: sessionError } = await (supabaseAdmin as any)
      .from('optimization_sessions')
      .insert({
        user_id:            user.id,
        file_name:          fileName,
        file_size_bytes:    0, // not provided in current payload
        total_items:        mlResult.assignments.length,
        optimized_items:    successful.length,
        unoptimized_items:  failed.length,
        optimization_rate:  mlResult.assignments.length > 0 
                              ? (successful.length / mlResult.assignments.length) * 100 
                              : 0,
        estimated_savings:  successful.reduce((s, a) => s + ((a as any).savings_amount || a.savings || 0), 0),
        high_risk_count:    mlResult.assignments.filter(a => a.fragility === 'High').length,
        medium_risk_count:  mlResult.assignments.filter(a => a.fragility === 'Medium').length,
        low_risk_count:     mlResult.assignments.filter(a => a.fragility === 'Low' || !a.fragility).length,
        status:             'completed',
        completed_at:       new Date().toISOString(),
      })
      .select('id')
      .single()

    if (sessionError || !session) {
      console.error('[DB] Failed to insert optimization_sessions:', sessionError)
    }

    const sessionId = session?.id || crypto.randomUUID();

    // STEP 2: Save ALL individual results to optimization_results table
    const resultRows = mlResult.assignments.map(originalA => {
      const a = originalA as any;
      const pSnapshot = mappedProducts.find(prod => prod.product_id === a.sku) || ({} as any);

      // Resolve dimensions (prefer assignment, then mapped product snapshot)
      const length_cm = Number(a.dimensions?.l ?? pSnapshot.length_cm ?? 0);
      const width_cm = Number(a.dimensions?.w ?? pSnapshot.width_cm ?? 0);
      const height_cm = Number(a.dimensions?.h ?? pSnapshot.height_cm ?? 0);

      // Basic validation: dimensions must be > 0
      const missingDims = !(length_cm > 0 && width_cm > 0 && height_cm > 0);

      // Resolve old/new costs
      const oldCost = Number(pSnapshot.current_box_cost ?? pSnapshot.currentBoxCostUsd ?? (a.baselineCost ?? 0) ?? 0);
      const newCost = Number(a.assignedBox?.cost ?? a.optimized_box_cost ?? null);

      // Compute savings_amount and savings_pct deterministically when possible
      let savings_amount = a.savings_amount ?? a.savings ?? null;
      if ((savings_amount === null || savings_amount === undefined) && oldCost && newCost) {
        savings_amount = Math.max(0, oldCost - newCost);
      }
      let savings_pct = a.savings_pct ?? a.savingsPercent ?? a.savings ?? null;
      if ((savings_pct === null || savings_pct === undefined) && oldCost) {
        savings_pct = oldCost > 0 ? (savings_amount ? (savings_amount / oldCost) * 100 : 0) : null;
      }

      // Normalize fragility level casing
      const frag = (a.fragility || pSnapshot.fragility || 'Low').toString();
      const fragility_level = frag.charAt(0).toUpperCase() + frag.slice(1).toLowerCase();

      // Deterministic zone: prefer assignment, then product snapshot, else default 2
      const zoneValue = a.zone || pSnapshot.destinationZone || pSnapshot.destination_zone || pSnapshot.destinationZone || null;
      const zone = zoneValue ? (typeof zoneValue === 'number' ? `ZONE ${zoneValue}` : String(zoneValue)) : 'ZONE 2';

      // If dimensions are missing, mark as failed with clear reason
      const isOptimized = !missingDims && (a.fits === true && a.assignedBox !== null);
      const failureReason = missingDims ? 'Missing or invalid product dimensions' : ((!a.fits || !a.assignedBox) ? (a.reason || a.failure_reason || 'No suitable box found') : null);

      return {
        session_id:           sessionId,
        user_id:              user.id,
        sku:                  a.sku,
        product_name:         a.name || a.sku,
        length_cm:            length_cm,
        width_cm:             width_cm,
        height_cm:            height_cm,
        weight_kg:            Number(a.weight ?? pSnapshot.weight_kg ?? 0),
        quantity:             a.quantity ?? pSnapshot.quantity ?? 1,

        is_optimized:         Boolean(isOptimized),
        failure_reason:       failureReason,

        old_box_name:         pSnapshot.current_box_name || (a.alternatives?.[0]?.box?.name || 'Standard Box'),
        old_box_dims:         (pSnapshot.current_box_length && pSnapshot.current_box_width && pSnapshot.current_box_height)
                                ? `${pSnapshot.current_box_length}x${pSnapshot.current_box_width}x${pSnapshot.current_box_height}`
                                : (a.alternatives?.[0]?.box ? `${a.alternatives[0].box.length_cm}x${a.alternatives[0].box.width_cm}x${a.alternatives[0].box.height_cm}` : `${length_cm}x${width_cm}x${height_cm}`),
        old_box_cost:         oldCost || (a.assignedBox?.cost ? a.assignedBox.cost * 1.45 : 0),

        new_box_id:           a.assignedBox?.id || null,
        new_box_name:         a.assignedBox?.name || null,
        new_box_dims:         a.assignedBox ? `${a.assignedBox.length_cm}x${a.assignedBox.width_cm}x${a.assignedBox.height_cm}` : null,
        new_box_cost:         newCost || null,
        new_box_length_cm:    a.assignedBox?.length_cm || null,
        new_box_width_cm:     a.assignedBox?.width_cm || null,
        new_box_height_cm:    a.assignedBox?.height_cm || null,

        ml_score:             a.score_breakdown?.totalScore ?? a.score_breakdown?.space_score ?? null,
        void_percentage:      a.volume_utilization ? Math.round(100 - a.volume_utilization) : null,
        volume_utilization:   a.volume_utilization ?? null,
        savings_pct:          savings_pct !== null ? Number(savings_pct) : null,
        savings_amount:       savings_amount !== null ? Number(savings_amount) : null,
        recommendation_reason: a.recommendation_reason || null,
        score_breakdown:      a.score_breakdown || null,
        orientation:          a.orientation || null,
        alternatives:         a.alternatives?.slice(0, 3).map((alt: any) => ({ box_name: alt.box?.name || alt.name, score: alt.score })) || null,

        fragility_score:      fragility_level === 'High' ? 90 : fragility_level === 'Medium' ? 60 : 30,
        fragility_level:      fragility_level,
        fragility_label:      fragility_level === 'High' ? '🔴 High Risk' : fragility_level === 'Medium' ? '🟡 Medium Risk' : '🟢 Low Risk',
        fragility_recommendation: fragility_level === 'High' ? 'Use double-walled boxes.' : 'Standard packing sufficient.',

        zone:                 zone,
        tracking_id:          a.tracking_id || ('PKQ-' + (a.sku || '').toString().replace(/[^A-Z0-9]/gi, '').toUpperCase() + '-' + Date.now().toString(36).toUpperCase()),
        carrier:              a.carrier || 'Standard',
        created_at:           new Date().toISOString(),
      };
    });

    const CHUNK = 100;
    const savedResults: any[] = []
    for (let i = 0; i < resultRows.length; i += CHUNK) {
      const chunk = resultRows.slice(i, i + CHUNK);
      // Return inserted rows so frontend can reference optimization_result_id
      const { data: insertedData, error: insertError } = await (supabaseAdmin as any)
        .from('optimization_results')
        .insert(chunk)
        .select('*')
      if (insertError) {
        console.error('[DB] Results insert error (chunk ' + i + '):', insertError);
      } else if (insertedData && Array.isArray(insertedData)) {
        savedResults.push(...insertedData)
      }
    }

    // STEP 3: Upsert products into products master table
    const productRows = mlResult.assignments.map(originalA => {
      const a = originalA as any;
      const pSnapshot = mappedProducts.find(prod => prod.product_id === a.sku) || {} as any;
      return {
        user_id:    user.id,
        sku:        a.sku,
        name:       a.name || a.sku,
        length_cm:  a.dimensions?.l || pSnapshot.length_cm || 0,
        width_cm:   a.dimensions?.w || pSnapshot.width_cm || 0,
        height_cm:  a.dimensions?.h || pSnapshot.height_cm || 0,
        weight_kg:  a.weight || pSnapshot.weight_kg || 0,
        updated_at: new Date().toISOString(),
      };
    });

    for (let i = 0; i < productRows.length; i += CHUNK) {
      await (supabaseAdmin as any).from('products').upsert(
        productRows.slice(i, i + CHUNK),
        { onConflict: 'user_id,sku', ignoreDuplicates: false }
      );
    }

    // Return the mapped API response matching single-product format and include DB ids
    return NextResponse.json({
      success: true,
      session_id: sessionId,
      saved_results: savedResults,
      results: mlResult.assignments.map(ass => {
        // Find matching engineInput dimensions
        const engineInput: any = mappedProducts.find(m => m.product_id === ass.sku) || {}
        return {
          product_id:             ass.sku,
          product_name:           ass.name,
          product_price:          0,
          product_dims:           ass.dimensions,
          product_weight:         ass.weight,

          original_box:           engineInput.current_box_name || 'Not specified',
          original_box_cost:      0,
          optimized_box:          ass.assignedBox?.name || 'Unoptimized',
          optimized_box_sku:      ass.assignedBox?.id || '',
          optimized_box_dims:     ass.assignedBox ? `${ass.assignedBox.length_cm}x${ass.assignedBox.width_cm}x${ass.assignedBox.height_cm}` : '',
          optimized_box_cost:     ass.assignedBox?.cost || 0,

          packaging_material:     'Corrugated',
          fill_material:          'Paper Dunnage',

          packaging_cost:         ass.assignedBox?.cost || 0,
          shipping_cost:          ass.assignedBox ? (ass.weight * 0.54) : 0,
          total_cost:             ass.assignedBox ? ((ass.assignedBox.cost || 0) + (ass.weight * 0.54)) : 0,
          baseline_cost:          ass.assignedBox ? (((ass.assignedBox.cost || 0) + (ass.weight * 0.54)) + ass.savings) : 0,
          cost_before:            ass.assignedBox ? (((ass.assignedBox.cost || 0) + (ass.weight * 0.54)) + ass.savings) : 0,
          cost_after:             ass.assignedBox ? ((ass.assignedBox.cost || 0) + (ass.weight * 0.54)) : 0,

          savings:                ass.savings,
          savings_percent:        ass.assignedBox ? (ass.savings / (((ass.assignedBox.cost || 0) + (ass.weight * 0.54)) + ass.savings) * 100) : 0,

          damage_risk:            ass.fragility === 'High' ? 'High' : ass.fragility === 'Medium' ? 'Medium' : 'Low',
          space_utilization:      ass.volume_utilization,
          confidence_score:       ass.fits ? 95 : 0,
          void_reduction:         ass.volume_utilization,

          final_score:            ass.score_breakdown.space_score + ass.score_breakdown.cost_score + ass.score_breakdown.fragility_score + ass.score_breakdown.sustainability_score,
          optimization_status:    ass.fits ? 'improved' : 'standard',

          alternative_box_name:   ass.alternatives[0]?.name || '',
          alternative_box_dims:   ass.alternatives[0]?.dimensions || '',

          reasoning:              ass.recommendation_reason || ass.failure_reason,
          packing_tips:           [],
          candidates_evaluated:   boxes.length,

          model:                  'XGBoost ML Scorer v2.1',
          data_quality:           'complete',
          cached:                 false,
          
          volume_saved_cm3:       0,
          dim_weight_reduction:   0,
          top_alternatives:       ass.alternatives,
          score_breakdown:        ass.score_breakdown,
          engine_version:         'XGBoost ML Scorer v2.1',
          fit_check_passed:       ass.fits,
          clearance_used:         0,
          status:                 ass.fits ? 'success' : 'error',
          error_message:          ass.failure_reason || undefined
        }
      }),
      count: mlResult.totalItems,
      errorCount: mlResult.unoptimizedItems
    })
  } catch (error: any) {
    console.error('[Optimize API] Fatal error:', error)
    return NextResponse.json({ error: error.message, success: false }, { status: 500 })
  }
}
