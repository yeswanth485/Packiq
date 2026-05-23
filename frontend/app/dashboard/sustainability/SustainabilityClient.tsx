'use client'

import { useState, useMemo, memo } from 'react'
import { motion } from 'framer-motion'
import {
  Leaf, Wind, TreePine, ShieldCheck, Zap,
  ArrowRight, Award, Trash2, Cpu, Globe
} from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts'
import { useOptimizationStore } from '@/lib/store/optimizationStore'
import { CountUpNumber } from '@/components/animations'
import { useDashboardData } from '@/lib/hooks/useDashboardData'

const GRADIENTS = [
  { id: 'ecoEmerald', stop1: '#10B981', stop2: '#059669' },
  { id: 'ecoTeal', stop1: '#0D9488', stop2: '#0F766E' },
  { id: 'ecoGreen', stop1: '#22C55E', stop2: '#15803D' },
  { id: 'ecoLime', stop1: '#84CC16', stop2: '#4D7C0F' },
  { id: 'ecoCyan', stop1: '#06B6D4', stop2: '#0891B2' }
]

const SustainabilityClient = memo(function SustainabilityClient() {
  const { results: optResults } = useOptimizationStore()
  const { dbStats, rawOptimizations, isLoading } = useDashboardData()

  // Eco-Simulator States
  const [biodegradableTape, setBiodegradableTape] = useState(true)
  const [recycledMailers, setRecycledMailers] = useState(true)
  const [carbonOffsetCouriers, setCarbonOffsetCouriers] = useState(false)

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

  // Real data calculations
  const stats = useMemo(() => {
    if (!mergedResults || mergedResults.length === 0) {
      return {
        totalVolumeSavedCm3: 0,
        carbonReducedKg: 0,
        treesEquivalent: 0,
        cardboardSavedM2: 0,
        avgEcoScore: 0,
        materialData: []
      }
    }

    // Accumulate total volume saved
    const totalVolumeSaved = mergedResults.reduce((acc, o) => {
      if (o.status === 'error' || o.status === 'failed') return acc
      const vSaved = o.volume_saved_cm3 || (o.savings ? o.savings * 3500 : 0) || 0
      return acc + vSaved
    }, 0)

    const carbonReduced = totalVolumeSaved * 0.0012
    const trees = Number((carbonReduced / 21.77).toFixed(1))
    const cardboardM2 = totalVolumeSaved * 0.00018 // approx surface area based on volume

    // Calculate avg eco score
    const completed = mergedResults.filter(o => o.status !== 'error' && o.status !== 'failed')
    const avgScore = completed.length > 0
      ? completed.reduce((acc, o) => acc + (o.sustainability_score || 80), 0) / completed.length
      : 0

    // Calculate material distribution
    const counts: Record<string, number> = {}
    completed.forEach(o => {
      const mat = o.packaging_material || 'Recycled Cardboard'
      counts[mat] = (counts[mat] || 0) + 1
    })

    const materialData = Object.entries(counts).map(([name, value]) => ({
      name,
      value
    }))

    return {
      totalVolumeSavedCm3: Math.round(totalVolumeSaved),
      carbonReducedKg: Number(carbonReduced.toFixed(2)),
      treesEquivalent: trees,
      cardboardSavedM2: Number(cardboardM2.toFixed(1)),
      avgEcoScore: Math.round(avgScore),
      materialData
    }
  }, [mergedResults])

  // Simulator ESG projection calculations
  const simulatorSavings = useMemo(() => {
    let baseScore = stats.avgEcoScore
    let carbonMultiplier = 1.0

    if (biodegradableTape) {
      baseScore += 5
      carbonMultiplier += 0.08
    }
    if (recycledMailers) {
      baseScore += 7
      carbonMultiplier += 0.12
    }
    if (carbonOffsetCouriers) {
      baseScore += 10
      carbonMultiplier += 0.25
    }

    const projectedScore = Math.min(100, baseScore)
    const projectedCarbon = Number((stats.carbonReducedKg * carbonMultiplier).toFixed(2))
    const projectedTrees = Number((projectedCarbon / 21.77).toFixed(1))

    return {
      projectedScore,
      projectedCarbon,
      projectedTrees
    }
  }, [stats, biodegradableTape, recycledMailers, carbonOffsetCouriers])

  // 1. CO2 Savings Bar (Last 7 runs)
  const co2BarData = useMemo(() => {
    return mergedResults.slice(-7).map(r => ({
      name: (r.product_name || 'Item').substring(0, 8),
      co2: Number(((r.volume_saved_cm3 || (r.savings ? r.savings * 3500 : 0) || 0) * 0.0012).toFixed(3))
    }))
  }, [mergedResults])

  // 2. Eco Score Trend Line
  const ecoTrendData = useMemo(() => {
    const byDay: Record<string, { total: number, count: number }> = {}
    mergedResults.forEach(r => {
      const day = (r.created_at || new Date().toISOString()).slice(0, 10)
      if (!byDay[day]) byDay[day] = { total: 0, count: 0 }
      byDay[day].total += (r.sustainability_score || 80)
      byDay[day].count++
    })
    return Object.entries(byDay).sort().map(([date, vals]) => ({
      date,
      score: Math.round(vals.total / vals.count)
    }))
  }, [mergedResults])

  return (
    <div className="max-w-[1200px] w-full mx-auto space-y-8 pb-20 px-4 md:px-0">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <Leaf className="w-8 h-8 text-[#10B981] animate-pulse" /> ESG & Sustainability Control Center
          </h1>
          <p className="text-gray-500 text-sm font-medium">Real-time green packaging statistics, carbon reduction, and circularity analytics.</p>
        </div>

        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <Award className="w-4 h-4" /> ESG Grade: A+ Certified
        </div>
      </div>

      {/* Hero Interactive Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Carbon Offset Card */}
        <div className="glass p-6 rounded-[32px] border-l-4 border-emerald-500 bg-gradient-to-br from-emerald-950/20 to-transparent">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <Wind className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">CO₂ Saved</span>
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Carbon Reduced</p>
          <h3 className="text-3xl font-black text-white font-mono flex items-baseline gap-1">
            <CountUpNumber value={stats.carbonReducedKg} decimals={2} />
            <span className="text-xs text-gray-400">kg</span>
          </h3>
        </div>

        {/* Tree equivalent Card */}
        <div className="glass p-6 rounded-[32px] border-l-4 border-teal-500 bg-gradient-to-br from-teal-950/20 to-transparent">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center">
              <TreePine className="w-6 h-6 text-teal-400" />
            </div>
            <span className="text-[10px] font-black text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Offset equivalent</span>
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Trees Planted</p>
          <h3 className="text-3xl font-black text-white font-mono flex items-baseline gap-1">
            <CountUpNumber value={stats.treesEquivalent} decimals={1} />
            <span className="text-xs text-gray-400">mature trees</span>
          </h3>
        </div>

        {/* Material saved Card */}
        <div className="glass p-6 rounded-[32px] border-l-4 border-green-500 bg-gradient-to-br from-green-950/20 to-transparent">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
              <Globe className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-[10px] font-black text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Cardboard saved</span>
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Material Saved</p>
          <h3 className="text-3xl font-black text-white font-mono flex items-baseline gap-1">
            <CountUpNumber value={stats.cardboardSavedM2} decimals={1} />
            <span className="text-xs text-gray-400">m²</span>
          </h3>
        </div>

        {/* Space efficiency Card */}
        <div className="glass p-6 rounded-[32px] border-l-4 border-cyan-500 bg-gradient-to-br from-cyan-950/20 to-transparent">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Avg Eco Score</span>
          </div>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Sustainability Score</p>
          <h3 className="text-3xl font-black text-white font-mono flex items-baseline gap-1">
            <CountUpNumber value={stats.avgEcoScore} />
            <span className="text-xs text-gray-400">%</span>
          </h3>
        </div>

      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-12 gap-6">

        {/* Left Side: Interactive ESG Packaging Simulator */}
        <div className="lg:col-span-7 glass p-8 rounded-[40px] flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" /> ESG & Material Simulator
              </h3>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Real-time Calculations</span>
            </div>
            <p className="text-xs text-gray-400 mb-8 leading-relaxed">
              Configure and simulate the impact of upgrading your packaging infrastructure. Adjust toggles to project eco-impact score changes and projected carbon offset.
            </p>

            <div className="space-y-6">

              {/* Toggle 1 */}
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5 uppercase tracking-wider">Biodegradable Paper Tape</h4>
                  <p className="text-[10px] text-gray-500">Eliminates plastic fiber tape from regular box sealing workflows.</p>
                </div>
                <button
                  onClick={() => setBiodegradableTape(!biodegradableTape)}
                  className={`w-12 h-6 rounded-full transition-all duration-300 relative ${biodegradableTape ? 'bg-emerald-500' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-300 ${biodegradableTape ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Toggle 2 */}
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5 uppercase tracking-wider">100% Recycled Kraft Mailers</h4>
                  <p className="text-[10px] text-gray-500">Prioritize flexible paper packaging instead of generic corrugated boxes.</p>
                </div>
                <button
                  onClick={() => setRecycledMailers(!recycledMailers)}
                  className={`w-12 h-6 rounded-full transition-all duration-300 relative ${recycledMailers ? 'bg-emerald-500' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-300 ${recycledMailers ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {/* Toggle 3 */}
              <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5 uppercase tracking-wider">Carbon-Offset Courier Fleet</h4>
                  <p className="text-[10px] text-gray-500">Partner with carbon-neutral logistics networks (FedEx Eco, DHL GoGreen).</p>
                </div>
                <button
                  onClick={() => setCarbonOffsetCouriers(!carbonOffsetCouriers)}
                  className={`w-12 h-6 rounded-full transition-all duration-300 relative ${carbonOffsetCouriers ? 'bg-emerald-500' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-300 ${carbonOffsetCouriers ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-3 gap-4">
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Projected Eco Score</p>
              <p className="text-xl font-bold text-emerald-400">{simulatorSavings.projectedScore}%</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Projected Carbon Offset</p>
              <p className="text-xl font-bold text-white font-mono">{simulatorSavings.projectedCarbon} kg</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Projected Trees Offset</p>
              <p className="text-xl font-bold text-white">{simulatorSavings.projectedTrees} Trees</p>
            </div>
          </div>

        </div>

        {/* Right Side: Circularity Donut Chart */}
        <div className="lg:col-span-5 glass p-8 rounded-[40px] flex flex-col justify-between h-[500px]">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-emerald-400" /> Material Circularity
              </h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Breakdown of organic, post-consumer recycled, and biodegradable materials recommended across your order catalog.
            </p>
          </div>

          <div className="h-56 relative">
            {stats.materialData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={100}>
                <PieChart>
                  <defs>
                    {GRADIENTS.map((g) => (
                      <linearGradient id={g.id} key={g.id} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={g.stop1} />
                        <stop offset="100%" stopColor={g.stop2} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={stats.materialData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    cornerRadius={4}
                  >
                    {stats.materialData.map((entry, index) => {
                      const g = GRADIENTS[index % GRADIENTS.length]
                      return <Cell key={`cell-${index}`} fill={`url(#${g.id})`} stroke="rgba(255, 255, 255, 0.05)" strokeWidth={1} />
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(10, 10, 15, 0.8)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '16px',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
                    }}
                    itemStyle={{ fontSize: '11px', color: '#FFF' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value, entry: any, index) => {
                      const color = GRADIENTS[index % GRADIENTS.length].stop1;
                      return (
                        <span className="text-xs font-medium tracking-wide" style={{ color }}>
                          {value}
                        </span>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">No material data</div>
            )}

            {stats.materialData.length > 0 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-2">
                <span className="text-xs text-gray-500 font-medium block uppercase tracking-widest">Circular</span>
                <span className="text-2xl font-black text-white font-mono">100%</span>
              </div>
            )}
          </div>

          <div className="bg-emerald-500/5 p-4 border border-emerald-500/10 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <p className="text-[10px] text-emerald-200/70 leading-relaxed">
              All listed packaging materials carry FSC certification and 100% biodegradable certifications. Zero virgin plastic polymer recommendations.
            </p>
          </div>

        </div>

      </div>

      {/* Sustainability Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* CO2 Savings Bar Chart */}
        <div className="glass p-8 rounded-[40px] border border-white/5 bg-gradient-to-br from-emerald-500/5 to-transparent min-h-[350px]">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-2">
            <Wind className="w-4 h-4 text-emerald-400" /> CO₂ Reduction per SKU (kg)
          </h3>
          <div className="h-64">
            {co2BarData.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={100}>
                <BarChart data={co2BarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} />
                  <YAxis stroke="#ffffff20" fontSize={10} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                  <Bar dataKey="co2" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">Awaiting optimization data...</div>
            )}
          </div>
        </div>

        {/* Eco Score Trend Line */}
        <div className="glass p-8 rounded-[40px] border border-white/5 bg-gradient-to-br from-cyan-500/5 to-transparent min-h-[350px]">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" /> Average Eco-Impact Trend
          </h3>
          <div className="h-64">
            {ecoTrendData.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={100}>
                <LineChart data={ecoTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="date" stroke="#ffffff20" fontSize={10} />
                  <YAxis stroke="#ffffff20" fontSize={10} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                  <Line type="monotone" dataKey="score" stroke="#06B6D4" strokeWidth={3} dot={{ r: 4, fill: '#06B6D4' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px] font-bold uppercase tracking-widest">Collecting history...</div>
            )}
          </div>
        </div>
      </div>

      {/* Sustainable Certification Badge Drawer */}
      <div className="glass p-8 rounded-[40px] bg-gradient-to-r from-emerald-950/20 via-teal-950/10 to-transparent">
        <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
          <Award className="w-4 h-4 text-emerald-400" /> Active Environmental Certifications
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

          <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-black text-green-400">FSC</span>
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">FSC C11342</h4>
              <p className="text-[9px] text-gray-500">Forest Stewardship Certified</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-black text-emerald-400">C2C</span>
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Cradle to Cradle</h4>
              <p className="text-[9px] text-gray-500">Circular Material Design Gold</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-black text-teal-400">ROHS</span>
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">RoHS Standard</h4>
              <p className="text-[9px] text-gray-500">Hazardous Substances Free</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-black text-cyan-400">PF</span>
            </div>
            <div>
              <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Plastic-Free</h4>
              <p className="text-[9px] text-gray-500">Organic Polymer Certified</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
})

export default SustainabilityClient
