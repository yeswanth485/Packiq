import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Full Optimization Result (matches engine output) ──────────────────────

export interface OptimizationResult {
  // Identity
  product_id: string
  product_name: string
  product_price: number
  product_dims: string
  product_weight: number

  // Box selection
  original_box: string
  original_box_cost: number
  optimized_box: string
  optimized_box_cost: number
  optimized_box_dims: string
  optimized_box_sku: string

  // Material
  packaging_material: string
  fill_material: string

  // Three-layer cost breakdown
  packaging_cost: number    // box + tape + filler + labor
  shipping_cost: number     // courier + dim weight + zone
  total_cost: number        // packaging + shipping
  baseline_cost: number     // what they were paying
  cost_before: number       // alias for baseline_cost (legacy)
  cost_after: number        // alias for total_cost (legacy)

  // Savings
  savings: number
  savings_percent: number

  // Risk & quality
  damage_risk: 'Low' | 'Medium' | 'High'
  space_utilization: number  // 0–100 %
  confidence_score: number   // 0–100 %
  void_reduction: number     // alias for space_utilization (legacy)

  // Component scores
  fit_score: number
  void_score: number
  cost_score: number
  sustainability_score: number
  final_score: number

  // Alternatives
  alternative_box_name?: string
  alternative_box_dims?: string

  // Explanation
  reasoning: string
  packing_tips: string[]
  candidates_evaluated: number
  optimization_status?: 'improved' | 'larger_than_baseline' | 'standard'

  // Status
  status: 'success' | 'warning' | 'error'
  error_message?: string
  model: string
  data_quality: 'complete' | 'partial' | 'estimated'

  // Extended metrics (returned by engine)
  dim_weight_reduction?: number
  volume_saved_cm3?: number

  // UI helpers for mapping from /api/optimize
  optimizedDims?: { l: number; w: number; h: number }
  lengthCm?: number
  widthCm?: number
  heightCm?: number
  volumeUtil?: number
  voidPct?: number
  baselineVoidPct?: number
  baselineBoxCost?: number
  optimizedBoxCost?: number
  optimizedBox?: string
  originalBox?: string
  reason?: string
  fragility?: string
  sku?: string
  score?: number
}

// ─── Store State ──────────────────────────────────────────────────────────

interface OptimizationState {
  lastRun: string | null
  results: OptimizationResult[]
  totalSaved: number
  totalShippingSaved: number
  avgConfidence: number
  itemsProcessed: number
  status: 'idle' | 'running' | 'completed' | 'error'
  skippedItems: any[]

  // Sustainability & advanced metrics
  totalVolumeSaved: number       // cm³ saved across all results
  avgSustainabilityScore: number // 0–100
  avgCostReductionPct: number    // Average % saved across all results
  carbonSavedKg: number          // totalVolumeSaved × 0.0006
  dimWeightSaved: number         // kg of DIM weight eliminated

  // Actions
  setRunning: () => void
  setResults: (results: OptimizationResult[], skipped: any[]) => void
  addBatchResults: (results: OptimizationResult[]) => void
  setError: (error: string) => void
  reset: () => void
}

function computeStats(results: OptimizationResult[]) {
  const totalSaved = results.reduce((acc, r) => acc + (r.savings || 0), 0)
  const totalShippingSaved = results.reduce((acc, r) => acc + Math.max(0, (r.baseline_cost || 0) - (r.shipping_cost || 0)), 0)
  const avgConfidence = results.length > 0
    ? results.reduce((acc, r) => acc + (r.confidence_score || 0), 0) / results.length
    : 0

  const totalVolumeSaved = results.reduce((acc, r) => acc + (r.volume_saved_cm3 || 0), 0)
  const avgSustainabilityScore = results.length > 0
    ? results.reduce((acc, r) => acc + (r.sustainability_score || 0), 0) / results.length
    : 0
  const avgCostReductionPct = results.length > 0
    ? results.reduce((acc, r) => acc + (r.savings_percent || 0), 0) / results.length
    : 0
  const carbonSavedKg = totalVolumeSaved * 0.0006
  const dimWeightSaved = results.reduce((acc, r) => acc + (r.dim_weight_reduction || 0), 0)

  return {
    totalSaved,
    totalShippingSaved,
    avgConfidence: Math.round(avgConfidence),
    totalVolumeSaved: Math.round(totalVolumeSaved),
    avgSustainabilityScore: Math.round(avgSustainabilityScore),
    avgCostReductionPct: Math.round(avgCostReductionPct),
    carbonSavedKg: parseFloat(carbonSavedKg.toFixed(3)),
    dimWeightSaved: parseFloat(dimWeightSaved.toFixed(2)),
  }
}

export const useOptimizationStore = create<OptimizationState>()(
  persist(
    (set) => ({
      lastRun: null,
      results: [],
      totalSaved: 0,
      totalShippingSaved: 0,
      avgConfidence: 0,
      itemsProcessed: 0,
      status: 'idle',
      skippedItems: [],
      totalVolumeSaved: 0,
      avgSustainabilityScore: 0,
      avgCostReductionPct: 0,
      carbonSavedKg: 0,
      dimWeightSaved: 0,

      setRunning: () => set({
        status: 'running',
        results: [],
        totalSaved: 0,
        totalShippingSaved: 0,
        avgConfidence: 0,
        itemsProcessed: 0,
        skippedItems: [],
        totalVolumeSaved: 0,
        avgSustainabilityScore: 0,
        avgCostReductionPct: 0,
        carbonSavedKg: 0,
        dimWeightSaved: 0,
      }),

      setResults: (results, skipped) => {
        const stats = computeStats(results)
        set({
          results,
          skippedItems: skipped,
          ...stats,
          itemsProcessed: results.length,
          status: 'completed',
          lastRun: new Date().toISOString(),
        })
      },

      addBatchResults: (batchResults) => set((state) => {
        const newResults = [...state.results, ...batchResults]
        const stats = computeStats(newResults)
        return {
          results: newResults,
          ...stats,
          itemsProcessed: newResults.length,
          status: 'running',
        }
      }),

      setError: () => set({ status: 'error' }),

      reset: () => set({
        results: [],
        totalSaved: 0,
        totalShippingSaved: 0,
        avgConfidence: 0,
        itemsProcessed: 0,
        status: 'idle',
        skippedItems: [],
        totalVolumeSaved: 0,
        avgSustainabilityScore: 0,
        avgCostReductionPct: 0,
        carbonSavedKg: 0,
        dimWeightSaved: 0,
      }),
    }),
    {
      name: 'optimization-storage',
    }
  )
)
