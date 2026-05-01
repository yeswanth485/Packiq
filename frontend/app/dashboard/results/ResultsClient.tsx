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
  
  const filteredData = useMemo(() => {
    return optimizations.filter(o => {
      const name = (o.product_snapshot?.name || '').toLowerCase()
      const matchesSearch = name.includes(searchTerm.toLowerCase())
      
      let matchesSavings = true
      if (savingsFilter === 'gt1') matchesSavings = o.cost_savings_usd >= 1
      if (savingsFilter === 'gt5') matchesSavings = o.cost_savings_usd >= 5
      
      return matchesSearch && matchesSavings
    })
  }, [optimizations, searchTerm, savingsFilter])

  // Chart Data preparation
  const chartDataSavings = useMemo(() => {
    return filteredData.slice(0, 10).map(o => ({
      name: o.product_snapshot?.name?.substring(0, 15) || 'Unknown',
      savings: Number(o.cost_savings_usd || 0).toFixed(2)
    }))
  }, [filteredData])

  const chartDataCost = useMemo(() => {
    return filteredData.slice(0, 10).map(o => ({
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
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-left">Product</th>
                <th className="px-6 py-4 text-left">Old Box</th>
                <th className="px-6 py-4 text-left">New Box</th>
                <th className="px-6 py-4 text-right">Old Cost</th>
                <th className="px-6 py-4 text-right">New Cost</th>
                <th className="px-6 py-4 text-right cursor-pointer hover:text-white transition-colors group">
                  <div className="flex items-center justify-end gap-1">Savings <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" /></div>
                </th>
                <th className="px-6 py-4 text-right">Efficiency</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((o) => {
                const product = o.product_snapshot || {}
                const oldCost = Number(product.current_cost_usd || 0)
                const newCost = Number(o.ai_response?.new_cost_usd || 0)
                const savings = Number(o.cost_savings_usd || 0)
                
                return (
                  <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-gray-200 font-medium">{product.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{product.product_id || product.sku || o.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{product.current_box_size || 'Unknown'}</td>
                    <td className="px-6 py-4 text-indigo-400">{o.recommended_box || '—'}</td>
                    <td className="px-6 py-4 text-right text-gray-400">${oldCost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-gray-200">${newCost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-green-400 font-medium">+${savings.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        o.efficiency_score >= 80 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                        o.efficiency_score >= 60 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                        'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {o.efficiency_score}%
                      </span>
                    </td>
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
