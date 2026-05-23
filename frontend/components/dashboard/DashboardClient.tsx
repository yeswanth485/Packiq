'use client'

import { useState, useMemo, useEffect, memo } from 'react'
import { Package, Zap, TrendingUp, CheckCircle2, Brain, Sparkles, Activity, DollarSign, Leaf, Weight, Building, Box as BoxIcon } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, RadialBarChart, RadialBar, PieChart, Pie, Tooltip, Legend } from 'recharts'
import { useOptimizationStore } from '@/lib/store/optimizationStore'
import { StaggerContainer, StaggerItem, CountUpNumber } from '@/components/animations'
import { useDashboardData } from '@/lib/hooks/useDashboardData'

const COLORS = ['#00FFD1', '#4f46e5', '#3b82f6', '#ec4899', '#f59e0b', '#8b5cf6', '#10b981', '#f43f5e']

const DashboardClient = memo(function DashboardClient() {
  const {
    results: optResults,
    totalSaved,
    totalVolumeSaved,
    avgSustainabilityScore,
    avgCostReductionPct,
    carbonSavedKg,
    dimWeightSaved,
    lastRun,
  } = useOptimizationStore()

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastAnalysis, setLastAnalysis] = useState<any>(null)
  const { dbStats, profileData, rawOptimizations, isLoading, refreshData } = useDashboardData()

  const mergedResults = useMemo(() => {
    const list = [...optResults] as any[]
    const ids = new Set(list.map(r => r.sku || r.product_id || (r as any).id))
    rawOptimizations.forEach(o => {
      const oid = (o as any).sku || (o as any).product_id || (o as any).id
      if (!ids.has(oid)) {
        list.push(o)
      }
    })
    return list
  }, [optResults, rawOptimizations])

  useEffect(() => {
    const handleRefresh = () => {
      refreshData?.();
    };
    window.addEventListener('optimization-complete', handleRefresh);

    // Fix for Recharts ResponsiveContainer not resizing when hidden
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 100)

    return () => {
      window.removeEventListener('optimization-complete', handleRefresh);
      clearTimeout(timer)
    }
  }, [refreshData]);

  const stats = useMemo(() => {
    const total = mergedResults.length
    const totalOriginalCost = mergedResults.reduce((acc, o) => acc + (o.baseline_cost || 0), 0)
    const totalOptimizedCost = mergedResults.reduce((acc, o) => acc + (o.total_cost || o.shipping_cost || 0), 0)
    const totalSavings = totalOriginalCost - totalOptimizedCost
    const avgReduction = totalOriginalCost > 0 ? (totalSavings / totalOriginalCost) * 100 : 0
    return { total, totalOriginalCost, totalOptimizedCost, totalSavings, avgReduction }
  }, [mergedResults])

  // 1. SKUs Optimized Over Time (AreaChart)
  const skuTrendData = useMemo(() => {
    const byDay: Record<string, number> = {}
    mergedResults.forEach(r => {
      const day = (r.created_at || new Date().toISOString()).slice(0, 10)
      byDay[day] = (byDay[day] || 0) + 1
    })
    return Object.entries(byDay).sort().map(([date, count]) => ({ date, count }))
  }, [mergedResults])

  // 2. Cost Savings Trend (LineChart - Dual Line)
  const costTrendData = useMemo(() => {
    const byDay: Record<string, { original: number, optimized: number }> = {}
    mergedResults.forEach(r => {
      const day = (r.created_at || new Date().toISOString()).slice(0, 10)
      if (!byDay[day]) byDay[day] = { original: 0, optimized: 0 }
      byDay[day].original += (r.baseline_cost || 0)
      byDay[day].optimized += (r.total_cost || r.shipping_cost || 0)
    })
    return Object.entries(byDay).sort().map(([date, vals]) => ({ date, ...vals }))
  }, [mergedResults])

  // 3. Box Utilization Distribution (Horizontal BarChart)
  const boxDistData = useMemo(() => {
    const counts: Record<string, number> = {}
    mergedResults.forEach(r => {
      const box = r.optimized_box || r.optimizedBox || 'Other'
      counts[box] = (counts[box] || 0) + 1
    })
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count)
  }, [mergedResults])

  // 4. Void Space Reduction (RadialBarChart)
  const voidReductionData = useMemo(() => {
    const before = mergedResults.length > 0 ? mergedResults.reduce((acc, r) => acc + (r.baseline_void_pct || r.baselineVoidPct || 40), 0) / mergedResults.length : 0
    const after = mergedResults.length > 0 ? mergedResults.reduce((acc, r) => acc + (r.void_pct || r.voidPct || 0), 0) / mergedResults.length : 0
    return [
      { name: 'Before', value: Math.round(before), fill: '#94a3b8' },
      { name: 'After', value: Math.round(after), fill: '#00FFD1' }
    ]
  }, [mergedResults])

  // 5. Top 5 SKUs by Savings (Ranked BarChart)
  const topSavingsData = useMemo(() => {
    return mergedResults
      .map(r => ({ name: (r.product_name || 'Item').substring(0, 12), savings: r.savings || 0 }))
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 5)
  }, [mergedResults])

  // 6. Carrier Rate Breakdown (PieChart)
  const carrierDistData = useMemo(() => {
    const counts: Record<string, number> = {}
    mergedResults.forEach(r => {
       const weight = r.weight || r.product_weight || 0
       const tier = weight < 1 ? 'Tier 1 (<1kg)' : weight < 5 ? 'Tier 2 (1-5kg)' : 'Tier 3 (>5kg)'
       counts[tier] = (counts[tier] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [mergedResults])

  const kpis = [
    { label: 'SKUs Optimized', value: stats.total, icon: Package, color: '#4f46e5' },
    { label: 'Total Box Savings', value: `₹${stats.totalSavings.toLocaleString()}`, icon: TrendingUp, color: '#22c55e' },
    { label: 'Waste Eliminated', value: `${stats.avgReduction.toFixed(1)}%`, icon: Zap, color: '#f59e0b' },
    { label: 'Carbon Saved', value: `${(stats.totalSavings * 0.05).toFixed(1)}kg`, icon: Leaf, color: '#10b981' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 px-4">

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
            <div className="flex items-center gap-3 mb-3">
               <div className="p-2 rounded-xl" style={{ backgroundColor: `${kpi.color}15` }}>
                  <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
               </div>
               <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{kpi.label}</span>
            </div>
            <p className="text-2xl font-black text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      {mergedResults.length === 0 ? (
        <div className="py-20 text-center glass rounded-[40px] border border-white/5">
           <Activity className="w-12 h-12 text-gray-700 mx-auto mb-4" />
           <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No data yet — upload a file to see insights</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-8">

          {/* 1. SKUs Optimized Over Time */}
          <div className="lg:col-span-8 glass p-8 rounded-[40px] border border-white/5 min-h-[350px]">
             <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-8">SKUs Optimized Over Time</h3>
             <div className="h-64">
                {skuTrendData.length >= 2 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={100} key={`sku-trend-${skuTrendData.length}-${lastRun}`}>
                    <AreaChart data={skuTrendData}>
                        <defs>
                          <linearGradient id="colorSku" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} />
                        <YAxis stroke="#ffffff20" fontSize={10} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                        <Area type="monotone" dataKey="count" stroke="#4f46e5" fill="url(#colorSku)" strokeWidth={4} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">Awaiting optimization history...</div>
                )}
             </div>
          </div>

          {/* 4. Void Space Reduction */}
          <div className="lg:col-span-4 glass p-8 rounded-[40px] border border-white/5 flex flex-col items-center min-h-[350px]">
             <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Void Space Reduction</h3>
             <div className="h-64 w-full">
                {voidReductionData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={100} key={`void-reduction-${voidReductionData.length}-${lastRun}`}>
                    <RadialBarChart innerRadius="30%" outerRadius="100%" barSize={15} data={voidReductionData}>
                        <RadialBar label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }} background dataKey="value" />
                        <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase' }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">No data</div>
                )}
             </div>
          </div>

          {/* 2. Cost Savings Trend */}
          <div className="lg:col-span-12 glass p-8 rounded-[40px] border border-white/5 min-h-[350px]">
             <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-8">Baseline vs AI-Optimized Box & Shipping Cost (INR)</h3>
             <div className="h-64">
                {costTrendData.length >= 2 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={100} key={`cost-trend-${costTrendData.length}-${lastRun}`}>
                    <LineChart data={costTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} />
                        <YAxis stroke="#ffffff20" fontSize={10} domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase' }} />
                        <Line type="monotone" dataKey="original" name="Baseline Cost" stroke="#94a3b8" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="optimized" name="AI Optimized Cost" stroke="#00FFD1" strokeWidth={4} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">Collecting trend data...</div>
                )}
             </div>
          </div>

          {/* 3. Box Utilization */}
          <div className="lg:col-span-6 glass p-8 rounded-[40px] border border-white/5 min-h-[350px]">
             <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-8">Box Size Distribution</h3>
             <div className="h-64">
                {boxDistData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={100} key={`box-dist-${boxDistData.length}-${lastRun}`}>
                    <BarChart data={boxDistData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" stroke="#ffffff40" fontSize={10} width={100} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        <Tooltip contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid #ffffff10', borderRadius: '12px' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">No box data yet</div>
                )}
             </div>
          </div>

          {/* 5. Top 5 SKUs */}
          <div className="lg:col-span-6 glass p-8 rounded-[40px] border border-white/5 min-h-[350px]">
             <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-8">Top 5 SKUs by Savings</h3>
             <div className="h-64">
                {topSavingsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={100} key={`top-savings-${topSavingsData.length}-${lastRun}`}>
                    <BarChart data={topSavingsData}>
                        <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} />
                        <YAxis stroke="#ffffff20" fontSize={10} domain={['auto', 'auto']} />
                        <Bar dataKey="savings" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Tooltip contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">No savings data</div>
                )}
             </div>
          </div>

          {/* 6. Carrier Breakdown */}
          <div className="lg:col-span-12 glass p-8 rounded-[40px] border border-white/5 flex flex-col items-center min-h-[450px]">
             <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-8">Weight Tier Distribution</h3>
             <div className="h-80 w-full">
                {carrierDistData.some(d => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={100} key={`carrier-dist-${carrierDistData.length}-${lastRun}`}>
                    <PieChart>
                        <Pie data={carrierDistData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                          {carrierDistData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">Awaiting shipment data</div>
                )}
             </div>
          </div>

        </div>
      )}
    </div>
  )
})

export default DashboardClient
