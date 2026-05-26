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
    plan: string
    tokensLimit: number
    tokensUsed: number
    tokenResetDate: string
  } | null>(null)
  
  const [rawOptimizations, setRawOptimizations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshToggle, setRefreshToggle] = useState(false)

  const refreshData = () => setRefreshToggle(prev => !prev)

  useEffect(() => {
    const handleRefresh = () => refreshData()
    window.addEventListener('optimization-complete', handleRefresh)
    return () => window.removeEventListener('optimization-complete', handleRefresh)
  }, [])

  useEffect(() => {
    let mounted = true

    const fetchDbStats = async () => {
      setIsLoading(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Fetch Profile Preferences
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (profile && mounted) {
          const p = profile as any
          setProfileData({
            company: p.company_name || p.company || '',
            industry: p.industry || '',
            companySize: p.company_size || '',
            monthlyVolume: p.monthly_volume || 1000,
            primaryCarriers: p.primary_carriers || [],
            fulfillmentType: p.fulfillment_type || 'In-House',
            warehousesCount: p.warehouses_count || 1,
            sizeUnits: p.unit_system || 'metric',
            optimizationGoal: p.optimization_goal || 'void',
            sustainabilityMode: p.sustainability_mode || false,
            plan: p.plan || 'starter',
            tokensLimit: p.token_limit || 500,
            tokensUsed: p.monthly_opt_count || 0,
            tokenResetDate: p.monthly_opt_reset || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
          })
        }

        // 2. Fetch optimization sessions
        const { data: sessions } = await supabase
          .from('optimization_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        // 3. Fetch all optimization results for dashboard charts
        // Also fetch from orders table as it now contains the denormalized data we need
        const { data: results } = await supabase
          .from('optimization_results')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (mounted && results) {
          // Map optimization_results rows to the format DashboardClient expects
          const list = results.map((r: any) => ({
            id: r.id,
            batch_id: r.session_id,
            created_at: r.created_at,
            file_name: '',
            aiModel: 'XGBoost Extended Version 4.0',
            status: r.is_optimized ? 'success' : 'error',
            error: r.is_optimized ? null : (r.failure_reason || 'No suitable box found'),
            product_id: r.sku,
            product_name: r.product_name || r.sku,
            product_price: 0,
            product_dims: `${r.length_cm || 0}x${r.width_cm || 0}x${r.height_cm || 0}`,
            product_weight: r.weight_kg || 0.5,
            original_box: r.old_box_name || 'Not specified',
            original_box_cost: r.old_box_cost || 0,
            optimized_box: r.new_box_name || 'Unoptimized',
            optimized_box_cost: r.new_box_cost || 0,
            optimized_box_dims: r.new_box_dims || '—',
            optimized_box_sku: r.new_box_name || '—',
            packaging_material: r.is_optimized ? 'Corrugated Cardboard' : '—',
            fill_material: r.is_optimized ? 'Recycled Paper' : '—',
            packaging_cost: r.new_box_cost || 0,
            shipping_cost: r.is_optimized ? (r.weight_kg || 0.5) * 0.54 : 0,
            total_cost: (r.new_box_cost || 0) + (r.is_optimized ? (r.weight_kg || 0.5) * 0.54 : 0),
            baseline_cost: r.old_box_cost || 0,
            cost_before: r.old_box_cost || 0,
            cost_after: r.new_box_cost || 0,
            savings: r.savings_amount || 0,
            savings_percent: r.savings_pct || 0,
            damage_risk: r.fragility_level || 'Low',
            space_utilization: r.volume_utilization || 0,
            confidence_score: 95,
            void_reduction: r.void_percentage || 0,
            fit_score: 95,
            void_score: 90,
            cost_score: 85,
            sustainability_score: 90,
            final_score: r.ml_score || 85,
            reasoning: r.recommendation_reason || r.failure_reason || 'Optimized by ML Scorer',
            packing_tips: ['Place heaviest item at center bottom.', 'Fill void with paper pads.'],
            candidates_evaluated: 5,
            model: 'XGBoost Extended Version 4.0',
            data_quality: 'complete'
          }))
          setRawOptimizations(list)
        }

        if (sessions && mounted) {
          const totalRuns = sessions.length
          const totalSavings = sessions.reduce((acc: number, s: any) => acc + (s.estimated_savings || 0), 0)
          const totalItems = sessions.reduce((acc: number, s: any) => acc + (s.total_items || 0), 0)
          const totalOptimized = sessions.reduce((acc: number, s: any) => acc + (s.optimized_items || 0), 0)
          const avgEff = totalItems > 0 ? (totalOptimized / totalItems) * 100 : 0
          const today = new Date().toISOString().split('T')[0]
          const runsToday = sessions.filter((s: any) => s.created_at?.startsWith(today)).length

          setDbStats({
            totalRuns,
            totalSavingsDb: parseFloat(totalSavings.toFixed(2)),
            avgEfficiency: parseFloat(avgEff.toFixed(1)),
            runsToday,
            aiModel: 'XGBoost Extended Version 4.0',
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
  }, [refreshToggle])

  return { dbStats, profileData, rawOptimizations, isLoading, refreshData }
}
