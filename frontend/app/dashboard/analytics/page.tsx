'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  TrendingUp, TrendingDown, DollarSign, Package, 
  Zap, Percent, BarChart3, PieChart as PieIcon, LineChart as LineIcon,
  Calendar, Filter, Download, ArrowUpRight, ArrowDownRight, Share2, MousePointer2
} from 'lucide-react'
import { motion, useSpring, useTransform, animate } from 'framer-motion'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, Legend
} from 'recharts'
import { useOptimizationStore } from '@/lib/store/optimizationStore'

// --- COMPONENTS ---

function CountUp({ value, isCurrency = false, isPercentage = false, suffix = '' }: { value: number, isCurrency?: boolean, isPercentage?: boolean, suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 2,
      onUpdate(value) {
        setDisplayValue(value)
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

function Sparkline({ data, color }: { data: any[], color: string }) {
  return (
    <div className="h-8 w-16 opacity-50">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.2} strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0A0A0F] border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
            <p className="text-xs font-bold text-white">
              {p.name}: <span style={{ color: p.color || p.fill }}>{p.value.toLocaleString()}</span>
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
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const { results: optResults, totalSaved: optTotalSaved, itemsProcessed: optItemsProcessed } = useOptimizationStore()

  // --- MOCK DATA GENERATION ---
  const kpiData = useMemo(() => [
    { label: 'Total Savings', value: 12450 + optTotalSaved, trend: 12.5, color: '#00E5CC', isCurrency: true, spark: [{value: 10}, {value: 20}, {value: 15}, {value: 30}, {value: 25}, {value: 40 + (optTotalSaved > 0 ? 10 : 0)}] },
    { label: 'Void Space Reduced', value: 24.8, trend: -3.2, color: '#3B82F6', isPercentage: true, spark: [{value: 5}, {value: 8}, {value: 7}, {value: 12}, {value: 10}, {value: 15}] },
    { label: 'Avg Pack Time', value: 1.8, suffix: 'm', trend: -8.4, color: '#8B5CF6', spark: [{value: 20}, {value: 18}, {value: 19}, {value: 15}, {value: 16}, {value: 14}] },
    { label: 'CO₂ Saved', value: 842 + (optTotalSaved * 0.1), suffix: 'kg', trend: 21.0, color: '#10B981', spark: [{value: 2}, {value: 5}, {value: 10}, {value: 15}, {value: 25}, {value: 40}] },
    { label: 'Optimized', value: 1842 + optItemsProcessed, trend: 15.3, color: '#F59E0B', spark: [{value: 100}, {value: 120}, {value: 150}, {value: 200}, {value: 250}, {value: 300 + optItemsProcessed}] }
  ], [optTotalSaved, optItemsProcessed])

  const areaData = useMemo(() => {
    const base = [
      { name: 'Mon', savings: 400, volume: 240 },
      { name: 'Tue', savings: 300, volume: 139 },
      { name: 'Wed', savings: 200, volume: 980 },
      { name: 'Thu', savings: 278, volume: 390 },
      { name: 'Fri', savings: 189, volume: 480 },
      { name: 'Sat', savings: 239, volume: 380 },
      { name: 'Sun', savings: 349, volume: 430 },
    ]
    if (optTotalSaved > 0) {
      base[base.length - 1].savings += optTotalSaved
      base[base.length - 1].volume += optItemsProcessed
    }
    return base
  }, [optTotalSaved, optItemsProcessed])

  const barData = [
    { name: 'Week 1', reduction: 12 },
    { name: 'Week 2', reduction: 19 },
    { name: 'Week 3', reduction: 15 },
    { name: 'Week 4', reduction: 24 },
  ]

  const donutData = [
    { name: 'FedEx', value: 450, color: '#4361EE' },
    { name: 'UPS', value: 300, color: '#3B82F6' },
    { name: 'DHL', value: 300, color: '#6366F1' },
    { name: 'USPS', value: 200, color: '#818CF8' },
  ]

  const packageData = [
    { name: 'Amazon A1', value: 840 },
    { name: 'Flipkart F2', value: 620 },
    { name: 'Custom Box', value: 450 },
    { name: 'Eco Mailer', value: 320 },
  ]

  const lineData = [
    { name: 'Jan', current: 65, previous: 45 },
    { name: 'Feb', current: 72, previous: 52 },
    { name: 'Mar', current: 68, previous: 48 },
    { name: 'Apr', current: 85, previous: 55 },
    { name: 'May', current: 78, previous: 62 },
    { name: 'Jun', current: 92, previous: 70 },
  ]

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

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
              <Sparkline data={kpi.spark} color={kpi.color} />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <h2 className="text-2xl font-black text-white">
                <CountUp value={kpi.value} isCurrency={kpi.isCurrency} isPercentage={kpi.isPercentage} suffix={kpi.suffix} />
              </h2>
            </div>
            <div className={`flex items-center gap-1 text-[10px] font-bold ${kpi.trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {kpi.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(kpi.trend)}% vs prev period
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
              <DollarSign className="w-4 h-4 text-[#00E5CC]" /> Cost Savings Over Time
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
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 700 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="savings" stroke="#00E5CC" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-[#0f0f1a] border border-white/[0.06] rounded-[32px] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <Percent className="w-4 h-4 text-blue-400" /> Void Space Reduction
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
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 700 }} unit="%" />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="reduction" fill="url(#colorBar)" radius={[6, 6, 0, 0]} barSize={40} animationDuration={1500} />
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
                    animationDuration={1500}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-white">$1.2k</span>
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
                   <span className="text-xs font-black text-white">${d.value}</span>
                 </div>
               ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-[#0f0f1a] border border-white/[0.06] rounded-[32px] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <MousePointer2 className="w-4 h-4 text-purple-400" /> Package Type Distribution
            </h3>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={packageData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} width={90} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="value" fill="#8B5CF6" radius={[0, 6, 6, 0]} barSize={25} animationDuration={1800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ROW 3: Monthly Optimization Score */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 bg-[#0f0f1a] border border-white/[0.06] rounded-[32px] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <Zap className="w-4 h-4 text-amber-400" /> Monthly Optimization Score
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
                <Line type="monotone" dataKey="current" stroke="#4361EE" strokeWidth={4} dot={{ r: 4, fill: '#4361EE', strokeWidth: 2, stroke: '#0f0f1a' }} activeDot={{ r: 6 }} animationDuration={2000} />
                <Line type="monotone" dataKey="previous" stroke="#374151" strokeWidth={2} strokeDasharray="5 5" dot={false} animationDuration={2500} />
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
             { color: 'bg-green-500', text: 'Your void space is 18% below industry average this month.' },
             { color: 'bg-[#4361EE]', text: 'Switching to DHL for small parcel shipments could save $240/mo.' },
             { color: 'bg-amber-500', text: 'Amazon A1 box volume is peaking; consider pre-ordering stock.' }
           ].map((insight, i) => (
             <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/5 transition-colors group">
               <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${insight.color} shadow-[0_0_8px] shadow-current`} />
               <p className="text-sm text-gray-300 leading-relaxed font-medium group-hover:text-white transition-colors">{insight.text}</p>
             </div>
           ))}
        </div>
        <div className="flex justify-center border-t border-white/5 pt-8">
          <button className="bg-[#4361EE] hover:bg-[#344FDA] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xl shadow-[#4361EE]/20 transition-all hover:scale-[1.02]">
            Generate Full Intelligence Report
          </button>
        </div>
      </motion.div>

    </div>
  )
}
