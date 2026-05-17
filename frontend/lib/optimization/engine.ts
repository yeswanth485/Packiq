import { parseDimensions } from '../utils/parser'

// ─── Types ───────────────────────────────────────────────────────────────────

export type FragilityLevel = 'low' | 'medium' | 'high' | 'extreme'
export type ShippingMethod = 'standard' | 'express' | 'same-day'
export type DamageRisk = 'Low' | 'Medium' | 'High'

export interface BoxSpec {
  id: string
  name: string
  sku: string
  lengthCm: number
  widthCm: number
  heightCm: number
  maxWeightKg: number
  costUsd: number
  material: string
  ecoCertified: boolean
  doubleWall?: boolean
}

export interface PackagingMaterialSpec {
  id: string
  name: string
  costPerUnit: number
  fillVolumePerUnit: number // cm³ of void it fills
  sustainabilityScore: number // 0-100
}

export interface OptimizationInput {
  // Product
  productName: string
  productId: string
  lengthCm: number
  widthCm: number
  heightCm: number
  weightKg: number
  fragility: FragilityLevel
  quantity: number
  category: string

  // Shipping
  destinationZone: number // 1–6
  shippingMethod: ShippingMethod

  // Baseline (optional, for savings calc)
  currentBoxName?: string
  currentBoxLength?: number
  currentBoxWidth?: number
  currentBoxHeight?: number
  currentBoxCostUsd?: number
  currentShippingCostUsd?: number

  // Catalogs
  availableBoxes: BoxSpec[]

  // Constraints
  warehouseRules?: {
    maxBoxCostUsd?: number
    preferEco?: boolean
    requiredDoubleWallAboveKg?: number
  }
}

export interface CandidateScore {
  fitScore: number           // 0–100: how well product fits
  voidScore: number          // 0–100: low void = high score
  damageRiskScore: number    // 0–100: high protection = high score
  packagingCostScore: number // 0–100: low cost = high score
  shippingCostScore: number  // 0–100: low shipping = high score
  sustainabilityScore: number// 0–100: eco-friendly = high score
  finalScore: number         // Weighted composite
}

export interface BoxCandidate {
  box: BoxSpec
  candidateType: 'smallest-fit' | 'safest-fit' | 'cheapest-fit' | 'most-efficient' | 'fragile-safe'
  voidVolumeCm3: number
  voidRatio: number          // 0–1
  dimWeightKg: number
  packagingCostUsd: number
  shippingCostUsd: number
  totalCostUsd: number
  score: CandidateScore
}

export interface OptimizationRecommendation {
  // Identification
  productId: string
  productName: string

  // Box
  recommendedBoxId: string
  recommendedBoxName: string
  recommendedBoxDims: string  // "LxWxH"
  recommendedBoxSku: string

  // Packaging material
  packagingMaterial: string
  fillMaterial: string

  // Cost breakdown (USD)
  packagingCost: number     // box + tape + filler + labor
  shippingCost: number      // courier rate × chargeable weight × zone
  totalCost: number         // packaging + shipping
  baselineCost: number      // what they were spending
  savings: number           // baselineCost - totalCost
  savingsPercent: number    // savings / baselineCost * 100

  // Risk & quality
  damageRisk: DamageRisk
  spaceUtilization: number  // 0–100 %
  confidenceScore: number   // 0–100 %

  // Component scores
  fitScore: number
  voidScore: number
  costScore: number
  sustainabilityScore: number
  finalScore: number

  // Alternatives
  alternativeBoxName?: string
  alternativeBoxDims?: string

  // Explanation
  reasoning: string
  packingTips: string[]

  // Meta
  candidatesEvaluated: number
  model: string
  dataQuality: 'complete' | 'partial' | 'estimated'
}

// ─── Shipping Zone Rate Table ──────────────────────────────────────────────

const ZONE_RATES_USD: Record<number, number> = {
  1: 0.42,
  2: 0.54,
  3: 0.66,
  4: 0.84,
  5: 1.08,
  6: 1.44,
}

const SHIPPING_METHOD_MULTIPLIERS: Record<ShippingMethod, number> = {
  'standard': 1.0,
  'express': 1.6,
  'same-day': 2.5,
}

const DIM_DIVISOR = 5000 // cm³/kg (standard international)

// ─── Packaging Material Rules ─────────────────────────────────────────────

