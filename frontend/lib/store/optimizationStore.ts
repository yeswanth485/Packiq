import { create } from 'zustand'

export interface Company {
  id: string
  owner_user_id: string
  company_name: string
  industry: string
  address: string
  phone?: string
  website?: string
  logo_url?: string
}

export interface OptimizationRun {
  id: string
  user_id: string
  company_id: string
  run_name: string
  status: string
  total_skus: number
  total_savings_inr: number
  avg_utilization_percent: number
  co2_saved_kg: number
  results_json: any
  created_at: string
}

export interface OptimizationResult {
  id: string
  run_id: string
  user_id: string
  product_name: string
  original_length_cm: number
  original_width_cm: number
  original_height_cm: number
  original_weight_kg: number
  fragility: 'low' | 'medium' | 'high'
  quantity: number
  optimized_length_cm: number
  optimized_width_cm: number
  optimized_height_cm: number
  original_box_price_inr: number
  optimized_box_price_inr: number
  savings_inr: number
  savings_percent: number
  fragility_score: number
  optimization_score: number
  space_utilization_percent: number
  co2_saved_kg: number
  created_at: string
}

interface OptimizationStore {
  currentRun: OptimizationRun | null
  results: OptimizationResult[]
  company: Company | null
  isOptimizing: boolean
  setCurrentRun: (run: OptimizationRun) => void
  setResults: (results: OptimizationResult[]) => void
  setCompany: (company: Company) => void
  setIsOptimizing: (v: boolean) => void
  clearResults: () => void
}

export const useOptimizationStore = create<OptimizationStore>((set) => ({
  currentRun: null,
  results: [],
  company: null,
  isOptimizing: false,
  setCurrentRun: (run) => set({ currentRun: run }),
  setResults: (results) => set({ results }),
  setCompany: (company) => set({ company }),
  setIsOptimizing: (v) => set({ isOptimizing: v }),
  clearResults: () => set({ results: [], currentRun: null }),
}))
