'use client'

import { useState, useMemo, memo } from 'react'
import { Calendar, Download, TrendingUp, Package, Percent, Box as BoxIcon, Leaf, Wind, Database } from 'lucide-react'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { toast } from 'sonner'
import StatCard from '@/components/dashboard/StatCard'
import { useOptimizationStore } from '@/lib/store/optimizationStore'

const COLORS = ['#00FFD1', '#4f46e5', '#3b82f6', '#ec4899', '#f59e0b']
const SUCCESS_COLORS = ['#00FFD1', '#ef4444']
const RISK_COLORS = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' }

const AnalyticsClient = memo(function AnalyticsClient({ allOptimizations }: { allOptimizations: any[] }) {
  const [dateRange, setDateRange] = useState(30) // days
  const { results: optResults } = useOptimizationStore()

  const optimizationsToUse = useMemo(() => {
    // Start with database optimizations
    const dbList = (allOptimizations || []).map(o => ({
      id: o.product_snapshot?.product_id || o.product_id || o.id,
      created_at: o.created_at,
      status: o.status,
      recommended_box: o.recommended_box || 'N/A',
      cost_savings_usd: o.cost_savings_usd || 0,
      efficiency_score: o.efficiency_score || 0,
      product_snapshot: o.product_snapshot || {},
      ai_response: o.ai_response || {}
    }))

    // Merge session optimizations
    const dbIds = new Set(dbList.map(d => d.id))
    const mappedSession = optResults.map((r, index) => ({
      id: r.product_id || `opt-${index}`,
      created_at: new Date().toISOString(),
      status: r.status === 'error' ? 'failed' : 'completed',
      recommended_box: r.optimized_box || 'N/A',
      cost_savings_usd: r.savings || 0,
      efficiency_score: r.space_utilization || 0,
      product_snapshot: {
        name: r.product_name || r.product_id || 'Unknown',
        current_cost_usd: r.baseline_cost || 0
      },
      ai_response: {
        volume_saved_cm3: r.volume_saved_cm3 || 0,
        sustainabilityScore: r.sustainability_score || 0,
        dim_weight_reduction_kg: r.dim_weight_reduction || 0,
        damageRisk: r.damage_risk || 'Low',
        recommended_box: {
          material: r.packaging_material || 'Corrugated Cardboard'
        },
        new_cost_usd: r.total_cost || 0
      }
    }))

    mappedSession.forEach(s => {
      if (!dbIds.has(s.id)) {
        dbList.push(s)
      }
    })

    return dbList
  }, [allOptimizations, optResults])

  const filteredData = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - dateRange)
    
    return optimizationsToUse.filter(o => new Date(o.created_at) >= cutoff)
  }, [optimizationsToUse, dateRange])

  // KPIs
  const totalSavings = filteredData.reduce((acc, o) => acc + (o.cost_savings_usd || 0), 0)
  const productsOptimized = filteredData.filter(o => o.status === 'completed').length
  const avgEfficiency = productsOptimized > 0 
    ? filteredData.reduce((acc, o) => acc + (o.efficiency_score || 0), 0) / productsOptimized 
    : 0

  // Most used box
  const boxCounts: Record<string, number> = {}
  filteredData.forEach(o => {
    if (o.status === 'completed' && o.recommended_box) {
      boxCounts[o.recommended_box] = (boxCounts[o.recommended_box] || 0) + 1
    }
  })
  const mostUsedBox = Object.entries(boxCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  // NEW KPIs
  const totalVolumeSaved = filteredData.reduce((acc, o) => {
    if (o.status !== 'completed' || !o.ai_response?.volume_saved_cm3) return acc
    return acc + o.ai_response.volume_saved_cm3
  }, 0)
  
  const avgSustainability = productsOptimized > 0
    ? filteredData.reduce((acc, o) => acc + (o.ai_response?.sustainabilityScore || 0), 0) / productsOptimized
    : 0
    
  const carbonReducedKg = totalVolumeSaved * 0.0006
  
  const dimWeightReduction = filteredData.reduce((acc, o) => {
    if (o.status !== 'completed' || !o.ai_response?.dim_weight_reduction_kg) return acc
    return acc + o.ai_response.dim_weight_reduction_kg
  }, 0)

  // Charts Data
  
  // 1. Savings Trend (Line)
  const savingsTrend = useMemo(() => {
    const byDay: Record<string, number> = {}
    filteredData.forEach(o => {
      if (o.status === 'completed') {
        const day = o.created_at.slice(0, 10)
        byDay[day] = (byDay[day] || 0) + (o.cost_savings_usd || 0)
      }
    })
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, savings]) => ({ date, savings: Number(savings.toFixed(2)) }))
  }, [filteredData])

  // 2. Top 10 products by savings
  const topProducts = useMemo(() => {
    const byProduct: Record<string, number> = {}
    filteredData.forEach(o => {
      if (o.status === 'completed') {
        const name = o.product_snapshot?.name || 'Unknown'
        byProduct[name] = (byProduct[name] || 0) + (o.cost_savings_usd || 0)
      }
    })
    return Object.entries(byProduct)
      .map(([name, savings]) => ({ name: name.substring(0, 15), savings: Number(savings.toFixed(2)) }))
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 10)
  }, [filteredData])

  // 3. Success Rate (Donut)
  const successRate = useMemo(() => {
    let success = 0, failed = 0
    filteredData.forEach(o => {
      if (o.status === 'completed') success++
      else if (o.status === 'failed') failed++
    })
    return [
      { name: 'Successful', value: success },
      { name: 'Failed', value: failed }
    ].filter(d => d.value > 0)
  }, [filteredData])
  
  // 4. Packaging Material Distribution (Pie)
  const materialDist = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredData.forEach(o => {
      if (o.status === 'completed' && o.ai_response?.recommended_box?.material) {
        const mat = o.ai_response.recommended_box.material
        counts[mat] = (counts[mat] || 0) + 1
      }
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [filteredData])
  
  // 5. Damage Risk Distribution by Week (Stacked Bar)
  const riskDist = useMemo(() => {
    const byWeek: Record<string, { Low: number, Medium: number, High: number }> = {}
    filteredData.forEach(o => {
      if (o.status === 'completed' && o.ai_response?.damageRisk) {
        const d = new Date(o.created_at)
        const week = `${d.getFullYear()}-W${Math.ceil((d.getDate() - 1 - d.getDay()) / 7) + 1}`
        if (!byWeek[week]) byWeek[week] = { Low: 0, Medium: 0, High: 0 }
        
        const risk = o.ai_response.damageRisk as 'Low' | 'Medium' | 'High'
        if (byWeek[week][risk] !== undefined) {
          byWeek[week][risk]++
        }
      }
    })
    return Object.entries(byWeek).map(([week, risks]) => ({ week, ...risks }))
  }, [filteredData])

  // Export CSV
  const handleExport = () => {
    if (filteredData.length === 0) {
      toast.error('No data to export for this date range')
      return
    }

    const headers = ['Optimization ID', 'Product Name', 'Status', 'Recommended Box', 'Savings USD', 'Efficiency %', 'Date']
    const csvContent = [
      headers.join(','),
      ...filteredData.map(o => {
        const pName = o.product_snapshot?.name ? `"${o.product_snapshot.name.replace(/"/g, '""')}"` : 'Unknown'
        return `${o.id},${pName},${o.status},"${o.recommended_box || ''}",${o.cost_savings_usd || 0},${o.efficiency_score || 0},${o.created_at}`
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `packiq_analytics_${dateRange}d.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Analytics exported successfully')
  }

  return (
    <div className="max-w-[1200px] w-full mx-auto space-y-6 fade-in pb-20 px-4 md:px-0">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <select 
            value={dateRange}
            onChange={e => setDateRange(Number(e.target.value))}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value={7} className="bg-gray-900">Last 7 Days</option>
            <option value={30} className="bg-gray-900">Last 30 Days</option>
            <option value={90} className="bg-gray-900">Last 90 Days</option>
            <option value={365} className="bg-gray-900">Last Year</option>
            <option value={9999} className="bg-gray-900">All Time</option>
          </select>
        </div>
        
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-white/10"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* KPI Summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Savings" value={totalSavings} icon={<TrendingUp className="w-5 h-5 text-green-400" />} color="green" isCurrency />
        <StatCard label="Products Optimized" value={productsOptimized} icon={<Package className="w-5 h-5 text-indigo-400" />} color="indigo" isNumber />
        <StatCard label="Avg Efficiency" value={avgEfficiency} icon={<Percent className="w-5 h-5 text-amber-400" />} color="amber" isPercentage />
        <div className="glass rounded-2xl p-5 bg-gradient-to-br from-cyan-600/20 to-cyan-600/5 border border-cyan-500/20 card-hover">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-1">Most Used Box</p>
              <p className="text-xl font-bold text-white truncate max-w-[150px]">{mostUsedBox}</p>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-cyan-600/20 to-cyan-600/5 border border-cyan-500/20">
              <BoxIcon className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
        </div>
      </div>
      
      {/* NEW Sustainability KPI Summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4" id="sustainability">
        <StatCard label="Volume Saved (cm³)" value={totalVolumeSaved} icon={<Database className="w-5 h-5 text-cyan-400" />} color="cyan" isNumber />
        <StatCard label="Avg Sustainability" value={avgSustainability} icon={<Leaf className="w-5 h-5 text-green-400" />} color="green" isNumber />
        <StatCard label="Carbon Reduced (kg)" value={carbonReducedKg} icon={<Wind className="w-5 h-5 text-green-400" />} color="green" isNumber />
        <StatCard label="DIM Weight Saved" value={dimWeightReduction} icon={<Package className="w-5 h-5 text-amber-400" />} color="amber" isNumber />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Savings Trend */}
        <div className="glass p-8 rounded-[40px] border border-white/5 col-span-1 lg:col-span-2 bg-gradient-to-br from-[#00FFD1]/5 to-transparent">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00FFD1]" /> Multi-Factor Savings Analysis
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00FFD1]" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Optimized Savings</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            {savingsTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={savingsTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSavingsAnalytics" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FFD1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00FFD1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#ffffff20"
                    fontSize={10}
                    tick={{ fill: '#ffffff40' }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    stroke="#ffffff20"
                    fontSize={10}
                    tickFormatter={val => `$${val}`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(10,10,15,0.95)',
                      borderColor: 'rgba(0,255,209,0.2)',
                      borderRadius: '20px',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                    }}
                    itemStyle={{ color: '#00FFD1', fontWeight: 'bold' }}
                    labelStyle={{ color: '#666', marginBottom: '8px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                    formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Savings Generated']}
                  />
                  <Area
                    type="monotone"
                    dataKey="savings"
                    stroke="#00FFD1"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorSavingsAnalytics)"
                    isAnimationActive={true}
                    animationDuration={2000}
                    dot={{ r: 5, fill: '#0A0A0F', strokeWidth: 2, stroke: '#00FFD1' }}
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#00FFD1' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">No data available for this period.</div>
            )}
          </div>
        </div>

        {/* Top 10 Products */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <h3 className="text-sm font-semibold text-gray-300 mb-6">Top Products by Savings</h3>
          <div className="h-64">
            {topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#ffffff50" fontSize={12} tickFormatter={(val) => `$${val}`} />
                  <YAxis dataKey="name" type="category" stroke="#ffffff50" fontSize={12} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                    itemStyle={{ color: '#4f46e5' }}
                    formatter={(val: any) => [`$${val}`, 'Savings']}
                  />
                  <Bar dataKey="savings" fill="#4f46e5" radius={[0, 10, 10, 0]} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">No data available for this period.</div>
            )}
          </div>
        </div>

        {/* Success Rate */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <h3 className="text-sm font-semibold text-gray-300 mb-6">Optimization Success Rate</h3>
          <div className="h-64">
            {successRate.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={successRate}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {successRate.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SUCCESS_COLORS[index % SUCCESS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">No data available for this period.</div>
            )}
          </div>
        </div>
        
        {/* Packaging Material Distribution */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <h3 className="text-sm font-semibold text-gray-300 mb-6">Packaging Material Distribution</h3>
          <div className="h-64">
            {materialDist.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={materialDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {materialDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">No data available for this period.</div>
            )}
          </div>
        </div>
        
        {/* Damage Risk Distribution */}
        <div className="glass p-6 rounded-2xl border border-white/5 col-span-1 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-300 mb-6">Damage Risk Distribution by Week</h3>
          <div className="h-64">
            {riskDist.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riskDist} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="week" stroke="#ffffff50" fontSize={12} />
                  <YAxis stroke="#ffffff50" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Legend />
                  <Bar dataKey="Low" stackId="a" fill={RISK_COLORS.Low} radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Medium" stackId="a" fill={RISK_COLORS.Medium} />
                  <Bar dataKey="High" stackId="a" fill={RISK_COLORS.High} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">No data available for this period.</div>
            )}
          </div>
        </div>

      </div>
      
      {/* Per-SKU Optimization Breakdown */}
      <div className="glass p-8 rounded-[40px] border border-white/5 overflow-hidden">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Database className="w-4 h-4 text-[#00FFD1]" /> Per-SKU Optimization Breakdown
          </h3>
          <div className="px-4 py-1 bg-white/5 rounded-full border border-white/10">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{filteredData.length} Items Analyzed</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <th className="px-6 py-2">Product Name</th>
                <th className="px-6 py-2">Old Cost</th>
                <th className="px-6 py-2">New Cost</th>
                <th className="px-6 py-2">Savings</th>
                <th className="px-6 py-2">Efficiency</th>
                <th className="px-6 py-2">Material</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.slice(0, 20).map((o, idx) => (
                <tr key={`${o.id}-${idx}`} className="group">
                  <td className="px-6 py-4 bg-white/[0.02] rounded-l-2xl border-y border-l border-white/5 group-hover:bg-white/[0.04] transition-colors">
                    <span className="text-white font-bold">{o.product_snapshot?.name || 'Unknown'}</span>
                  </td>
                  <td className="px-6 py-4 bg-white/[0.02] border-y border-white/5 group-hover:bg-white/[0.04] transition-colors">
                    <span className="text-gray-500 line-through">${(o.product_snapshot?.current_cost_usd || 0).toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 bg-white/[0.02] border-y border-white/5 group-hover:bg-white/[0.04] transition-colors">
                    <span className="text-[#00FFD1] font-black">${(o.ai_response?.new_cost_usd || 0).toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 bg-white/[0.02] border-y border-white/5 group-hover:bg-white/[0.04] transition-colors">
                    <span className="text-emerald-400 font-bold">+${(o.cost_savings_usd || 0).toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 bg-white/[0.02] border-y border-white/5 group-hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00FFD1]" style={{ width: `${o.efficiency_score}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-400">{Math.round(o.efficiency_score)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 bg-white/[0.02] rounded-r-2xl border-y border-r border-white/5 group-hover:bg-white/[0.04] transition-colors">
                    <span className="text-xs text-gray-500">{o.ai_response?.recommended_box?.material || 'Corrugated'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sustainability Report Bottom Card */}
      <div className="glass p-8 rounded-2xl border border-white/5 bg-gradient-to-r from-emerald-900/20 to-teal-900/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h3 className="text-xl font-bold text-emerald-400 mb-2 flex items-center gap-2">
              <Leaf className="w-6 h-6" /> PackVision Sustainability Report
            </h3>
            <p className="text-sm text-emerald-200/70 max-w-2xl">
              By optimizing package sizes, you've significantly reduced corrugated cardboard waste and lowered shipping carbon emissions. 
              {carbonReducedKg > 0 && ` Your offset equals approx ${(carbonReducedKg / 22).toFixed(1)} trees planted.`}
            </p>
          </div>
          <button 
            onClick={() => toast('PDF export coming soon')}
            className="whitespace-nowrap px-6 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-sm hover:bg-emerald-500/30 transition-all"
          >
            Download PDF Report
          </button>
        </div>
      </div>
    </div>
  )
})

export default AnalyticsClient