function selectPackagingMaterial(fragility: FragilityLevel): { material: string; filler: string; fillerCostPerCm3: number } {
  switch (fragility) {
    case 'extreme': return { material: 'Double-Wall Corrugated', filler: 'Foam + Air Cushions', fillerCostPerCm3: 0.000018 }
    case 'high':    return { material: 'Double-Wall Corrugated', filler: 'Bubble Wrap + Foam',  fillerCostPerCm3: 0.000015 }
    case 'medium':  return { material: 'Single-Wall Corrugated', filler: 'Bubble Wrap',         fillerCostPerCm3: 0.000010 }
    case 'low':     return { material: 'Single-Wall Corrugated', filler: 'Paper Dunnage',       fillerCostPerCm3: 0.000005 }
  }
}

// ─── Step 1: Normalize Input ──────────────────────────────────────────────

export function normalizeInput(raw: Partial<OptimizationInput>): OptimizationInput {
  // Try to parse baseline dimensions if provided in the name string
  let bl = raw.currentBoxLength
  let bw = raw.currentBoxWidth
  let bh = raw.currentBoxHeight

  if (raw.currentBoxName && (!bl || !bw || !bh)) {
    const parsed = parseDimensions(raw.currentBoxName)
    if (parsed) {
      bl = parsed.l
      bw = parsed.w
      bh = parsed.h
    }
  }

  return {
    productName:     raw.productName     || 'Unknown Product',
    productId:       raw.productId       || `id-${Date.now()}`,
    lengthCm:        Math.abs(raw.lengthCm   || 0),
    widthCm:         Math.abs(raw.widthCm    || 0),
    heightCm:        Math.abs(raw.heightCm   || 0),
    weightKg:        Math.abs(raw.weightKg   || 0.5),
    fragility:       raw.fragility       || 'low',
    quantity:        raw.quantity        || 1,
    category:        raw.category        || 'general',
    destinationZone: raw.destinationZone || 2,
    shippingMethod:  raw.shippingMethod  || 'standard',
    currentBoxName:  raw.currentBoxName,
    currentBoxLength: bl,
    currentBoxWidth:  bw,
    currentBoxHeight: bh,
    currentBoxCostUsd: raw.currentBoxCostUsd,
    currentShippingCostUsd: raw.currentShippingCostUsd,
    availableBoxes:  raw.availableBoxes  || [],
    warehouseRules:  raw.warehouseRules  || {},
  }
}

// ─── Step 2: Validate Input ───────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  issues: string[]
  confidence: number // 0–100
}

export function validateInput(input: OptimizationInput): ValidationResult {
  const issues: string[] = []

  if (input.lengthCm <= 0 || input.widthCm <= 0 || input.heightCm <= 0) {
    issues.push('Product dimensions are missing or zero')
  }
  if (input.lengthCm > 300 || input.widthCm > 300 || input.heightCm > 300) {
    issues.push('Product dimensions exceed maximum (300 cm)')
  }
  if (input.weightKg <= 0) {
    issues.push('Product weight is missing — defaulted to 0.5 kg')
  }
  if (input.availableBoxes.length === 0) {
    issues.push('Box catalog is empty — using built-in default catalog')
  }

  const fits = input.availableBoxes.some(box => productFitsInBox(input, box))
  if (!fits && input.availableBoxes.length > 0) {
    issues.push('Product does not fit in any available box')
  }

  // Confidence: start at 100, deduct for each issue
  const confidence = Math.max(20, 100 - issues.length * 18)

  return {
    valid: issues.filter(i => i.startsWith('Product dimensions are missing')).length === 0,
    issues,
    confidence,
  }
}

// ─── Fit Check (All 6 Rotations) ─────────────────────────────────────────

function productFitsInBox(input: OptimizationInput, box: BoxSpec, clearanceCm = 1): boolean {
  const { lengthCm: l, widthCm: w, heightCm: h } = input
  // Enforce at least 1cm clearance on all sides as per CRITICAL RULES
  const effectiveClearance = Math.max(1, clearanceCm)
  const p1 = l + effectiveClearance, p2 = w + effectiveClearance, p3 = h + effectiveClearance
  const bl = box.lengthCm, bw = box.widthCm, bh = box.heightCm

  // Explicit 6-way rotational check
  const fitsLWH = (bl >= p1 && bw >= p2 && bh >= p3)
  const fitsLHW = (bl >= p1 && bw >= p3 && bh >= p2)
  const fitsWLH = (bl >= p2 && bw >= p1 && bh >= p3)
  const fitsWHL = (bl >= p2 && bw >= p3 && bh >= p1)
  const fitsHLW = (bl >= p3 && bw >= p1 && bh >= p2)
  const fitsHWL = (bl >= p3 && bw >= p2 && bh >= p1)

  const fitsRotationally = fitsLWH || fitsLHW || fitsWLH || fitsWHL || fitsHLW || fitsHWL
  return fitsRotationally && box.maxWeightKg >= input.weightKg
}

