'use client'

import { useState, useMemo } from 'react'
import { Search, Filter, ArrowUpDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import ResultsSlideOver from '@/components/dashboard/ResultsSlideOver'

interface ResultsClientProps {
  optimizations: any[]
}

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444']

export default function ResultsClient({ optimizations }: ResultsClientProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [savingsFilter, setSavingsFilter] = useState('all') // all, >1, >5
  const [selectedOpt, setSelectedOpt] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState<'successful' | 'failed'>('successful')
  
  const flatOptimizations = useMemo(() => {
    const list: any[] = []
    optimizations.forEach(opt => {
      if (opt.results && Array.isArray(opt.results)) {
        opt.results.forEach((res: any, idx: number) => {
          const isItemFitted = res.fits && res.assignedBox
          list.push({
            id: `${opt.id}-${res.sku || idx}`,
            batch_id: opt.batch_id || opt.id,
            created_at: opt.created_at,
            file_name: opt.file_name || 'Bulk Upload',
            ai_model: opt.ai_model || 'XGBoost ML Scorer v2.1',
            status: isItemFitted ? 'completed' : 'error',
            error: isItemFitted ? null : (res.failure_reason || 'No suitable box found in catalog'),
            product_id: res.sku || `SKU-${idx}`,
            product_snapshot: {
              name: res.name || res.product_name || 'Unknown Product',
              product_name: res.name || res.product_name || 'Unknown Product',
              sku: res.sku || `SKU-${idx}`,
              product_id: res.sku || `SKU-${idx}`,
              length_cm: res.dimensions?.length_cm || res.dimensions?.length || 0,
              width_cm: res.dimensions?.width_cm || res.dimensions?.width || 0,
              height_cm: res.dimensions?.height_cm || res.dimensions?.height || 0,
              weight_kg: res.weight || 0.5,
              fragility: res.fragility || 'Low',
              current_box_name: res.original_box || 'Not specified',
              current_box_size: res.original_box || 'Not specified',
              current_cost_usd: (res.assignedBox?.cost || 0.5) + (res.savings || 0),
            },
            recommended_box: isItemFitted ? res.assignedBox.name : 'Unoptimized',
            cost_savings_usd: res.savings || 0,
            efficiency_score: Math.round(res.volume_utilization || 0),
            space_utilization: Math.round(res.volume_utilization || 0),
            box_catalog_data: isItemFitted ? {
              id: res.assignedBox.id,
              name: res.assignedBox.name,
              sku: res.assignedBox.sku,
              length_cm: res.assignedBox.length_cm,
              width_cm: res.assignedBox.width_cm,
              height_cm: res.assignedBox.height_cm,
              cost_usd: res.assignedBox.cost,
            } : null,
            ai_response: {
              baselineCost: (res.assignedBox?.cost || 0.5) + (res.savings || 0),
              totalCost: res.assignedBox?.cost || 0,
              new_cost_usd: res.assignedBox?.cost || 0,
              savings: res.savings || 0,
              damage_risk: res.fragility || 'Low',
              void_reduction: 100 - Math.round(res.volume_utilization || 0),
              space_utilization: Math.round(res.volume_utilization || 0),
              reasoning: res.recommendation_reason || res.failure_reason || 'Selected because it optimized cost and space.',
              alternatives: res.alternatives || []
            }
          })
        })
      } else {
        // Single product run fallback
        list.push({
          ...opt,
          product_snapshot: {
            ...opt.product_snapshot,
            name: opt.product_snapshot?.product_name || opt.product_snapshot?.name || 'Unknown Product',
            product_name: opt.product_snapshot?.product_name || opt.product_snapshot?.name || 'Unknown Product',
          }
        })
      }
    })
    return list
  }, [optimizations])

  const filteredData = useMemo(() => {
    return flatOptimizations.filter(o => {
      const isFailed = o.status === 'error' || !!o.error || !o.recommended_box || o.recommended_box === 'Unoptimized' || o.recommended_box === 'Error'
      if (activeTab === 'successful' && isFailed) return false
      if (activeTab === 'failed' && !isFailed) return false

      const name = (o.product_snapshot?.name || '').toLowerCase()
      const matchesSearch = name.includes(searchTerm.toLowerCase())
      
      let matchesSavings = true
      if (savingsFilter === 'gt1') matchesSavings = o.cost_savings_usd >= 1
      if (savingsFilter === 'gt5') matchesSavings = o.cost_savings_usd >= 5
      
      return matchesSearch && matchesSavings
    })
  }, [flatOptimizations, searchTerm, savingsFilter, activeTab])

  // Chart Data preparation
  const chartDataSavings = useMemo(() => {
    return filteredData.map(o => ({
      name: o.product_snapshot?.name?.substring(0, 15) || 'Unknown',
      savings: Number(o.cost_savings_usd || 0).toFixed(2)
    }))
  }, [filteredData])

  const chartDataCost = useMemo(() => {
    return filteredData.map(o => ({
      name: o.product_snapshot?.name?.substring(0, 15) || 'Unknown',
      oldCost: Number(o.product_snapshot?.current_cost_usd || 0),
      newCost: Number(o.ai_response?.new_cost_usd || 0)
    }))
  }, [filteredData])

  const chartDataEfficiency = useMemo(() => {
    let low = 0, mid = 0, high = 0
    filteredData.forEach(o => {
      const eff = o.efficiency_score || 0
      if (eff < 60) low++
      else if (eff < 80) mid++
      else high++
    })
    return [
      { name: '0-60%', value: low },
      { name: '60-80%', value: mid },
      { name: '80-100%', value: high }
    ].filter(d => d.value > 0)
  }, [filteredData])

  return (
    <div className="space-y-8 fade-in">
      <div className="flex gap-4 p-1 bg-white/[0.03] border border-white/5 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('successful')}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'successful' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-gray-500 hover:text-white'}`}
        >
          Successful Optimizations
        </button>
        <button 
          onClick={() => setActiveTab('failed')}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'failed' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-gray-500 hover:text-white'}`}
        >
          Why Not Optimized ⚠
        </button>
      </div>

      {/* Filters */}
      <div className="glass p-4 rounded-2xl border border-white/5 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Filter by product name..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select 
              value={savingsFilter}
              onChange={e => setSavingsFilter(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-xl pl-10 pr-8 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="all">All Savings</option>
              <option value="gt1">Savings &gt; $1.00</option>
              <option value="gt5">Savings &gt; $5.00</option>
            </select>
          </div>
        </div>
        <div className="text-sm text-gray-400">
          Showing {filteredData.length} results
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-left">Product</th>
                {activeTab === 'successful' ? (
                  <>
                    <th className="px-6 py-4 text-left">Old Box</th>
                    <th className="px-6 py-4 text-left">New Box</th>
                    <th className="px-6 py-4 text-left">Dimensions</th>
                    <th className="px-6 py-4 text-left">Fragility</th>
                    <th className="px-6 py-4 text-right">Void %</th>
                    <th className="px-6 py-4 text-right">Score</th>
                    <th className="px-6 py-4 text-right">Old Cost</th>
                    <th className="px-6 py-4 text-right">New Cost</th>
                    <th className="px-6 py-4 text-right cursor-pointer hover:text-white transition-colors group">
                      <div className="flex items-center justify-end gap-1">Savings <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                    </th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 text-left">Dimensions</th>
                    <th className="px-6 py-4 text-left">Weight</th>
                    <th className="px-6 py-4 text-left">Failure Reason</th>
                    <th className="px-6 py-4 text-left">Suggested Fix</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((o) => {
                const product = o.product_snapshot || {}
                const oldCost = Number(o.ai_response?.baselineCost || product.current_cost_usd || 0)
                const newCost = Number(o.ai_response?.totalCost || o.total_cost || 0)
                const savings = Number(o.cost_savings_usd || o.ai_response?.savings || 0)
                
                if (activeTab === 'failed') {
                  const reason = o.error || o.ai_response?.reasoning || 'No suitable box found in catalog'
                  let fix = 'Check catalog configuration or seed default boxes'
                  if (reason.includes('heavy') || reason.includes('weight')) fix = 'Add boxes with higher weight limits'
                  else if (reason.includes('large') || reason.includes('dimensions')) fix = 'Add larger boxes to catalog'

                  return (
                    <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-gray-200 font-medium">{product.name || o.product_id || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{product.product_id || o.product_id || o.id.slice(0, 8)}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">{product.length_cm}x{product.width_cm}x{product.height_cm}</td>
                      <td className="px-6 py-4 text-gray-400">{product.weight_kg}kg</td>
                      <td className="px-6 py-4 text-red-400 font-medium">⚠ {reason}</td>
                      <td className="px-6 py-4 text-indigo-400 font-medium">{fix}</td>
                    </tr>
                  )
                }

                const fragility = o.ai_response?.damage_risk || (product.fragile ? 'High' : 'Low')
                const voidPct = o.ai_response?.void_reduction !== undefined ? o.ai_response.void_reduction : (100 - (o.space_utilization || o.ai_response?.space_utilization || 0))
                const reasoning = o.ai_response?.reasoning || 'No details provided.'
                const modelUsed = o.ai_model || 'XGBoost ML Scorer v2.1'

                return (
                  <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-gray-200 font-medium">{product.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{product.product_id || product.sku || o.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{product.current_box_size || product.current_box_name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-indigo-400 font-medium text-xs">
                      <div className="font-bold">{o.recommended_box || '—'}</div>
                      <div className="text-[10px] text-gray-500 max-w-[200px] truncate" title={reasoning}>{reasoning}</div>
                      <div className="text-[10px] text-[#00FFD1] mt-0.5 font-mono uppercase tracking-tighter">{modelUsed}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">{product.length_cm}x{product.width_cm}x{product.height_cm} cm</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${
                        fragility.toLowerCase() === 'high' || fragility.toLowerCase() === 'extreme' 
                          ? 'bg-red-500/20 text-red-400' 
                          : fragility.toLowerCase() === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {fragility}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        voidPct <= 15 ? 'bg-green-500/20 text-green-400' : voidPct <= 30 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {Math.max(0, voidPct).toFixed(1)}% Void
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        (100 - voidPct) >= 80 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {(100 - voidPct).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-400">${oldCost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-gray-200">${newCost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-green-400 font-medium">+${savings.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedOpt(o)}
                        className="text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No optimizations found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Section */}
      {filteredData.length > 0 && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Savings by Product */}
          <div className="glass p-6 rounded-2xl border border-white/5">
            <h3 className="text-sm font-semibold text-gray-300 mb-6">Savings by Product (Top 10)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataSavings} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#ffffff50" fontSize={12} tickFormatter={(val) => `$${val}`} />
                  <YAxis dataKey="name" type="category" stroke="#ffffff50" fontSize={12} width={100} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                    itemStyle={{ color: '#10b981' }}
                    formatter={(val: any) => [`$${val}`, 'Savings']}
                  />
                  <Bar dataKey="savings" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cost Comparison */}
          <div className="glass p-6 rounded-2xl border border-white/5">
            <h3 className="text-sm font-semibold text-gray-300 mb-6">Cost Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartDataCost} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tick={false} />
                  <YAxis stroke="#ffffff50" fontSize={12} tickFormatter={(val) => `$${val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="oldCost" name="Old Cost" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="newCost" name="New Cost" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Efficiency Distribution */}
          <div className="glass p-6 rounded-2xl border border-white/5">
            <h3 className="text-sm font-semibold text-gray-300 mb-6">Efficiency Distribution</h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartDataEfficiency}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartDataEfficiency.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <ResultsSlideOver 
        isOpen={!!selectedOpt} 
        onClose={() => setSelectedOpt(null)} 
        data={selectedOpt} 
      />
    </div>
  )
}
