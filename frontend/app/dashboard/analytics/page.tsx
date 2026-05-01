import { createClient } from '@/lib/supabase/server'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Unauthorized</div>
  }

  // Fetch all optimizations for comprehensive analytics
  const { data: optimizations, error } = await supabase
    .from('optimizations')
    .select('*, product_snapshot')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching analytics data:', error)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Analytics Overview</h1>
        <p className="text-gray-400 text-sm">Deep dive into your packaging optimization metrics and ROI.</p>
      </div>

      <AnalyticsClient allOptimizations={optimizations || []} />
    </div>
  )
}
