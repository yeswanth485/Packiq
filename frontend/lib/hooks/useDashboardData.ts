import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useDashboardData() {
  const [dbStats, setDbStats] = useState<{
    totalRuns: number
    totalSavingsDb: number
    avgEfficiency: number
    runsToday: number
    aiModel: string
  } | null>(null)
  
  const [profileData, setProfileData] = useState<{
    company: string
    industry: string
    companySize: string
    monthlyVolume: number
    primaryCarriers: string[]
    fulfillmentType: string
    warehousesCount: number
    sizeUnits: string
    optimizationGoal: string
    sustainabilityMode: boolean
  } | null>(null)
  
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchDbStats = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Fetch Profile Preferences
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile && mounted) {
          setProfileData({
            company: profile.company || '',
            industry: profile.industry || '',
            companySize: profile.company_size || '',
            monthlyVolume: profile.monthly_volume || 1000,
            primaryCarriers: profile.primary_carriers || [],
            fulfillmentType: profile.fulfillment_type || 'In-House',
            warehousesCount: profile.warehouses_count || 1,
            sizeUnits: profile.size_units || 'cm',
            optimizationGoal: profile.optimization_goal || 'void',
            sustainabilityMode: profile.sustainability_mode || false,
          })
        }

        // 2. Fetch Optimization Summary
        const { data } = await (supabase as any).rpc('get_optimization_summary', {
          p_user_id: user.id,
          p_days: 30,
        })

        if (data && mounted) {
          // Also get the most recent AI model used
          const { data: recent } = await (supabase as any)
            .from('optimizations')
            .select('ai_model')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          setDbStats({
            totalRuns:       data.total_runs || 0,
            totalSavingsDb:  parseFloat((data.total_savings_usd || 0).toFixed(2)),
            avgEfficiency:   parseFloat((data.avg_efficiency || 0).toFixed(1)),
            runsToday:       data.runs_today || 0,
            aiModel:         recent?.ai_model || 'PackVision Heuristic v2.0',
          })
        }
      } catch (err) {
        console.error('Error loading DB stats:', err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    fetchDbStats()

    return () => {
      mounted = false
    }
  }, [])

  return { dbStats, profileData, isLoading }
}
