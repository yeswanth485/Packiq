// DIM weight formula (standard)
export function calcDimWeight(l: number, w: number, h: number): number {
  return (l * w * h) / 5000
}

// Box price in INR
export function calcBoxPrice(
  actualWeightKg: number,
  l: number, w: number, h: number,
  ratePerKg: number = 45
): number {
  const dimWeight = calcDimWeight(l, w, h)
  const chargeableWeight = Math.max(actualWeightKg, dimWeight)
  return chargeableWeight * ratePerKg
}

// Savings
export function calcSavings(originalPrice: number, optimizedPrice: number) {
  const savings = originalPrice - optimizedPrice
  const percent = (originalPrice > 0) ? (savings / originalPrice) * 100 : 0
  return { savings_inr: savings, savings_percent: percent }
}

// Space utilization
export function calcSpaceUtilization(
  productVol: number, boxVol: number
): number {
  return (boxVol > 0) ? (productVol / boxVol) * 100 : 0
}

// CO2 saved (0.0023 kg CO2 per cm³ material saved, approximate)
export function calcCO2Saved(
  originalVol: number, optimizedVol: number
): number {
  return Math.max(0, (originalVol - optimizedVol) * 0.0023)
}
