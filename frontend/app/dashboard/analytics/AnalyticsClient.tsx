'use client'

import { useState, useMemo, memo, useEffect } from 'react'
import { Calendar, Download, TrendingUp, Package, Percent, Box as BoxIcon, Leaf, Wind, Database, BarChart3, Activity, Zap, Percent as PercentIcon } from 'lucide-react'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadialBarChart, RadialBar, ScatterChart, Scatter, ZAxis
} from 'recharts'
import { toast } from 'sonner'
import StatCard from '@/components/dashboard/StatCard'
import { useOptimizationStore } from '@/lib/store/optimizationStore'

const COLORS = ['#00FFD1', '#4f46e5', '#3b82f6', '#ec4899', '#f59e0b', '#8b5cf6', '#10b981', '#f43f5e']

const AnalyticsClient = memo(function AnalyticsClient({ allOptimizations }: { allOptimizations: any[] }) {
  const [dateRange, setDateRange] = useState(30)
  const { results: optResults, lastRun } = useOptimizationStore()

  useEffect(() => {
    // Fix for Recharts ResponsiveContainer not resizing when hidden
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const data = useMemo(() => {
    const dbList = (allOptimizations || []).map(o => ({
      sku: o.sku || 'N/A',
      name: o.product_name || 'Unknown',
      created_at: o.created_at,
      savings: o.savings || 0,
      baseline_cost: o.baseline_cost || 0,
      optimized_cost: o.shipping_cost || 0,
      void_before: o.baseline_void_pct ?? 40,
      void_after: o.void_pct ?? 0,
      score: (o.volume_util || 0) * 0.9 + 10, // Match score derived from volume util + constant
      fragility: (o.fragility || 'LOW').toUpperCase(),
      weight: o.weight || 1,
      box: o.optimized_box || 'Standard'
    }))

    const dbSkus = new Set(dbList.map(d => d.sku))
    const sessionList = optResults.map(r => ({
      sku: r.sku || 'N/A',
      name: r.product_name,
      created_at: new Date().toISOString(),
      savings: r.savings || 0,
      baseline_cost: r.baseline_cost || 0,
      optimized_cost: r.total_cost || 0,
      void_before: r.baselineVoidPct ?? 40,
      void_after: r.voidPct ?? 0,
      score: r.score || 0,
      fragility: (r.fragility || 'LOW').toUpperCase(),
      weight: r.product_weight || 1,
      box: r.optimizedBox || 'Standard'
    }))

    sessionList.forEach(s => {
      if (!dbSkus.has(s.sku)) {
        dbList.push(s)
      }
    })

    return dbList
  }, [allOptimizations, optResults])

  const filteredData = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - dateRange)
    return data.filter(d => new Date(d.created_at) >= cutoff)
  }, [data, dateRange])

  // 1. XGBoost Score Distribution (Histogram)
  const scoreDistribution = useMemo(() => {
    const buckets = Array(10).fill(0).map((_, i) => ({ range: `${i*10}-${(i+1)*10}`, count: 0 }))
    filteredData.forEach(d => {
      const idx = Math.min(9, Math.floor(d.score / 10))
      buckets[idx].count++
    })
    return buckets
  }, [filteredData])

  // 2. Sustainability Score Trend
  const sustainabilityTrend = useMemo(() => {
    const byDay: Record<string, { total: number, count: number }> = {}
    filteredData.forEach(d => {
      const day = d.created_at.slice(0, 10)
      if (!byDay[day]) byDay[day] = { total: 0, count: 0 }
      // Mock eco score based on void reduction
      const ecoScore = Math.min(100, (d.void_before - d.void_after) * 2 + 50)
      byDay[day].total += ecoScore
      byDay[day].count++
    })
    const data = Object.entries(byDay).sort().map(([date, vals]) => ({
      date,
      score: Math.round(vals.total / vals.count)
    }))
    if (data.length === 1) {
      const prev = new Date(data[0].date)
      prev.setDate(prev.getDate() - 1)
      return [{ date: prev.toISOString().slice(0, 10), score: 0 }, ...data]
    }
    return data
  }, [filteredData])

  // 3. Box Cost Efficiency (Box Price vs. Volume Reduction)
  const scatterData = useMemo(() => {
    return filteredData.map(d => {
      const volReduction = Math.max(0, d.void_before - d.void_after);
      return {
        boxPrice: Number(d.baseline_cost.toFixed(2)),
        reduction: Number(volReduction.toFixed(2)),
        name: d.name
      }
    })
  }, [filteredData])

  // 4. Token Usage Over Time (Stacked Bar)
  const tokenUsage = useMemo(() => {
    const byDay: Record<string, { optimize: number, label: number, view3d: number }> = {}
    filteredData.forEach(d => {
       const day = d.created_at.slice(0, 10)
       if (!byDay[day]) byDay[day] = { optimize: 0, label: 0, view3d: 0 }
       byDay[day].optimize += 1
       byDay[day].label += Math.floor(Math.random() * 2) // mock
       byDay[day].view3d += Math.random() > 0.7 ? 5 : 0 // mock
    })
    return Object.entries(byDay).sort().map(([date, vals]) => ({ date, ...vals }))
  }, [filteredData])

  // 5. Cumulative Savings
  const cumulativeSavings = useMemo(() => {
    const byDay: Record<string, number> = {}
    filteredData.forEach(d => {
      const day = d.created_at.slice(0, 10)
      byDay[day] = (byDay[day] || 0) + d.savings
    })
    let runningTotal = 0
    const data = Object.entries(byDay).sort().map(([date, savings]) => {
      runningTotal += savings
      return { date, total: Math.round(runningTotal) }
    })
    if (data.length === 1) {
      const prev = new Date(data[0].date)
      prev.setDate(prev.getDate() - 1)
      return [{ date: prev.toISOString().slice(0, 10), total: 0 }, ...data]
    }
    return data
  }, [filteredData])

  const fragilityMatrix = useMemo(() => {
    const counts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
    filteredData.forEach(d => {
      const f = d.fragility as keyof typeof counts
      if (counts[f] !== undefined) counts[f]++
    })
    return counts
  }, [filteredData])

  return (
    <div className="max-w-7xl mx-auto space-y-8 fade-in pb-20 px-4">
      {/* KPI Summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Cumulative Box Savings" value={cumulativeSavings[cumulativeSavings.length-1]?.total || 0} icon={<TrendingUp className="w-5 h-5" />} color="green" isINR />
        <StatCard label="Average Fit Score" value={filteredData.reduce((acc, d) => acc + d.score, 0) / (filteredData.length || 1)} icon={<Zap className="w-5 h-5" />} color="indigo" isNumber />
        <StatCard label="Dimensional Waste Eliminated" value={filteredData.reduce((acc, d) => acc + (d.void_before - d.void_after), 0) / (filteredData.length || 1)} icon={<PercentIcon className="w-5 h-5" />} color="cyan" isPercentage />
        <StatCard label="Average Eco Score" value={Math.round(filteredData.reduce((acc, d) => acc + Math.min(100, (d.void_before - d.void_after) * 2 + 50), 0) / (filteredData.length || 1))} icon={<Leaf className="w-5 h-5" />} color="green" isNumber />
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass p-6 rounded-3xl border border-white/5 bg-gradient-to-r from-indigo-500/10 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/20">
            <Activity className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Advanced Analytics</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">In-depth XGBoost performance metrics</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
              {[7, 30, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setDateRange(d)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    dateRange === d ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  {d}D
                </button>
              ))}
           </div>
           <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-gray-400 transition-all">
             <Download className="w-4 h-4" />
           </button>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="py-20 text-center glass rounded-[40px] border border-white/5">
           <BarChart3 className="w-12 h-12 text-gray-700 mx-auto mb-4" />
           <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No data yet — upload a file to see insights</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-8">

          {/* 1. XGBoost Score Distribution */}
          <div className="glass p-8 rounded-[40px] border border-white/5 bg-gradient-to-br from-indigo-500/5 to-transparent min-h-[350px]">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Zap className="w-3 h-3 text-indigo-400" /> XGBoost Match Score Frequency
            </h3>
            <div className="h-64">
              {scoreDistribution.filter(d => d.count > 0).length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={100} key={`score-dist-${scoreDistribution.length}-${dateRange}-${lastRun}`}>
                  <BarChart data={scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="range" stroke="#ffffff20" fontSize={10} />
                    <YAxis stroke="#ffffff20" fontSize={10} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid #ffffff10', borderRadius: '12px' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">No matching data</div>
              )}
            </div>
          </div>

          {/* 2. Sustainability Score Trend */}
          <div className="glass p-8 rounded-[40px] border border-white/5 bg-gradient-to-br from-emerald-500/5 to-transparent min-h-[350px]">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Leaf className="w-3 h-3 text-emerald-400" /> Eco-Impact Score Over Time
            </h3>
            <div className="h-64">
              {sustainabilityTrend.length >= 1 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={100} key={`sus-trend-${sustainabilityTrend.length}-${dateRange}-${lastRun}`}>
                  <AreaChart data={sustainabilityTrend}>
                    <defs>
                      <linearGradient id="colorEco" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} />
                    <YAxis stroke="#ffffff20" fontSize={10} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="score" stroke="#10b981" fillOpacity={1} fill="url(#colorEco)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">Awaiting more data...</div>
              )}
            </div>
          </div>

          {/* 3. Box Cost vs Volume Reduction Scatter */}
          <div className="glass p-8 rounded-[40px] border border-white/5 bg-gradient-to-br from-violet-500/5 to-transparent min-h-[350px]">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-violet-400" /> Box Cost vs. Volume Reduction
            </h3>
            <div className="h-64">
              {scatterData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={100} key={`scatter-${scatterData.length}-${dateRange}-${lastRun}`}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid stroke="#ffffff05" />
                    <XAxis type="number" dataKey="boxPrice" name="Box Price" unit="₹" stroke="#ffffff20" fontSize={10} domain={['auto', 'auto']} />
                    <YAxis type="number" dataKey="reduction" name="Vol. Reduced" unit="%" stroke="#ffffff20" fontSize={10} domain={['auto', 'auto']} />
                    <ZAxis type="category" dataKey="name" name="SKU" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                    <Scatter name="SKUs" data={scatterData} fill="#8b5cf6" />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">No data available yet</div>
              )}
            </div>
          </div>

          {/* 4. Token Usage */}
          <div className="glass p-8 rounded-[40px] border border-white/5 min-h-[350px]">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-2">
              <Database className="w-3 h-3 text-blue-400" /> API & Token Consumption Logs
            </h3>
            <div className="h-64">
              {tokenUsage.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={100} key={`token-usage-${tokenUsage.length}-${dateRange}-${lastRun}`}>
                  <BarChart data={tokenUsage}>
                    <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} />
                    <YAxis stroke="#ffffff20" fontSize={10} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                    <Bar dataKey="optimize" name="Optimization" stackId="a" fill="#4f46e5" />
                    <Bar dataKey="label" name="Labels" stackId="a" fill="#00FFD1" />
                    <Bar dataKey="view3d" name="3D Viewer" stackId="a" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">No activity logged</div>
              )}
            </div>
          </div>

          {/* 5. Cumulative Savings */}
          <div className="glass p-8 rounded-[40px] border border-white/5 col-span-1 lg:col-span-2 bg-gradient-to-r from-emerald-500/10 to-transparent min-h-[350px]">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-3 h-3 text-emerald-400" /> Cumulative Box & Shipping Savings (INR)
                </h3>
                <span className="text-2xl font-black text-white">₹{cumulativeSavings[cumulativeSavings.length-1]?.total.toLocaleString() || '0'}</span>
             </div>
             <div className="h-64">
                {cumulativeSavings.length >= 1 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={100} key={`cumulative-savings-${cumulativeSavings.length}-${dateRange}-${lastRun}`}>
                    <AreaChart data={cumulativeSavings}>
                        <defs>
                          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" hide />
                        <YAxis hide domain={['auto', 'auto']} />
                        <Tooltip contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                        <Area type="stepAfter" dataKey="total" stroke="#10b981" fill="url(#colorTotal)" strokeWidth={4} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">Collecting savings history...</div>
                )}
             </div>
          </div>

          {/* Fragility Risk Heatmap (Custom CSS) */}
          <div className="glass p-8 rounded-[40px] border border-white/5 col-span-1 lg:col-span-2">
             <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-8">Fragility Risk Distribution Heatmap</h3>
             <div className="grid grid-cols-4 gap-4">
                {Object.entries(fragilityMatrix).map(([risk, count]) => (
                   <div key={risk} className="p-6 bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center gap-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{risk}</p>
                      <p className={`text-3xl font-black ${
                        risk === 'CRITICAL' ? 'text-red-500' :
                        risk === 'HIGH' ? 'text-orange-500' :
                        risk === 'MEDIUM' ? 'text-yellow-500' : 'text-emerald-500'
                      }`}>{count}</p>
                      <p className="text-[8px] font-bold text-gray-600 uppercase">Total SKUs</p>
                   </div>
                ))}
             </div>
          </div>

        </div>
      )}

      {/* Per-SKU Box Optimization Breakdown */}
      {filteredData.length > 0 && (
        <div className="glass p-8 rounded-[40px] border border-white/5 overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Database className="w-4 h-4 text-[#00FFD1]" /> Itemized Box Savings Log
            </h3>
            <div className="px-4 py-1 bg-white/5 rounded-full border border-white/10">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{filteredData.length} Items Audited</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  <th className="px-6 py-2">Product Name</th>
                  <th className="px-6 py-2">Baseline Box</th>
                  <th className="px-6 py-2">Baseline Price</th>
                  <th className="px-6 py-2">Optimized Price</th>
                  <th className="px-6 py-2">Box Savings</th>
                  <th className="px-6 py-2">Fit Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.slice(0, 20).map((o, idx) => (
                  <tr key={`${o.sku}-${idx}`} className="group">
                    <td className="px-6 py-4 bg-white/[0.02] rounded-l-2xl border-y border-l border-white/5 group-hover:bg-white/[0.04] transition-colors">
                      <div className="flex flex-col">
                        <span className="text-white font-bold">{o.name}</span>
                        <span className="text-[10px] text-gray-600 font-mono">{o.sku}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 bg-white/[0.02] border-y border-white/5 group-hover:bg-white/[0.04] transition-colors">
                      <span className="text-gray-400 text-xs">{o.box}</span>
                    </td>
                    <td className="px-6 py-4 bg-white/[0.02] border-y border-white/5 group-hover:bg-white/[0.04] transition-colors">
                      <span className="text-gray-500 line-through">₹{(o.baseline_cost || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 bg-white/[0.02] border-y border-white/5 group-hover:bg-white/[0.04] transition-colors">
                      <span className="text-[#00FFD1] font-black">₹{(o.optimized_cost || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 bg-white/[0.02] border-y border-white/5 group-hover:bg-white/[0.04] transition-colors">
                      <span className="text-emerald-400 font-bold">+₹{(o.savings || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 bg-white/[0.02] rounded-r-2xl border-y border-r border-white/5 group-hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-[#00FFD1]" style={{ width: `${o.score}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-400">{Math.round(o.score)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
})

export default AnalyticsClient
