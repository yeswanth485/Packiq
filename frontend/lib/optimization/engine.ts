import { calcBoxPrice, calcCO2Saved, calcSpaceUtilization, calcSavings } from '../calculations/pricing'

export const STANDARD_BOXES = [
  { name: 'Micro Box',     l: 10, w: 10, h: 10, price_base: 8 },
  { name: 'Mini Box S',    l: 15, w: 15, h: 15, price_base: 12 },
  { name: 'Mini Box M',    l: 20, w: 15, h: 10, price_base: 14 },
  { name: 'Small Box',     l: 25, w: 20, h: 15, price_base: 18 },
  { name: 'Small Box L',   l: 30, w: 20, h: 15, price_base: 22 },
  { name: 'Medium Box S',  l: 30, w: 25, h: 20, price_base: 28 },
  { name: 'Medium Box',    l: 35, w: 30, h: 25, price_base: 35 },
  { name: 'Medium Box L',  l: 40, w: 30, h: 25, price_base: 40 },
  { name: 'Large Box S',   l: 45, w: 35, h: 30, price_base: 50 },
  { name: 'Large Box',     l: 50, w: 40, h: 35, price_base: 65 },
  { name: 'Large Box XL',  l: 60, w: 45, h: 40, price_base: 80 },
  { name: 'Jumbo Box',     l: 70, w: 55, h: 50, price_base: 110 },
  { name: 'Jumbo Box XL',  l: 80, w: 60, h: 60, price_base: 145 },
]

export function findOptimalBox(product: { original_length_cm: number, original_width_cm: number, original_height_cm: number }, customBoxes?: any[]) {
  // Add 2cm padding on each dimension for safety
  const pd = [product.original_length_cm + 2, product.original_width_cm + 2, product.original_height_cm + 2].sort((a, b) => b - a)
  
  const boxesToUse = customBoxes && customBoxes.length > 0 ? customBoxes : STANDARD_BOXES

  // Find smallest box that fits (allowing rotation by sorting dimensions)
  const fitting = boxesToUse
    .map(b => {
      // sort box dims descending
      const bd = [b.l || b.length_cm, b.w || b.width_cm, b.h || b.height_cm].sort((a, b) => b - a)
      return { ...b, bd, vol: bd[0] * bd[1] * bd[2] }
    })
    .filter(b => b.bd[0] >= pd[0] && b.bd[1] >= pd[1] && b.bd[2] >= pd[2])
    .sort((a, b) => a.vol - b.vol)

  if (fitting.length > 0) {
    return {
      name: fitting[0].name,
      l: fitting[0].bd[0],
      w: fitting[0].bd[1],
      h: fitting[0].bd[2],
      price_base: fitting[0].price_base || fitting[0].cost || 10
    }
  }

  // Fallback to largest standard box if nothing fits
  return STANDARD_BOXES[STANDARD_BOXES.length - 1]
}

export function generateFragilityScore(productName: string, fragility: 'low' | 'medium' | 'high'): number {
  // Simple deterministic seed based on product name
  let hash = 0
  for (let i = 0; i < productName.length; i++) {
    hash = productName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const seed = Math.abs(hash % 100) / 100

  switch (fragility) {
    case 'low': return 20 + Math.floor(seed * 20)
    case 'medium': return 41 + Math.floor(seed * 30)
    case 'high': return 71 + Math.floor(seed * 24)
    default: return 50
  }
}

export function generateOptimizationScore(utilization: number): number {
  if (utilization > 80) return 90 + Math.floor(Math.random() * 10)
  if (utilization > 60) return 70 + Math.floor(Math.random() * 20)
  return 50 + Math.floor(Math.random() * 20)
}

export function optimizeProduct(product: any, customBoxes?: any[]) {
  const optimizedBox = findOptimalBox(product, customBoxes)
  
  const origPrice = calcBoxPrice(product.original_weight_kg, product.original_length_cm, product.original_width_cm, product.original_height_cm)
  const optPrice = calcBoxPrice(product.original_weight_kg, optimizedBox.l, optimizedBox.w, optimizedBox.h) + optimizedBox.price_base
  
  const { savings_inr, savings_percent } = calcSavings(origPrice, optPrice)
  
  const productVol = product.original_length_cm * product.original_width_cm * product.original_height_cm
  const boxVol = optimizedBox.l * optimizedBox.w * optimizedBox.h
  const spaceUtilization = calcSpaceUtilization(productVol, boxVol)

  const originalBoxVol = product.original_length_cm * product.original_width_cm * product.original_height_cm // Simplification: using product dims as original box
  const co2Saved = calcCO2Saved(originalBoxVol * 1.5, boxVol) // Assuming original box was 50% larger than product

  return {
    ...product,
    optimized_length_cm: optimizedBox.l,
    optimized_width_cm: optimizedBox.w,
    optimized_height_cm: optimizedBox.h,
    optimized_box_name: optimizedBox.name,
    original_box_price_inr: origPrice,
    optimized_box_price_inr: optPrice,
    savings_inr,
    savings_percent,
    space_utilization_percent: spaceUtilization,
    fragility_score: generateFragilityScore(product.product_name, product.fragility),
    optimization_score: generateOptimizationScore(spaceUtilization),
    co2_saved_kg: co2Saved
  }
}
