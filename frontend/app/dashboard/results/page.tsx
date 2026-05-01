import { createClient } from '@/lib/supabase/server'
import ResultsClient from './ResultsClient'

export default async function ResultsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Unauthorized</div>
  }

  // Fetch all completed optimizations for the user
  const { data: optimizations, error } = await supabase
    .from('optimizations')
    .select(`
      *,
      box_catalog_data:box_id(*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching optimizations:', error)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Optimization Results</h1>
        <p className="text-gray-400 text-sm">Review your AI-powered packaging recommendations and savings.</p>
      </div>

      <ResultsClient optimizations={optimizations || []} />
    </div>
  )
}