// ─── Step 3: Generate Candidates ────────────────────────────────────────

export function generateCandidates(input: OptimizationInput): BoxCandidate[] {
  const fragilityClearance: Record<FragilityLevel, number> = {
    low: 0, medium: 1, high: 2.5, extreme: 5
  }
  const clearance = fragilityClearance[input.fragility]
  const candidates: BoxCandidate[] = []

  // Filter boxes that can fit the product
  let fittingBoxes = input.availableBoxes.filter(box => productFitsInBox(input, box, clearance))
  
  // CRITICAL RULE: The recommended box MUST have a smaller volume than the "currently used box"
  if (input.currentBoxLength && input.currentBoxWidth && input.currentBoxHeight) {
    const currentVol = input.currentBoxLength * input.currentBoxWidth * input.currentBoxHeight
    fittingBoxes = fittingBoxes.filter(box => {
      const boxVol = box.lengthCm * box.widthCm * box.heightCm
      return boxVol < currentVol
    })
  }

  if (fittingBoxes.length === 0) return []

  const productVol = input.lengthCm * input.widthCm * input.heightCm

  // Helper: build a candidate
  const buildCandidate = (box: BoxSpec, type: BoxCandidate['candidateType']): BoxCandidate => {
    const boxVol = box.lengthCm * box.widthCm * box.heightCm
    const voidVol = boxVol - productVol
    const voidRatio = boxVol > 0 ? voidVol / boxVol : 1

    const dimWeight = (box.lengthCm * box.widthCm * box.heightCm) / DIM_DIVISOR
    const chargeableWeight = Math.max(input.weightKg, dimWeight)
    const zoneRate = ZONE_RATES_USD[input.destinationZone] || 0.54
    const methodMult = SHIPPING_METHOD_MULTIPLIERS[input.shippingMethod]
    const shippingCost = chargeableWeight * zoneRate * methodMult

    const matInfo = selectPackagingMaterial(input.fragility)
    const tapeFlat = 0.024
    const laborFlat = 0.18
    const fillerCost = voidVol * matInfo.fillerCostPerCm3
    const packagingCost = box.costUsd + tapeFlat + fillerCost + laborFlat

    const score = scoreCandidate(input, box, voidRatio, packagingCost, shippingCost)

    return {
      box, candidateType: type,
      voidVolumeCm3: voidVol, voidRatio,
      dimWeightKg: dimWeight,
      packagingCostUsd: packagingCost,
      shippingCostUsd: shippingCost,
      totalCostUsd: packagingCost + shippingCost,
      score,
    }
  }

  // Sort by volume ascending
  const byVolume = [...fittingBoxes].sort((a, b) =>
    (a.lengthCm * a.widthCm * a.heightCm) - (b.lengthCm * b.widthCm * b.heightCm)
  )
  const byCost = [...fittingBoxes].sort((a, b) => a.costUsd - b.costUsd)
  const seen = new Set<string>()

  const addCandidate = (box: BoxSpec, type: BoxCandidate['candidateType']) => {
    if (!seen.has(box.id)) {
      seen.add(box.id)
      candidates.push(buildCandidate(box, type))
    }
  }

  // 1. Smallest possible fit
  if (byVolume[0]) addCandidate(byVolume[0], 'smallest-fit')

  // 2. Most space-efficient (lowest void ratio)
  const mostEfficient = [...fittingBoxes].sort((a, b) => {
    const volA = a.lengthCm * a.widthCm * a.heightCm
    const volB = b.lengthCm * b.widthCm * b.heightCm
    return (volA - productVol) / volA - (volB - productVol) / volB
  })[0]
  if (mostEfficient) addCandidate(mostEfficient, 'most-efficient')

  // 3. Cheapest fit
  if (byCost[0]) addCandidate(byCost[0], 'cheapest-fit')

  // 4. Safest fit (extra clearance, prefer double-wall for fragile)
  const safest = fittingBoxes.find(b => b.doubleWall) || byVolume[Math.min(1, byVolume.length - 1)]
  if (safest) addCandidate(safest, 'safest-fit')

  // 5. Alternative: second-smallest by volume
  if (byVolume[1]) addCandidate(byVolume[1], 'fragile-safe')

  // Add ALL remaining valid candidates so we don't miss good options
  for (const box of fittingBoxes) {
    addCandidate(box, 'smallest-fit') // Default tag
  }

  return candidates
}

// ─── Step 4: Score Each Candidate ────────────────────────────────────────

