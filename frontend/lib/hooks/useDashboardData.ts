import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const mapToOptimizationResult = (opt: any, res: any, idx: number) => {
  const isItemFitted = res.fits && res.assignedBox
  const boxCost = res.assignedBox?.cost || 0.5
  const savings = res.savings || 0
  const baselineCost = isItemFitted ? (boxCost + savings) : 0.5
  
  return {
    id: `${opt.id}-${res.sku || idx}`,
    batch_id: opt.batch_id || opt.id,
    created_at: opt.created_at,
    file_name: opt.file_name || 'Bulk Upload',
    ai_model: opt.ai_model || 'XGBoost ML Scorer v2.1',
    status: isItemFitted ? 'success' : 'error',
    error: isItemFitted ? null : (res.failure_reason || 'No suitable box found in catalog'),
    product_id: res.sku || `SKU-${idx}`,
    product_name: res.name || res.product_name || 'Unknown Product',
    product_price: 0,
    product_dims: `${res.dimensions?.length_cm || 0}x${res.dimensions?.width_cm || 0}x${res.dimensions?.height_cm || 0}`,
    product_weight: res.weight || 0.5,
    original_box: res.original_box || 'Not specified',
    original_box_cost: baselineCost,
    optimized_box: isItemFitted ? res.assignedBox.name : 'Unoptimized',
    optimized_box_cost: boxCost,
    optimized_box_dims: isItemFitted ? `${res.assignedBox.length_cm}x${res.assignedBox.width_cm}x${res.assignedBox.height_cm}` : '—',
    optimized_box_sku: isItemFitted ? res.assignedBox.sku : '—',
    packaging_material: isItemFitted ? 'Corrugated Cardboard' : '—',
    fill_material: isItemFitted ? 'Recycled Paper / Bubble Wrap' : '—',
    packaging_cost: boxCost,
    shipping_cost: isItemFitted ? Math.round(boxCost * 0.8 * 100) / 100 : 0.5, 
    total_cost: isItemFitted ? boxCost + Math.round(boxCost * 0.8 * 100) / 100 : 0.5,
    baseline_cost: isItemFitted ? baselineCost + Math.round(baselineCost * 0.8 * 100) / 100 : 0.5,
    cost_before: isItemFitted ? baselineCost + Math.round(baselineCost * 0.8 * 100) / 100 : 0.5,
    cost_after: isItemFitted ? boxCost + Math.round(boxCost * 0.8 * 100) / 100 : 0.5,
    savings: savings,
    savings_percent: isItemFitted ? (savings / baselineCost) * 100 : 0,
    damage_risk: res.fragility || 'Low',
    space_utilization: Math.round(res.volume_utilization || 0),
    confidence_score: 95,
    void_reduction: 100 - Math.round(res.volume_utilization || 0),
    fit_score: 95,
    void_score: 90,
    cost_score: 85,
    sustainability_score: 90,
    final_score: 92,
    reasoning: res.recommendation_reason || res.failure_reason || 'Optimized by XGBoost Scorer',
    packing_tips: [
      'Place the heaviest item at the center bottom.',
      'Fill remaining void with paper pads.'
    ],
    candidates_evaluated: 5,
    model: opt.ai_model || 'XGBoost ML Scorer v2.1',
    data_quality: 'complete'
  }
}

const mapSingleToOptimizationResult = (opt: any) => {
  const p = opt.product_snapshot || {}
  const res = opt.ai_response || {}
  const isItemFitted = opt.recommended_box && opt.recommended_box !== 'Unoptimized'
  
  return {
    id: opt.id,
    batch_id: opt.batch_id || opt.id,
    created_at: opt.created_at,
    file_name: opt.file_name || 'Bulk Upload',
    ai_model: opt.ai_model || 'XGBoost ML Scorer v2.1',
    status: isItemFitted ? 'success' : 'error',
    error: isItemFitted ? null : (res.reasoning || 'No suitable box found in catalog'),
    product_id: p.sku || p.product_id || opt.product_id || 'SKU-0',
    product_name: p.name || p.product_name || 'Unknown Product',
    product_price: 0,
    product_dims: `${p.length_cm || 0}x${p.width_cm || 0}x${p.height_cm || 0}`,
    product_weight: p.weight_kg || 0.5,
    original_box: p.current_box_name || p.current_box_size || 'Not specified',
    original_box_cost: p.current_cost_usd || 0.5,
    optimized_box: opt.recommended_box || 'Unoptimized',
    optimized_box_cost: res.new_cost_usd || res.totalCost || 0.5,
    optimized_box_dims: isItemFitted ? `${p.length_cm}x${p.width_cm}x${p.height_cm}` : '—',
    optimized_box_sku: opt.recommended_box || '—',
    packaging_material: isItemFitted ? 'Corrugated Cardboard' : '—',
    fill_material: isItemFitted ? 'Recycled Paper / Bubble Wrap' : '—',
    packaging_cost: res.new_cost_usd || res.totalCost || 0.5,
    shipping_cost: isItemFitted ? Math.round((res.new_cost_usd || res.totalCost || 0.5) * 0.8 * 100) / 100 : 0.5,
    total_cost: res.totalCost || opt.total_cost || 0.5,
    baseline_cost: res.baselineCost || p.current_cost_usd || 0.5,
    cost_before: res.baselineCost || p.current_cost_usd || 0.5,
    cost_after: res.totalCost || opt.total_cost || 0.5,
    savings: opt.cost_savings_usd || 0,
    savings_percent: (opt.cost_savings_usd || 0) / (res.baselineCost || p.current_cost_usd || 1) * 100,
    damage_risk: res.damage_risk || (p.fragile ? 'High' : 'Low'),
    space_utilization: opt.efficiency_score || 0,
    confidence_score: 95,
    void_reduction: res.void_reduction || 0,
    fit_score: 95,
    void_score: 90,
    cost_score: 85,
    sustainability_score: 90,
    final_score: 92,
    reasoning: res.reasoning || 'Optimized by XGBoost Scorer',
    packing_tips: [
      'Place the heaviest item at the center bottom.',
      'Fill remaining void with paper pads.'
    ],
    candidates_evaluated: 5,
    model: opt.ai_model || 'XGBoost ML Scorer v2.1',
    data_quality: 'complete'
  }
}

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
  } | null>(null)
  
  const [rawOptimizations, setRawOptimizations] = useState<any[]>([])
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
            plan: profile.plan || 'free',
          })
        }

        // 2. Fetch Optimization Summary
        const { data } = await (supabase as any).rpc('get_optimization_summary', {
          p_user_id: user.id,
          p_days: 30,
        })

        // 3. Fetch Raw Optimizations
        const { data: optimizations } = await supabase
          .from('optimizations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (mounted) {
          const list: any[] = []
          if (optimizations) {
            optimizations.forEach((opt: any) => {
              if (opt.results && Array.isArray(opt.results)) {
                opt.results.forEach((res: any, idx: number) => {
                  list.push(mapToOptimizationResult(opt, res, idx))
                });
              } else {
                list.push(mapSingleToOptimizationResult(opt))
              }
            })
          }
          setRawOptimizations(list)
        }

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

  return { dbStats, profileData, rawOptimizations, isLoading }
}
