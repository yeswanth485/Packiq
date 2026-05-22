import { createClient } from '@/lib/supabase/server'
import { Suspense, lazy } from 'react'
import DashboardLoading from '../loading'

const AnalyticsClient = lazy(() => import('./AnalyticsClient'))

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let dbOptimizations: any[] = []
  if (user) {
    // Fetch optimization sessions (batch-level data)
    const { data: sessions } = await supabase
      .from('optimization_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Fetch individual results for detailed analytics
    const { data: results } = await supabase
      .from('optimization_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Merge session-level + result-level data for analytics
    if (sessions && results) {
      dbOptimizations = sessions.map((s: any) => ({
        ...s,
        results: results.filter((r: any) => r.session_id === s.id),
      }))
    }
  }

  return (
    <Suspense fallback={<DashboardLoading />}>
      <AnalyticsClient allOptimizations={dbOptimizations} />
    </Suspense>
  )
}