function scoreCandidate(
  input: OptimizationInput,
  box: BoxSpec,
  voidRatio: number,
  packagingCost: number,
  shippingCost: number,
): CandidateScore {
  const productVol = input.lengthCm * input.widthCm * input.heightCm

  // Fit score: 100 if tight, down to 60 if very loose, 0 if doesn't fit
  const boxVol = box.lengthCm * box.widthCm * box.heightCm
  const fitScore = boxVol > 0 ? Math.min(100, Math.max(0, 100 - (voidRatio * 60))) : 0

  // Void score: inverse of void ratio
  const voidScore = Math.min(100, Math.max(0, (1 - voidRatio) * 100))

  // Damage risk score
  // Fragile items need clearance. Tight box without enough clearance = higher risk.
  const clearanceNeeded: Record<FragilityLevel, number> = { low: 0, medium: 1, high: 2.5, extreme: 5 }
  const needed = clearanceNeeded[input.fragility]
  const minBoxDim = Math.min(box.lengthCm, box.widthCm, box.heightCm)
  const minProdDim = Math.min(input.lengthCm, input.widthCm, input.heightCm)
  const actualClearance = Math.max(0, minBoxDim - minProdDim)
  const clearanceRatio = needed > 0 ? Math.min(1, actualClearance / needed) : 1
  const doubleWallBonus = box.doubleWall ? 10 : 0
  const damageRiskScore = Math.min(100, clearanceRatio * 80 + doubleWallBonus + (input.fragility === 'low' ? 20 : 0))

  // Packaging cost score: normalize against max cost in catalog
  const maxBoxCost = Math.max(...input.availableBoxes.map(b => b.costUsd), 0.01)
  const packagingCostScore = Math.max(0, 100 - (packagingCost / (maxBoxCost + 0.3)) * 60)

  // Shipping cost score: normalize against zone-max shipping
  const maxShipping = (input.weightKg * 3) * (ZONE_RATES_USD[input.destinationZone] || 0.54) * SHIPPING_METHOD_MULTIPLIERS[input.shippingMethod]
  const shippingCostScore = Math.max(0, 100 - (shippingCost / (maxShipping + 0.01)) * 100)

  // Sustainability score
  const ecoBonus = box.ecoCertified ? 20 : 0
  const voidPenalty = voidRatio * 40
  const sustainabilityScore = Math.min(100, Math.max(0, 80 - voidPenalty + ecoBonus))

  // ─── Optimization Penalty / Bonus ─────────────────────────────────────
  // If we have a baseline box, we MUST prioritize boxes that are smaller.
  let optimizationScore = 50 // neutral
  if (input.currentBoxLength && input.currentBoxWidth && input.currentBoxHeight) {
    const baselineVol = input.currentBoxLength * input.currentBoxWidth * input.currentBoxHeight
    if (boxVol > baselineVol * 1.05) {
      // Significantly larger than baseline: heavy penalty
      optimizationScore = 0
    } else if (boxVol < baselineVol * 0.95) {
      // Significantly smaller than baseline: bonus
      optimizationScore = 100
    } else {
      // Similar size
      optimizationScore = 40
    }
  }

  // Weighted final score
  // Adjusting weights to prioritize volume reduction (optimization)
  // 30% cost efficiency, 30% fit/void, 15% optimization, 15% safety, 10% sustainability
  const costEfficiency = (packagingCostScore * 0.5 + shippingCostScore * 0.5)
  const finalScore =
    0.30 * costEfficiency +
    0.30 * fitScore +
    0.15 * optimizationScore +
    0.15 * damageRiskScore +
    0.10 * sustainabilityScore

  return {
    fitScore: Math.round(fitScore),
    voidScore: Math.round(voidScore),
    damageRiskScore: Math.round(damageRiskScore),
    packagingCostScore: Math.round(packagingCostScore),
    shippingCostScore: Math.round(shippingCostScore),
    sustainabilityScore: Math.round(sustainabilityScore),
    finalScore: Math.round(finalScore),
  }
}

// ─── Step 5: Select Best Box ──────────────────────────────────────────────

export function selectBestCandidate(candidates: BoxCandidate[]): BoxCandidate | null {
  if (candidates.length === 0) return null
  return [...candidates].sort((a, b) => b.score.finalScore - a.score.finalScore)[0]
}

// ─── Step 6: Calculate Costs ──────────────────────────────────────────────

