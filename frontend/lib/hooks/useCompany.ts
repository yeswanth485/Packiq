import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

export function useCompany() {
  const supabase = createClient()

  const { data, error, isLoading, mutate } = useSWR(
    'company-data',
    async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return company as any
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 min
    }
  )

  return {
    company: data,
    logo_url: data?.logo_url,
    isLoading,
    error,
    mutate
  }
}
