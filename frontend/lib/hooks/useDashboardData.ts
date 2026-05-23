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
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile && mounted) {
          setProfileData({
            company: profile.company_name || profile.company || '',
            industry: profile.industry || '',
            companySize: profile.company_size || '',
            monthlyVolume: profile.monthly_volume || 1000,
            primaryCarriers: profile.primary_carriers || [],
            fulfillmentType: profile.fulfillment_type || 'In-House',
            warehousesCount: profile.warehouses_count || 1,
            sizeUnits: profile.unit_system || 'metric',
            optimizationGoal: profile.optimization_goal || 'void',
            sustainabilityMode: profile.sustainability_mode || false,
            plan: profile.plan || 'starter',
            tokensLimit: profile.token_limit || 500,
            tokensUsed: profile.monthly_opt_count || 0,
            tokenResetDate: profile.monthly_opt_reset || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
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
            status: r.optimized ? 'success' : 'error',
            error: r.optimized ? null : (r.reason || 'No suitable box found'),
            product_id: r.sku,
            product_name: r.product_name || r.sku,
            product_price: 0,
            product_dims: typeof r.dimensions === 'string' ? r.dimensions : (r.dimensions ? `${r.dimensions.l}x${r.dimensions.w}x${r.dimensions.h}` : '—'),
            product_weight: r.weight || 0.5,
            original_box: r.baseline_box || 'Not specified',
            original_box_cost: r.baseline_cost || 0,
            optimized_box: r.optimized_box || 'Unoptimized',
            optimized_box_cost: r.shipping_cost || 0,
            optimized_box_dims: typeof r.optimized_dims === 'string' ? r.optimized_dims : (r.optimized_dims ? `${r.optimized_dims.l}x${r.optimized_dims.w}x${r.optimized_dims.h}` : '—'),
            optimized_box_sku: r.optimized_box || '—',
            packaging_material: r.optimized ? 'Corrugated Cardboard' : '—',
            fill_material: r.optimized ? 'Recycled Paper' : '—',
            packaging_cost: r.shipping_cost || 0,
            shipping_cost: r.shipping_cost || 0,
            total_cost: r.shipping_cost || 0,
            baseline_cost: r.baseline_cost || 0,
            cost_before: r.baseline_cost || 0,
            cost_after: r.shipping_cost || 0,
            savings: r.savings || 0,
            savings_percent: r.savings_percent || 0,
            damage_risk: r.fragility || 'Low',
            space_utilization: r.volume_util || 0,
            confidence_score: 95,
            void_reduction: r.volume_util || 0,
            void_pct: r.void_pct || 0,
            baseline_void_pct: r.baseline_void_pct || 0,
            fit_score: 95,
            void_score: 90,
            cost_score: 85,
            sustainability_score: 90,
            final_score: 85,
            reasoning: r.reason || 'Optimized by ML Scorer',
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