export function calculateBaselineCost(input: OptimizationInput): number {
  // Use provided baseline, or estimate from category
  if (input.currentBoxCostUsd && input.currentShippingCostUsd) {
    return input.currentBoxCostUsd + input.currentShippingCostUsd
  }
  if (input.currentBoxCostUsd) {
    // Estimate shipping from category defaults
    const zoneRate = ZONE_RATES_USD[input.destinationZone] || 0.54
    return input.currentBoxCostUsd + (input.weightKg * 1.4 * zoneRate)
  }
  // Estimate from category average (heuristic baseline)
  const categoryDefaults: Record<string, number> = {
    electronics: 2.80, fragile: 2.60, clothing: 1.20, books: 0.90,
    cosmetics: 1.60, food: 1.10, toys: 1.40, general: 1.50,
  }
  return categoryDefaults[input.category.toLowerCase()] || 1.50
}

// ─── Step 7: Determine Damage Risk Label ─────────────────────────────────

function getDamageRisk(damageRiskScore: number, fragility: FragilityLevel): DamageRisk {
  if (fragility === 'extreme' || damageRiskScore < 40) return 'High'
  if (fragility === 'high' || damageRiskScore < 70) return 'Medium'
  return 'Low'
}

// ─── Step 8: Build Packing Tips ──────────────────────────────────────────

function buildPackingTips(input: OptimizationInput, candidate: BoxCandidate): string[] {
  const tips: string[] = []
  const { fragility } = input
  const { voidRatio } = candidate

  if (fragility === 'extreme' || fragility === 'high') {
    tips.push('Wrap item in 3 layers of bubble wrap before placing in box.')
    tips.push('Place foam corner inserts at all 8 corners of the box.')
  }
  if (fragility === 'medium') {
    tips.push('Wrap item in at least 2 layers of bubble wrap.')
  }
  if (voidRatio > 0.3) {
    tips.push('Fill remaining void space with paper dunnage to prevent item movement.')
  }
  if (voidRatio < 0.1) {
    tips.push('Box is a tight fit — ensure item slides in without force to avoid surface damage.')
  }
  tips.push('Seal all box seams with 2-inch packing tape in an H-pattern.')
  tips.push(`Use ${candidate.box.name} (${candidate.box.sku}) for this shipment.`)

  return tips
}

// ─── Step 9: Build Reasoning ──────────────────────────────────────────────

function buildReasoning(
  input: OptimizationInput,
  best: BoxCandidate,
  baseline: number,
  savings: number,
  savingsPercent: number,
): string {
  const parts: string[] = []

  parts.push(`${best.box.name} was selected from ${input.availableBoxes.length} available box options.`)

  if (best.score.fitScore > 75) {
    parts.push(`It achieves a tight ${Math.round((1 - best.voidRatio) * 100)}% space utilization, minimizing void fill costs.`)
  } else {
    parts.push(`It provides ${Math.round((1 - best.voidRatio) * 100)}% space utilization with appropriate filler for protection.`)
  }

  if (input.fragility === 'high' || input.fragility === 'extreme') {
    parts.push(`The box provides adequate clearance for ${input.fragility}-fragility handling requirements.`)
  }

  if (savings > 0) {
    parts.push(`Total fulfillment cost of $${best.totalCostUsd.toFixed(2)} saves $${savings.toFixed(2)} (${savingsPercent.toFixed(1)}%) vs. your current baseline of $${baseline.toFixed(2)}.`)
  } else if (input.currentBoxLength && input.currentBoxWidth && input.currentBoxHeight && (best.box.lengthCm * best.box.widthCm * best.box.heightCm < input.currentBoxLength * input.currentBoxWidth * input.currentBoxHeight)) {
    parts.push(`Although direct cost savings are minimal, this box significantly reduces packaging volume, improving warehouse density.`)
  } else {
    parts.push(`While cost is similar to baseline, this box reduces damage risk and improves packing efficiency.`)
  }

  if (best.box.ecoCertified) {
    parts.push('This box is eco-certified, reducing your carbon footprint.')
  }

  return parts.join(' ')
}

// ─── Master Function: Run Full Optimization ───────────────────────────────

