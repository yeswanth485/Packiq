export interface BoxSpec {
  id: string
  name: string
  length_cm: number
  width_cm: number
  height_cm: number
  weight_limit_kg: number
  cost: number
}

export interface BoxUsage {
  boxId: string
  items: any[]
  totalWeight: number
  utilizationPercent: number
  voidVolumeCm3: number
}

export type UnoptimizedReason = 'Overweight' | 'Dimensions Too Large' | 'No Boxes Available' | 'Unknown'

export interface ProductAssignment {
  item: any
  assignedBox?: BoxSpec
  success: boolean
  failureReason?: UnoptimizedReason
  savingsUsd?: number
  baselineCost?: number
  optimizedCost?: number
}

export interface OptimizationResult {
  assignments: ProductAssignment[]
  summary: {
    totalItems: number
    optimizedCount: number
    failedCount: number
    totalSavingsUsd: number
    avgUtilizationPercent: number
  }
}

/**
 * 3D Fit check using simple orientation rotation
 */
export function productFitsInBox(p: { l: number, w: number, h: number, weight: number }, box: BoxSpec): boolean {
  if (p.weight > box.weight_limit_kg) return false

  const dims = [p.l, p.w, p.h].sort((a, b) => b - a)
  const boxDims = [box.length_cm, box.width_cm, box.height_cm].sort((a, b) => b - a)

  // Strict fit (no diagonal)
  return dims[0] <= boxDims[0] && dims[1] <= boxDims[1] && dims[2] <= boxDims[2]
}

/**
 * Find smallest/cheapest box that fits the item
 */
export function findBestBox(item: any, catalog: BoxSpec[]): BoxSpec | null {
  if (!catalog || catalog.length === 0) return null

  const p = {
    l: Number(item.length_cm || item.l || 0),
    w: Number(item.width_cm || item.w || 0),
    h: Number(item.height_cm || item.h || 0),
    weight: Number(item.weight_kg || item.weight || 0)
  }

  const fittingBoxes = catalog.filter(box => productFitsInBox(p, box))

  if (fittingBoxes.length === 0) return null

  // FFD logic: Pick the smallest volume box that fits.
  // If volumes are equal, pick the cheapest.
  fittingBoxes.sort((a, b) => {
    const volA = a.length_cm * a.width_cm * a.height_cm
    const volB = b.length_cm * b.width_cm * b.height_cm
    if (volA === volB) return a.cost - b.cost
    return volA - volB
  })

  return fittingBoxes[0]
}

export function buildFailureReason(item: any, catalog: BoxSpec[]): UnoptimizedReason {
  if (!catalog || catalog.length === 0) return 'No Boxes Available'

  const maxWeight = Math.max(...catalog.map(b => b.weight_limit_kg))
  if (Number(item.weight_kg || 0) > maxWeight) return 'Overweight'

  return 'Dimensions Too Large'
}

/**
 * Run 1D batch FFD algorithm over items
 */
export function runFFDOptimization(items: any[], catalog: BoxSpec[]): OptimizationResult {
  const assignments: ProductAssignment[] = []
  
  let optimizedCount = 0
  let failedCount = 0
  let totalSavingsUsd = 0
  let totalUtil = 0

  // 1. Sort items Decreasing by Volume
  const sortedItems = [...items].sort((a, b) => {
    const volA = (a.length_cm || 0) * (a.width_cm || 0) * (a.height_cm || 0)
    const volB = (b.length_cm || 0) * (b.width_cm || 0) * (b.height_cm || 0)
    return volB - volA
  })

  // 2. Assign (First Fit)
  sortedItems.forEach(item => {
    const bestBox = findBestBox(item, catalog)

    const baselineCost = Number(item.current_box_cost || item.cost || 0)
    
    if (bestBox) {
      const savings = baselineCost > 0 ? Math.max(0, baselineCost - bestBox.cost) : 0
      
      const itemVol = (item.length_cm || 0) * (item.width_cm || 0) * (item.height_cm || 0)
      const boxVol = bestBox.length_cm * bestBox.width_cm * bestBox.height_cm
      const util = boxVol > 0 ? (itemVol / boxVol) * 100 : 0

      totalSavingsUsd += savings
      totalUtil += util
      optimizedCount++

      assignments.push({
        item,
        assignedBox: bestBox,
        success: true,
        savingsUsd: savings,
        baselineCost,
        optimizedCost: bestBox.cost
      })
    } else {
      failedCount++
      assignments.push({
        item,
        success: false,
        failureReason: buildFailureReason(item, catalog),
        baselineCost,
      })
    }
  })

  return {
    assignments,
    summary: {
      totalItems: items.length,
      optimizedCount,
      failedCount,
      totalSavingsUsd: Number(totalSavingsUsd.toFixed(2)),
      avgUtilizationPercent: optimizedCount > 0 ? Number((totalUtil / optimizedCount).toFixed(1)) : 0
    }
  }
}
