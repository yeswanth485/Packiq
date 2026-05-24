// CO2 saved (0.0023 kg CO2 per cm³ material saved, approximate)
export function calcCO2Saved(
  originalVol: number, optimizedVol: number
): number {
  return Math.max(0, (originalVol - optimizedVol) * 0.0023)
}

export function co2ToTrees(co2Kg: number): number {
  // Average tree absorbs 21.77kg CO2 per year
  return Math.round(co2Kg / 21.77)
}