export function runHeuristicOptimization(
  rawInput: Partial<OptimizationInput>,
): OptimizationRecommendation | null {

  // Step 1: Normalize
  const input = normalizeInput(rawInput)

  // Step 2: Validate
  const validation = validateInput(input)
  if (!validation.valid) return null

  // Step 3: Generate candidates
  const candidates = generateCandidates(input)
  if (candidates.length === 0) return null

  // Step 4 + 5: Select best (scores already computed inside generateCandidates)
  const best = selectBestCandidate(candidates)
  if (!best) return null

  // Step 6: Calculate costs
  const baseline = calculateBaselineCost(input)
  const savings = Math.max(0, baseline - best.totalCostUsd)
  const savingsPercent = baseline > 0 ? (savings / baseline) * 100 : 0

  // Step 7: Material selection
  const matInfo = selectPackagingMaterial(input.fragility)

  // Step 8: Damage risk
  const damageRisk = getDamageRisk(best.score.damageRiskScore, input.fragility)

  // Step 9: Space utilization including required padding
  const productVol = input.lengthCm * input.widthCm * input.heightCm
  const boxVol = best.box.lengthCm * best.box.widthCm * best.box.heightCm
  
  const fragilityPaddingRatio: Record<FragilityLevel, number> = { low: 0, medium: 0.1, high: 0.25, extreme: 0.5 }
  const requiredPaddingVolume = productVol * fragilityPaddingRatio[input.fragility]
  const effectiveVolume = productVol + requiredPaddingVolume

  const spaceUtilization = boxVol > 0 ? Math.min(100, Math.round((effectiveVolume / boxVol) * 100)) : 0

  // Step 10: Packing tips
  const packingTips = buildPackingTips(input, best)

  // Step 11: Reasoning
  const reasoning = buildReasoning(input, best, baseline, savings, savingsPercent)

  // Step 12: Alternative (second-best)
  const sortedByScore = [...candidates].sort((a, b) => b.score.finalScore - a.score.finalScore)
  const alt = sortedByScore[1]

  // Confidence = validation confidence, adjusted upward if we have good data
  const confidenceBonus = (input.currentBoxCostUsd ? 5 : 0) + (candidates.length >= 3 ? 5 : 0)
  const confidenceScore = Math.min(99, validation.confidence + confidenceBonus)

  const dataQuality: OptimizationRecommendation['dataQuality'] =
    validation.issues.length === 0 ? 'complete' :
    validation.issues.length <= 2 ? 'partial' : 'estimated'

  return {
    productId:          input.productId,
    productName:        input.productName,

    recommendedBoxId:   best.box.id,
    recommendedBoxName: best.box.name,
    recommendedBoxDims: `${best.box.lengthCm}x${best.box.widthCm}x${best.box.heightCm}`,
    recommendedBoxSku:  best.box.sku,

    packagingMaterial:  matInfo.material,
    fillMaterial:       matInfo.filler,

    packagingCost:      parseFloat(best.packagingCostUsd.toFixed(2)),
    shippingCost:       parseFloat(best.shippingCostUsd.toFixed(2)),
    totalCost:          parseFloat(best.totalCostUsd.toFixed(2)),
    baselineCost:       parseFloat(baseline.toFixed(2)),
    savings:            parseFloat(savings.toFixed(2)),
    savingsPercent:     parseFloat(savingsPercent.toFixed(1)),

    damageRisk,
    spaceUtilization,
    confidenceScore,

    fitScore:           best.score.fitScore,
    voidScore:          best.score.voidScore,
    costScore:          Math.round((best.score.packagingCostScore + best.score.shippingCostScore) / 2),
    sustainabilityScore: best.score.sustainabilityScore,
    finalScore:         best.score.finalScore,

    alternativeBoxName: alt?.box.name,
    alternativeBoxDims: alt ? `${alt.box.lengthCm}x${alt.box.widthCm}x${alt.box.heightCm}` : undefined,

    reasoning,
    packingTips,

    candidatesEvaluated: candidates.length,
    model:               'PackVision Heuristic v2.0',
    dataQuality,
  }
}

// --- ML-Grade Production Optimization Engine ---

export interface ScoreBreakdown {
  emptySpacePenalty: number
  shippingCostPenalty: number
  damageRiskPenalty: number
  materialCostPenalty: number
  totalScore: number
}

export interface AlternativeBox {
  boxName: string
  boxSku?: string
  boxDims: string
  score: number
  totalCost: number
  reasoning: string
}

export interface ProductionOptimizationRecommendation extends OptimizationRecommendation {
  topAlternatives: AlternativeBox[]
  scoreBreakdown: ScoreBreakdown
  engineVersion: string
  fitCheckPassed: boolean
  clearanceUsed: number
  volumeSavedCm3: number
  dimWeightReduction: number
}

function checkAllOrientations(pl: number, pw: number, ph: number, bl: number, bw: number, bh: number, clearance: number): boolean {
  const rotations = [
    [pl, pw, ph], [pl, ph, pw],
    [pw, pl, ph], [pw, ph, pl],
    [ph, pl, pw], [ph, pw, pl]
  ]
  for (const [rl, rw, rh] of rotations) {
    if ((rl + clearance * 2 <= bl) && (rw + clearance * 2 <= bw) && (rh + clearance * 2 <= bh)) {
      return true
    }
  }
  return false
}

