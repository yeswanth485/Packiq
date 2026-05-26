import { createClient } from './client'

export async function getCompanyByOwner(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('owner_user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getOptimizationRuns(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('optimization_runs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getOptimizationResults(runId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('optimization_results')
    .select('*')
    .eq('run_id', runId)

  if (error) throw error
  return data
}

export async function getUserProfile(userId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data
}
