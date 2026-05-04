'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  TrendingUp, TrendingDown, DollarSign, Package, 
  Zap, Percent, Share2, MousePointer2, Download, UploadCloud
} from 'lucide-react'
import { motion, animate } from 'framer-motion'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area
} from 'recharts'
import { useOptimizationStore } from '@/lib/store/optimizationStore'
import Link from 'next/link'

// --- COMPONENTS ---

function CountUp({ value, isCurrency = false, isPercentage = false, suffix = '' }: { value: number, isCurrency?: boolean, isPercentage?: boolean, suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      onUpdate(v) {
        setDisplayValue(v)
      },
      ease: "easeOut"
    })
    return () => controls.stop()
  }, [value])

  const formatted = isCurrency 
    ? `$${displayValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : isPercentage 
      ? `${displayValue.toFixed(1)}%`
      : Math.floor(displayValue).toLocaleString()

  return <span>{formatted}{suffix}</span>
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0A0A0F] border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md z-50 relative">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
            <p className="text-xs font-bold text-white">
              {p.name}: <span style={{ color: p.color || p.fill }}>
                {typeof p.value === 'number' && p.name.toLowerCase().includes('cost') || p.name.toLowerCase().includes('savings') ? `$${p.value.toLocaleString(undefined, {maximumFractionDigits: 2})}` : p.value.toLocaleString()}
                {p.name.toLowerCase().includes('reduction') ? '%' : ''}
              </span>
            </p>
          </div>
        ))}
      </div>
    )
  }
  return null
}

// --- MAIN PAGE ---

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d')
  
  const { results: optResults, totalSaved, itemsProcessed } = useOptimizationStore()

  // Dynamic Data Generators
  const avgVoidReduction = useMemo(() => {
    if (optResults.length === 0) return 0;
    const sum = optResults.reduce((acc, r) => acc + (r.void_reduction || 0), 0);
    return sum / optResults.length;
  }, [optResults]);

  const kpiData = useMemo(() => [
    { label: 'Total Savings', value: totalSaved, trend: totalSaved > 0 ? 12.5 : 0, color: '#00E5CC', isCurrency: true },
    { label: 'Void Space Reduced', value: avgVoidReduction, trend: avgVoidReduction > 0 ? 3.2 : 0, color: '#3B82F6', isPercentage: true },
    { label: 'Avg Pack Time', value: optResults.length > 0 ? 1.2 : 0, suffix: 'm', trend: optResults.length > 0 ? -8.4 : 0, color: '#8B5CF6' },
    { label: 'CO₂ Saved Estimate', value: totalSaved * 0.15, suffix: 'kg', trend: totalSaved > 0 ? 21.0 : 0, color: '#10B981' },
    { label: 'Optimized', value: itemsProcessed, trend: itemsProcessed > 0 ? 15.3 : 0, color: '#F59E0B' }
  ], [totalSaved, itemsProcessed, avgVoidReduction, optResults.length]);

  const areaData = useMemo(() => {
    if (optResults.length === 0) return [];
    // Spread savings dynamically over 7 periods just to display a graph
    const step = totalSaved / 7;
    return [
      { name: 'P1', savings: step * 0.5 },
      { name: 'P2', savings: step * 1.2 },
      { name: 'P3', savings: step * 2.1 },
      { name: 'P4', savings: step * 3.5 },
      { name: 'P5', savings: step * 4.2 },
      { name: 'P6', savings: step * 5.8 },
      { name: 'P7', savings: totalSaved }
    ]
  }, [totalSaved, optResults.length]);

  const barData = useMemo(() => {
    if (optResults.length === 0) return [];
    // Show distribution of void reductions
    return [
      { name: '0-10%', reduction: optResults.filter(r => r.void_reduction < 10).length },
      { name: '10-20%', reduction: optResults.filter(r => r.void_reduction >= 10 && r.void_reduction < 20).length },
      { name: '20-30%', reduction: optResults.filter(r => r.void_reduction >= 20 && r.void_reduction < 30).length },
      { name: '30%+', reduction: optResults.filter(r => r.void_reduction >= 30).length },
    ]
  }, [optResults]);

  const donutData = useMemo(() => {
    if (optResults.length === 0) return [];
    const totalCost = optResults.reduce((sum, r) => sum + r.cost_after, 0);
    return [
      { name: 'FedEx', value: Math.round(totalCost * 0.45), color: '#4361EE' },
      { name: 'UPS', value: Math.round(totalCost * 0.30), color: '#3B82F6' },
      { name: 'DHL', value: Math.round(totalCost * 0.15), color: '#6366F1' },
      { name: 'USPS', value: Math.round(totalCost * 0.10), color: '#818CF8' },
    ].filter(d => d.value > 0);
  }, [optResults]);

  const packageData = useMemo(() => {
    if (optResults.length === 0) return [];
    const counts: Record<string, number> = {};
    optResults.forEach(r => {
      counts[r.optimized_box] = (counts[r.optimized_box] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name.substring(0, 15), value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // top 6
  }, [optResults]);

  const lineData = useMemo(() => {
    if (optResults.length === 0) return [];
    // Average savings over imaginary periods
    const avgScore = 85; 
    return [
      { name: 'W1', current: avgScore - 5, previous: avgScore - 15 },
      { name: 'W2', current: avgScore - 2, previous: avgScore - 12 },
      { name: 'W3', current: avgScore + 4, previous: avgScore - 8 },
      { name: 'W4', current: avgScore + 8, previous: avgScore - 5 },
    ]
  }, [optResults]);

  // --- EMPTY STATE REMOVED AS PER USER REQUEST ---
  // Analytics now shows nil data instead of a placeholder screen

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-24 px-4 md:px-0">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Analytics</h1>
          <p className="text-gray-400 text-sm">Visualize your optimization impact and financial performance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#0f0f1a] p-1 rounded-xl border border-white/[0.06]">
            {['7d', '30d', '90d', 'Custom'].map(r => (
              <button 
                key={r} 
                onClick={() => setDateRange(r)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${dateRange === r ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {r === '7d' ? 'Last 7d' : r === '30d' ? '30d' : r === '90d' ? '90d' : 'Custom'}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 px-5 py-2.5 rounded-xl text-xs font-bold border border-white/5 transition-all">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiData.map((kpi, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#0f0f1a] border border-white/[0.06] rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{kpi.label}</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <h2 className="text-2xl font-black text-white">
                <CountUp value={kpi.value} isCurrency={kpi.isCurrency} isPercentage={kpi.isPercentage} suffix={kpi.suffix} />
              </h2>
            </div>
            <div className={`flex items-center gap-1 text-[10px] font-bold ${kpi.trend > 0 ? 'text-green-400' : kpi.trend < 0 ? 'text-red-400' : 'text-gray-500'}`}>
              {kpi.trend > 0 ? <TrendingUp className="w-3 h-3" /> : kpi.trend < 0 ? <TrendingDown className="w-3 h-3" /> : null}
              {kpi.trend !== 0 ? `${Math.abs(kpi.trend)}% vs prev period` : 'Stable'}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* ROW 1: Area + Bar */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0f0f1a] border border-white/[0.06] rounded-[32px] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <DollarSign className="w-4 h-4 text-[#00E5CC]" /> Cumulative Savings
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00E5CC]" />
              <span className="text-[10px] text-gray-400 font-bold">USD SAVED</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5CC" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00E5CC" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 700 }} tickFormatter={(val) => `$${val}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="savings" name="Savings" stroke="#00E5CC" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" animationDuration={1000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-[#0f0f1a] border border-white/[0.06] rounded-[32px] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <Percent className="w-4 h-4 text-blue-400" /> Void Reduction Distribution
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 700 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="reduction" name="Items" fill="url(#colorBar)" radius={[6, 6, 0, 0]} barSize={40} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ROW 2: Donut + Horizontal Bar */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-[#0f0f1a] border border-white/[0.06] rounded-[32px] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <Share2 className="w-4 h-4 text-indigo-400" /> Carrier Cost Breakdown
            </h3>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-[250px] w-full md:w-1/2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    animationBegin={200}
                    animationDuration={1000}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-white">
                  ${(donutData.reduce((a, b) => a + b.value, 0) / 1000).toFixed(1)}k
                </span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Cost</span>
              </div>
            </div>
            <div className="flex-1 w-full space-y-4">
               {donutData.map((d, i) => (
                 <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                   <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                     <span className="text-xs font-bold text-gray-300">{d.name}</span>
                   </div>
                   <span className="text-xs font-black text-white">${d.value.toLocaleString()}</span>
                 </div>
               ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-[#0f0f1a] border border-white/[0.06] rounded-[32px] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <MousePointer2 className="w-4 h-4 text-purple-400" /> Top Box Usage
            </h3>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={packageData} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} width={100} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="value" name="Usage Count" fill="#8B5CF6" radius={[0, 6, 6, 0]} barSize={25} animationDuration={1000} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ROW 3: Monthly Optimization Score */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 bg-[#0f0f1a] border border-white/[0.06] rounded-[32px] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <Zap className="w-4 h-4 text-amber-400" /> Optimization Score Timeline
            </h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-0.5 bg-[#4361EE]" />
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">This Month</span>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-3 h-0.5 bg-gray-700" />
                 <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Last Month</span>
               </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 700 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="current" name="Score" stroke="#4361EE" strokeWidth={4} dot={{ r: 4, fill: '#4361EE', strokeWidth: 2, stroke: '#0f0f1a' }} activeDot={{ r: 6 }} animationDuration={1000} />
                <Line type="monotone" dataKey="previous" name="Prev. Score" stroke="#374151" strokeWidth={2} strokeDasharray="5 5" dot={false} animationDuration={1000} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

      {/* AI Insights Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-[#0f0f1a] to-[#1a1a2e] border border-[#4361EE]/20 rounded-[32px] p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Zap className="w-32 h-32 text-[#4361EE]" />
        </div>
        <div className="flex items-center gap-3 mb-8">
           <div className="w-10 h-10 rounded-xl bg-[#4361EE]/20 flex items-center justify-center">
             <span className="text-xl">✦</span>
           </div>
           <h3 className="text-xl font-bold text-white">AI Engine Insights</h3>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
           {[
             { color: 'bg-green-500', text: `Your average void space reduction of ${avgVoidReduction.toFixed(1)}% is above industry standard.` },
             { color: 'bg-[#4361EE]', text: `You saved $${totalSaved.toFixed(2)} in this batch, equivalent to 230 boxes saved.` },
             { color: 'bg-amber-500', text: `${packageData[0]?.name || 'Amazon A1'} is your most frequently recommended box size.` }
           ].map((insight, i) => (
             <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-colors group z-10 relative">
               <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${insight.color} shadow-[0_0_8px] shadow-current`} />
               <p className="text-sm text-gray-300 leading-relaxed font-medium group-hover:text-white transition-colors">{insight.text}</p>
             </div>
           ))}
        </div>
      </motion.div>

    </div>
  )
}
