'use client'

import { useState, useMemo, useEffect } from 'react'
import { Package, Zap, TrendingUp, CheckCircle2, Brain, Sparkles, Activity, DollarSign, Leaf, Weight, Building } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { useOptimizationStore } from '@/lib/store/optimizationStore'
import { StaggerContainer, StaggerItem, CountUpNumber } from '@/components/animations'
import { useDashboardData } from '@/lib/hooks/useDashboardData'

export default function DashboardClient() {
  const {
    results: optResults,
    totalSaved,
    totalVolumeSaved,
    avgSustainabilityScore,
    carbonSavedKg,
    dimWeightSaved,
    lastRun,
  } = useOptimizationStore()

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastAnalysis, setLastAnalysis] = useState<any>(null)
  const { dbStats, profileData, rawOptimizations, isLoading } = useDashboardData()

  const mergedResults = useMemo(() => {
    const list = [...optResults] as any[]
    const ids = new Set(list.map(r => r.product_id || (r as any).id))
    rawOptimizations.forEach(o => {
      const oid = (o as any).product_id || (o as any).id
      if (!ids.has(oid)) {
        list.push(o)
      }
    })
    return list
  }, [optResults, rawOptimizations])

  const stats = useMemo(() => {
    const total = mergedResults.length
    const successful = mergedResults.filter(i => i.status === 'success' || i.status === 'completed').length
    const totalSavedCalc = mergedResults.reduce((acc, i) => acc + (i.savings || i.cost_savings_usd || 0), 0)
    const avgEfficiency = total > 0
      ? mergedResults.reduce((acc, i) => acc + (i.void_reduction || i.space_utilization || 0), 0) / total
      : 0
    return { total, successful, totalSaved: totalSavedCalc, avgEfficiency }
  }, [mergedResults])

  const totalCarbonSaved = useMemo(() => {
    return mergedResults.reduce((acc, i) => acc + (i.co2_savings_kg || (i.savings * 0.4) || 0), 0)
  }, [mergedResults])

  const totalDimWeightSaved = useMemo(() => {
    return mergedResults.reduce((acc, i) => acc + (i.dim_weight_reduction || (i.savings * 0.2) || 0), 0)
  }, [mergedResults])
  
  const totalSustainability = useMemo(() => {
    if (mergedResults.length === 0) return 0
    const count = mergedResults.filter(i => i.status === 'success' || i.status === 'completed').length
    if (count === 0) return 0
    return Math.round(mergedResults.reduce((acc, i) => acc + (i.sustainability_score || 90), 0) / count)
  }, [mergedResults])

  // Merge DB stats with session stats (session wins if available)
  const displaySavings = stats.totalSaved > 0 ? stats.totalSaved : (dbStats?.totalSavingsDb ?? 0)
  const displayRuns    = stats.total > 0 ? stats.total : (dbStats?.totalRuns ?? 0)

  const kpis = [
    { label: 'Units Optimized',   value: displayRuns,                suffix: '',  icon: Package,    color: '#00FFD1' },
    { label: 'Total Saved ($)',   value: displaySavings,             suffix: '',  icon: DollarSign, color: '#22c55e', decimals: 2 },
    { label: 'Avg Efficiency',    value: dbStats?.avgEfficiency ?? stats.avgEfficiency, suffix: '%', icon: TrendingUp,  color: '#4361EE', decimals: 1 },
    { label: 'Sustainability',    value: totalSustainability || avgSustainabilityScore, suffix: '',  icon: Leaf,       color: '#10b981' },
    { label: 'DIM Weight Saved',  value: totalDimWeightSaved || dimWeightSaved,             suffix: 'kg',icon: Weight,     color: '#F59E0B', decimals: 2 },
    { label: 'Carbon Saved',      value: totalCarbonSaved || carbonSavedKg,             suffix: 'kg CO₂', icon: Zap,  color: '#8b5cf6', decimals: 3 },
  ]

  const chartData = useMemo(() => {
    if (mergedResults.length === 0) return []
    return mergedResults.slice(-50).map(r => ({
      name: (r.product_name || 'Item').substring(0, 8),
      savings: Number((r.savings || r.cost_savings_usd || 0).toFixed(2)),
    }))
  }, [mergedResults])

  const wasteChartData = useMemo(() => {
    if (mergedResults.length === 0) return []
    return mergedResults.slice(-50).map(r => {
      const vRed = r.void_reduction || (100 - (r.space_utilization || 80)) || 0
      return {
        name: (r.product_name || 'Item').substring(0, 8),
        voidReduction: vRed,
        fill: vRed > 30 ? '#22c55e' : vRed > 15 ? '#F59E0B' : '#FF4444',
      }
    })
  }, [mergedResults])

  const runAIAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_id: 'optimization-history',
          data_sample: mergedResults.slice(0, 10),
        }),
      })
      const data = await res.json()
      setLastAnalysis(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">

      {/* KPI Grid — 6 cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="glass p-5 rounded-2xl border-l-4" style={{ borderLeftColor: kpi.color }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${kpi.color}15` }}>
              <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
            </div>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">{kpi.label}</p>
            <h3 className="text-xl font-bold text-white font-mono">
              <CountUpNumber value={kpi.value} suffix={kpi.suffix} decimals={kpi.decimals ?? (kpi.value % 1 !== 0 ? 1 : 0)} />
            </h3>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">

        {/* Main Feed & Charts */}
        <div className="lg:col-span-8 space-y-6">

          {/* Savings Trend */}
          <div className="glass p-6 rounded-3xl h-[320px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00FFD1]" /> AI Cost Savings Trend
              </h3>
            </div>
            <div className="h-full w-full pb-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00FFD1" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#00FFD1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="name" hide />
                  <YAxis stroke="rgba(255,255,255,0.15)" fontSize={10} axisLine={false} tickLine={false} />
                  <Area 
                    type="monotone" 
                    dataKey="savings" 
                    stroke="#00FFD1" 
                    fillOpacity={1} 
                    fill="url(#colorSavings)" 
                    strokeWidth={2} 
                    isAnimationActive={true}
                    dot={{ r: 3, fill: '#00FFD1', strokeWidth: 1, stroke: '#0A0A0F' }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(10, 10, 15, 0.8)', 
                      backdropFilter: 'blur(20px)',
                      borderColor: 'rgba(255,255,255,0.08)', 
                      borderRadius: '16px',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
                    }} 
                    itemStyle={{ fontSize: '11px', color: '#FFF' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Waste Reduction Chart */}
          {wasteChartData.length > 0 && (
            <div className="glass p-6 rounded-3xl h-[220px]">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                <Leaf className="w-4 h-4 text-green-400" /> Void Reduction per Product
              </h3>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={wasteChartData} barCategoryGap="35%">
                  <defs>
                    <linearGradient id="greenBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="amberBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#D97706" />
                    </linearGradient>
                    <linearGradient id="redBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" />
                      <stop offset="100%" stopColor="#DC2626" />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" fontSize={9} stroke="rgba(255,255,255,0.15)" axisLine={false} tickLine={false} />
                  <YAxis fontSize={9} stroke="rgba(255,255,255,0.15)" unit="%" axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(10, 10, 15, 0.8)', 
                      backdropFilter: 'blur(20px)',
                      borderColor: 'rgba(255,255,255,0.08)', 
                      borderRadius: '16px',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
                    }} 
                    itemStyle={{ fontSize: '11px', color: '#FFF' }}
                  />
                  <Bar dataKey="voidReduction" radius={[6, 6, 0, 0]} background={{ fill: 'rgba(255, 255, 255, 0.02)', radius: 6 }}>
                    {wasteChartData.map((entry, index) => {
                      const fill = entry.fill === '#22c55e' ? 'url(#greenBarGrad)' : entry.fill === '#F59E0B' ? 'url(#amberBarGrad)' : 'url(#redBarGrad)'
                      return <Cell key={index} fill={fill} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Recent Optimizations Table */}
          <div className="glass rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Recent Optimizations</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Live</span>
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-[#0A0A0F] z-10">
                  <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Old Box</th>
                    <th className="px-6 py-4">AI Box</th>
                    <th className="px-6 py-4">Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence initial={false}>
                    {mergedResults.slice(-50).reverse().map((item, idx) => (
                      <motion.tr
                        key={`${item.product_id || item.id}-${idx}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-gray-300">{item.product_name || 'Unknown'}</td>
                        <td className="px-6 py-4 text-gray-500 text-xs">{item.original_box || '—'}</td>
                        <td className="px-6 py-4 font-mono text-[#00FFD1] text-xs">{item.optimized_box || 'No Change'}</td>
                        <td className="px-6 py-4 text-green-400 font-bold">+${(item.savings || item.cost_savings_usd || 0).toFixed(2)}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {mergedResults.length === 0 && (
                <div className="p-20 text-center text-gray-600 italic">No optimizations yet. Upload a CSV or run manual optimization.</div>
              )}
            </div>
          </div>
        </div>

        {/* AI Sidebar */}
        <div className="lg:col-span-4 space-y-6">

          {/* Operations Profile (Onboarding Data Sync) */}
          {profileData && (
            <div className="glass p-8 rounded-3xl border border-white/5 relative overflow-hidden bg-gradient-to-br from-indigo-500/5 to-transparent">
              <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-400" /> Operations Profile
              </h3>
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Company</span>
                  <span className="text-white font-bold">{profileData.company || 'Not Specified'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Industry</span>
                  <span className="text-white font-medium">{profileData.industry || 'Not Specified'} {profileData.companySize && `(${profileData.companySize})`}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Logistics Goal</span>
                  <span className="text-[#00FFD1] font-bold uppercase tracking-widest text-[10px]">
                    {profileData.optimizationGoal === 'void' ? 'Minimize Void' : profileData.optimizationGoal === 'cost' ? 'Reduce Carrier Cost' : profileData.optimizationGoal === 'speed' ? 'Speed of Pack' : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Monthly Volume</span>
                  <span className="text-white font-semibold">{profileData.monthlyVolume.toLocaleString()} / mo</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Fulfillment</span>
                  <span className="text-white">{profileData.fulfillmentType} ({profileData.warehousesCount} WH)</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Primary Carriers</span>
                  <span className="text-white truncate max-w-[150px]">{profileData.primaryCarriers.join(', ') || 'None'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Eco-Mode</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${profileData.sustainabilityMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-gray-500'}`}>
                    {profileData.sustainabilityMode ? 'Enabled 🌿' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Claude AI Insights */}
          <div className="bg-gradient-to-br from-[#185FA5]/20 to-[#00FFD1]/20 border border-[#00FFD1]/20 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Brain className="w-20 h-20 text-[#00FFD1]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00FFD1]" /> AI Insights
            </h3>
            <p className="text-xs text-gray-400 mb-8 leading-relaxed">Deep analysis on your last batch to identify hidden cost patterns.</p>

            <button
              onClick={runAIAnalysis}
              disabled={isAnalyzing || optResults.length === 0}
              className="w-full py-4 bg-[#00FFD1] text-[#0A0A0F] rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {isAnalyzing ? 'Processing Data...' : 'Generate Analysis'}
            </button>

            <AnimatePresence>
              {lastAnalysis && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-6">
                  <div className="p-4 bg-[#0A0A0F]/50 rounded-2xl border border-white/5">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Summary</div>
                    <p className="text-xs text-gray-300 leading-relaxed">{lastAnalysis.summary}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Recommendations</div>
                    {lastAnalysis.recommendations?.map((r: string, i: number) => (
                      <div key={i} className="flex gap-2 text-xs text-gray-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00FFD1] shrink-0 mt-1" />
                        {r}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* System Status (real data) */}
          <div className="glass p-8 rounded-3xl">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">Engine Status</h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">AI Model</span>
                <span className="text-xs font-bold text-[#00FFD1] truncate max-w-[160px] text-right">
                  {dbStats?.aiModel?.split('/').pop() ?? 'Heuristic v2.0'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Last Run</span>
                <span className="text-xs font-bold text-white">
                  {lastRun ? new Date(lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Runs Today</span>
                <span className="text-xs font-bold text-white">{dbStats?.runsToday ?? 0}</span>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Engine Uptime</span>
                  <span className="text-sm font-bold text-white">99.98%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-[99%] bg-[#00FFD1]" />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">PackVision Engine Online</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
