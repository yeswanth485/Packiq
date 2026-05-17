import { createClient } from '@/lib/supabase/server'
import AnalyticsClient from './AnalyticsClient'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let dbOptimizations: any[] = []
  if (user) {
    const { data } = await supabase
      .from('optimizations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (data) {
      dbOptimizations = data
    }
  }

  return <AnalyticsClient allOptimizations={dbOptimizations} />
}