export function runProductionOptimization(
  rawInput: Partial<OptimizationInput>,
): ProductionOptimizationRecommendation | null {
  const input = normalizeInput(rawInput)
  const validation = validateInput(input)
  if (!validation.valid) return null

  const pl = input.lengthCm
  const pw = input.widthCm
  const ph = input.heightCm
  const productVol = pl * pw * ph
  
  const clearances: Record<FragilityLevel, number> = { low: 0.5, medium: 1.0, high: 2.5, extreme: 5.0 }
  const clearance = clearances[input.fragility] || 1.0

  let baselineCost = 0.0
  let baselineVol = 0.0
  if (input.currentBoxLength && input.currentBoxWidth && input.currentBoxHeight) {
    baselineVol = input.currentBoxLength * input.currentBoxWidth * input.currentBoxHeight
    const dimWeight = (input.currentBoxLength * input.currentBoxWidth * input.currentBoxHeight) / DIM_DIVISOR
    const billableWeight = Math.max(input.weightKg, dimWeight)
    const base = input.shippingMethod === 'express' ? 15.0 : (input.shippingMethod === 'same-day' ? 25.0 : 8.5)
    const zoneMult = ZONE_RATES_USD[input.destinationZone] || 1.0
    const baselineShipping = base + (billableWeight * 1.5 * zoneMult)
    baselineCost = baselineShipping + (input.currentBoxCostUsd || 0)
  }

  const maxBoxCost = input.availableBoxes.reduce((max, b) => Math.max(max, b.costUsd), 0)
  const maxVoidVol = input.availableBoxes.reduce((max, b) => Math.max(max, (b.lengthCm * b.widthCm * b.heightCm) - productVol), 0)

  const validCandidates: any[] = []

  for (const box of input.availableBoxes) {
    if (!checkAllOrientations(pl, pw, ph, box.lengthCm, box.widthCm, box.heightCm, clearance)) {
      continue
    }
    if (box.maxWeightKg && input.weightKg > box.maxWeightKg) {
      continue
    }

    const boxVol = box.lengthCm * box.widthCm * box.heightCm
    const voidVol = Math.max(0, boxVol - productVol)
    const emptySpaceRatio = boxVol > 0 ? Math.max(0, (boxVol - productVol) / boxVol) : 1.0

    const dimWeight = boxVol / DIM_DIVISOR
    const billableWeight = Math.max(input.weightKg, dimWeight)
    
    const baseRate = input.shippingMethod === 'express' ? 15.0 : (input.shippingMethod === 'same-day' ? 25.0 : 8.5)
    const zoneMult = ZONE_RATES_USD[input.destinationZone] || 1.0
    const shippingCost = baseRate + (billableWeight * 1.5 * zoneMult)
    const totalCost = shippingCost + box.costUsd

    const emptySpacePenalty = emptySpaceRatio * 100.0

    const maxDimWeight = Math.max(input.weightKg, (100 * 100 * 100) / DIM_DIVISOR)
    const maxTheoreticalShipping = baseRate + (maxDimWeight * 1.5 * zoneMult)
    const shippingCostPenalty = maxTheoreticalShipping > 0 ? Math.min(100.0, (shippingCost / maxTheoreticalShipping) * 100.0) : 0

    const minBoxDim = Math.min(box.lengthCm, box.widthCm, box.heightCm)
    const minProdDim = Math.min(pl, pw, ph)
    const actualClearance = Math.max(0, minBoxDim - minProdDim) / 2.0
    const clearanceRatio = clearance > 0 ? actualClearance / clearance : 1.0

    let damageRiskPenalty = 0.0
    if (input.fragility === 'high' || input.fragility === 'extreme') {
      if (!box.doubleWall) damageRiskPenalty += 40.0
      if (clearanceRatio < 1.0) damageRiskPenalty += 40.0 * (1.0 - clearanceRatio)
    } else if (input.fragility === 'medium') {
      if (clearanceRatio < 1.0) damageRiskPenalty += 20.0 * (1.0 - clearanceRatio)
    }
    if (clearanceRatio > 3.0) damageRiskPenalty += 10.0
    damageRiskPenalty = Math.min(100.0, damageRiskPenalty)

    const costPenalty = maxBoxCost > 0 ? (box.costUsd / maxBoxCost) * 50.0 : 0.0
    const voidPenalty = maxVoidVol > 0 ? (voidVol / maxVoidVol) * 50.0 : 0.0
    const materialCostPenalty = Math.min(100.0, costPenalty + voidPenalty)

    const w1 = 0.25, w2 = 0.35, w3 = 0.25, w4 = 0.15
    const totalScore = (emptySpacePenalty * w1) + (shippingCostPenalty * w2) + (damageRiskPenalty * w3) + (materialCostPenalty * w4)

    let damageRisk: DamageRisk = 'Low'
    if (damageRiskPenalty > 60) damageRisk = 'High'
    else if (damageRiskPenalty > 20) damageRisk = 'Medium'

    validCandidates.push({
      box,
      score: totalScore,
      breakdown: {
        emptySpacePenalty,
        shippingCostPenalty,
        damageRiskPenalty,
        materialCostPenalty,
        totalScore
      },
      metrics: {
        shippingCost,
        totalCost,
        emptySpaceRatio,
        boxVol,
        damageRisk,
        dimWeight
      }
    })
  }

  if (validCandidates.length === 0) return null

  validCandidates.sort((a, b) => a.score - b.score)
  const winner = validCandidates[0]
  const wBox = winner.box
  const wMetrics = winner.metrics

  const savings = baselineCost > 0 ? Math.max(0, baselineCost - wMetrics.totalCost) : 0
  const savingsPercent = baselineCost > 0 ? (savings / baselineCost) * 100 : 0

  let dimReduction = 0
  let volSaved = 0
  if (baselineVol > 0) {
    volSaved = baselineVol - wMetrics.boxVol
    const oldDim = baselineVol / DIM_DIVISOR
    const newDim = wMetrics.boxVol / DIM_DIVISOR
    dimReduction = Math.max(0, oldDim - newDim)
  }

  let susScore = 100 - (wMetrics.emptySpaceRatio * 100 * 0.5)
  if (wBox.ecoCertified) susScore += 15
  if (wBox.material && wBox.material.toLowerCase() === 'kraft') susScore += 10
  susScore = Math.min(100, Math.max(0, susScore))

  const topAlternatives: AlternativeBox[] = []
  for (let i = 1; i < Math.min(4, validCandidates.length); i++) {
    const alt = validCandidates[i]
    topAlternatives.push({
      boxName: alt.box.name,
      boxSku: alt.box.sku,
      boxDims: `${alt.box.lengthCm}x${alt.box.widthCm}x${alt.box.heightCm}`,
      score: alt.score,
      totalCost: alt.metrics.totalCost,
      reasoning: "Alternative choice with slightly higher overall score."
    })
  }

  const confidence = Math.max(0, 100 - winner.score)

  let material = 'Single-Wall Corrugated'
  let filler = 'Paper Dunnage'
  if (input.fragility === 'extreme') { material = 'Double-Wall Corrugated'; filler = 'Foam + Air Cushions' }
  else if (input.fragility === 'high') { material = 'Double-Wall Corrugated'; filler = 'Bubble Wrap + Foam' }
  else if (input.fragility === 'medium') { filler = 'Bubble Wrap' }

  return {
    productId: input.productId,
    productName: input.productName,
    recommendedBoxId: wBox.id,
    recommendedBoxName: wBox.name,
    recommendedBoxDims: `${wBox.lengthCm}x${wBox.widthCm}x${wBox.heightCm}`,
    recommendedBoxSku: wBox.sku,
    packagingMaterial: material,
    fillMaterial: filler,
    packagingCost: parseFloat(wBox.costUsd.toFixed(2)),
    shippingCost: parseFloat(wMetrics.shippingCost.toFixed(2)),
    totalCost: parseFloat(wMetrics.totalCost.toFixed(2)),
    baselineCost: parseFloat(baselineCost.toFixed(2)),
    savings: parseFloat(savings.toFixed(2)),
    savingsPercent: parseFloat(savingsPercent.toFixed(1)),
    damageRisk: wMetrics.damageRisk,
    spaceUtilization: (1.0 - wMetrics.emptySpaceRatio) * 100.0,
    confidenceScore: confidence,
    fitScore: 100 - winner.breakdown.emptySpacePenalty,
    voidScore: 100 - winner.breakdown.emptySpacePenalty,
    costScore: 100 - ((winner.breakdown.shippingCostPenalty + winner.breakdown.materialCostPenalty) / 2),
    sustainabilityScore: susScore,
    finalScore: 100 - winner.score,
    reasoning: `Selected ${wBox.name} because it minimized the total optimization score (cost + waste).`,
    packingTips: [],
    candidatesEvaluated: validCandidates.length,
    model: 'PackVision ML-Scorer v1.0',
    dataQuality: 'complete',
    topAlternatives: topAlternatives,
    scoreBreakdown: winner.breakdown,
    engineVersion: 'ML-Scorer v1.0',
    fitCheckPassed: true,
    clearanceUsed: clearance,
    volumeSavedCm3: volSaved,
    dimWeightReduction: dimReduction
  }
}

 
 