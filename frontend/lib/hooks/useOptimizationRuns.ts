import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

export function useOptimizationRuns() {
  const supabase = createClient()

  const { data, error, isLoading, mutate } = useSWR(
    'optimization-runs',
    async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data: runs, error } = await supabase
        .from('optimization_runs')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return runs
    },
    {
      revalidateOnFocus: false,
    }
  )

  const stats = data ? {
    totalRuns: data.length,
    totalSavings: data.reduce((acc: number, run: any) => acc + (run.total_savings_inr || 0), 0),
    avgUtilization: data.length > 0
      ? data.reduce((acc: number, run: any) => acc + (run.avg_utilization_percent || 0), 0) / data.length
      : 0,
    totalCo2: data.reduce((acc: number, run: any) => acc + (run.co2_saved_kg || 0), 0),
  } : null

  return {
    runs: data,
    stats,
    isLoading,
    error,
    mutate
  }
}
