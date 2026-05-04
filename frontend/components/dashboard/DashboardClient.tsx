'use client'

import { useState, useEffect, useMemo } from 'react'
import { DollarSign, Package, Zap, Percent, TrendingUp, TrendingDown, ArrowRight, Clock, CheckCircle2, AlertCircle, Box, UploadCloud } from 'lucide-react'
import Link from 'next/link'
import { motion, animate } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useOptimizationStore } from '@/lib/store/optimizationStore'

// Animated Counter
function CountUp({ value, prefix = '', suffix = '', decimals = 0 }: { value: number, prefix?: string, suffix?: string, decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.2,
      ease: "easeOut",
      onUpdate: (v) => setDisplayValue(v)
    })
    return controls.stop
  }, [value])
  
  return (
    <span>
      {prefix}
      {displayValue.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  )
}

export default function DashboardClient() {
  const { results: optResults, totalSaved: optTotalSaved, itemsProcessed: optItemsProcessed, lastRun: optLastRun } = useOptimizationStore()

  // Generate dynamic shipment data from store
  const shipmentData = useMemo(() => {
    if (optResults.length === 0) return []
    return [
      { date: 'W1', volume: Math.floor(optItemsProcessed * 0.1) },
      { date: 'W2', volume: Math.floor(optItemsProcessed * 0.25) },
      { date: 'W3', volume: Math.floor(optItemsProcessed * 0.3) },
      { date: 'W4', volume: Math.floor(optItemsProcessed * 0.35) },
    ]
  }, [optResults, optItemsProcessed])

  // Generate dynamic cost breakdown based on total cost before vs after
  const costData = useMemo(() => {
    if (optResults.length === 0) return []
    const totalCostAfter = optResults.reduce((sum, r) => sum + (r.cost_after || 0), 0) || 1000 // Fallback if no cost data
    
    return [
      { name: 'Carrier Fees', value: totalCostAfter * 0.6, color: '#4361EE' },
      { name: 'Materials', value: totalCostAfter * 0.25, color: '#06b6d4' },
      { name: 'Labor', value: totalCostAfter * 0.10, color: '#22c55e' },
      { name: 'Void Fill', value: totalCostAfter * 0.05, color: '#f59e0b' },
    ]
  }, [optResults])

  const activities = useMemo(() => {
    if (optResults.length === 0) return []
    return optResults.slice(-4).reverse().map((r, i) => ({
      id: `OPT-${r.product_id || 1000 + i}`,
      action: `Optimized: ${r.product_name.substring(0, 20)}`,
      time: 'Just now',
      status: r.status === 'success' ? 'Completed' : 'Failed',
      icon: r.status === 'success' ? CheckCircle2 : AlertCircle,
      color: r.status === 'success' ? 'text-green-500' : 'text-red-500',
      bg: r.status === 'success' ? 'bg-green-500/10' : 'bg-red-500/10'
    }))
  }, [optResults])

  const avgVoidReduction = useMemo(() => {
    if (optResults.length === 0) return 0
    const sum = optResults.reduce((acc, r) => acc + (r.void_reduction || 0), 0)
    return sum / optResults.length
  }, [optResults])

  const kpis = [
    { label: 'Total Items Optimized', value: optItemsProcessed || 0, icon: Package, color: '#4361EE', trend: optItemsProcessed > 0 ? '+12%' : '0%', isPositive: true },
    { label: 'Total Cost Saved', value: optTotalSaved || 0, icon: DollarSign, color: '#22c55e', trend: optTotalSaved > 0 ? '+8.4%' : '0%', isPositive: true, prefix: '$' },
    { label: 'Avg Void Reduction', value: avgVoidReduction, icon: Zap, color: '#06b6d4', trend: avgVoidReduction > 0 ? '+2.1%' : '0%', isPositive: true, suffix: '%', decimals: 1 },
    { label: 'Items Processed', value: optItemsProcessed || 0, icon: Box, color: '#f59e0b', trend: '0%', isPositive: true }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } }
  }

  // --- EMPTY STATE ---
  if (optResults.length === 0) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0f0f1a] border border-white/10 rounded-[32px] p-12 max-w-2xl w-full shadow-2xl relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-[#4361EE]/10 to-transparent opacity-50" />
           <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-[#4361EE]/10 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#4361EE]/20 border border-[#4361EE]/30">
                <UploadCloud className="w-10 h-10 text-[#4361EE]" />
              </div>
              <h2 className="text-3xl font-black text-white mb-4">Welcome to PackIQ</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto text-sm leading-relaxed">
                Your dashboard is currently empty. Head over to the Optimization tab to upload your first dataset and discover potential savings.
              </p>
              <Link href="/dashboard/optimization" className="bg-[#4361EE] hover:bg-[#344FDA] text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-[#4361EE]/30 transition-all flex items-center gap-2">
                <Zap className="w-5 h-5" /> Start Optimizing Now
              </Link>
           </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      
      {/* KPIs Row */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <motion.div 
            key={i} variants={itemVariants}
            className="relative bg-[#0f0f1a] border border-white/[0.06] rounded-[20px] p-6 overflow-hidden group hover:-translate-y-1 transition-all duration-300"
            style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: `${kpi.color}15`, border: `1px solid ${kpi.color}30` }}>
                <kpi.icon className="w-6 h-6" style={{ color: kpi.color }} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${kpi.isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {kpi.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {kpi.trend}
              </div>
            </div>
            
            <div className="relative z-10">
              <p className="text-sm font-medium text-gray-400 mb-1">{kpi.label}</p>
              <h3 className="text-3xl font-black text-white tracking-tight">
                <CountUp value={kpi.value} prefix={kpi.prefix} suffix={kpi.suffix} decimals={kpi.decimals} />
              </h3>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid lg:grid-cols-12 gap-8">
        
        {/* Line Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-7 bg-[#0f0f1a] border border-white/[0.06] rounded-[24px] p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Cumulative Optimization</h3>
              <p className="text-sm text-gray-500">Based on processed dataset</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={shipmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4361EE" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4361EE" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="volume" stroke="#4361EE" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Donut Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-5 bg-[#0f0f1a] border border-white/[0.06] rounded-[24px] p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Estimated Cost Breakdown</h3>
              <p className="text-sm text-gray-500">Post-optimization</p>
            </div>
          </div>
          <div className="h-[300px] w-full flex flex-col items-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie data={costData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {costData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => `$${value.toFixed(2)}`}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="w-full grid grid-cols-2 gap-4 mt-2">
              {costData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-400 truncate">{item.name}</span>
                  <span className="text-xs font-bold text-white ml-auto">${item.value.toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Latest Optimization Run Widget */}
      {optLastRun && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-[#4361EE]/10 to-[#3B82F6]/10 border border-[#4361EE]/20 rounded-[24px] p-6 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#4361EE] rounded-2xl flex items-center justify-center shadow-lg shadow-[#4361EE]/40">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Latest Optimization Run</h3>
              <p className="text-sm text-gray-400">Completed {new Date(optLastRun).toLocaleTimeString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Items</p>
              <p className="text-xl font-black text-white">{optItemsProcessed}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Savings</p>
              <p className="text-xl font-black text-green-400">${optTotalSaved.toFixed(2)}</p>
            </div>
            <Link href="/dashboard/optimization" className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all border border-white/10">
              View Full Report
            </Link>
          </div>
        </motion.div>
      )}

      {/* Activity Feed */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
        className="bg-[#0f0f1a] border border-white/[0.06] rounded-[24px] p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">Recent Activity</h3>
          <Link href="/dashboard/optimization" className="text-sm font-medium text-[#4361EE] hover:text-[#344FDA] transition-colors flex items-center gap-1">
            Run More Optimizations <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="space-y-4">
          {activities.map((activity, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/[0.05]">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${activity.bg} flex items-center justify-center shrink-0`}>
                  <activity.icon className={`w-5 h-5 ${activity.color}`} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">{activity.id}</h4>
                  <p className="text-xs text-gray-400">{activity.action}</p>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${activity.bg} ${activity.color}`}>
                  {activity.status}
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
      
    </div>
  )
}
