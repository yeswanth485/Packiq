import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface OptimizationResult {
  product_id: string
  product_name: string
  original_box: string
  optimized_box: string
  cost_before: number
  cost_after: number
  savings: number
  void_reduction: number
  status: 'success' | 'warning' | 'error'
  error_message?: string
}

interface OptimizationState {
  lastRun: string | null
  results: OptimizationResult[]
  totalSaved: number
  itemsProcessed: number
  status: 'idle' | 'running' | 'completed' | 'error'
  skippedItems: any[]
  
  // Actions
  setRunning: () => void
  setResults: (results: OptimizationResult[], skipped: any[]) => void
  addBatchResults: (results: OptimizationResult[]) => void
  setError: (error: string) => void
  reset: () => void
}

export const useOptimizationStore = create<OptimizationState>()(
  persist(
    (set) => ({
      lastRun: null,
      results: [],
      totalSaved: 0,
      itemsProcessed: 0,
      status: 'idle',
      skippedItems: [],

      setRunning: () => set({ status: 'running', results: [], totalSaved: 0, itemsProcessed: 0, skippedItems: [] }),
      
      setResults: (results, skipped) => {
        const totalSaved = results.reduce((acc, curr) => acc + curr.savings, 0)
        set({ 
          results, 
          skippedItems: skipped,
          totalSaved, 
          itemsProcessed: results.length, 
          status: 'completed',
          lastRun: new Date().toISOString()
        })
      },

      addBatchResults: (batchResults) => set((state) => {
        const newResults = [...state.results, ...batchResults]
        const newTotalSaved = newResults.reduce((acc, curr) => acc + curr.savings, 0)
        return {
          results: newResults,
          totalSaved: newTotalSaved,
          itemsProcessed: newResults.length
        }
      }),

      setError: (error) => set({ status: 'error' }),
      
      reset: () => set({
        results: [],
        totalSaved: 0,
        itemsProcessed: 0,
        status: 'idle',
        skippedItems: []
      })
    }),
    {
      name: 'optimization-storage',
    }
  )
)
