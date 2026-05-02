'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Package, Zap, Percent, TrendingUp, TrendingDown, ArrowRight, Clock, CheckCircle2, AlertCircle, Box } from 'lucide-react'
import Link from 'next/link'
import { motion, animate } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { useDashboard } from '@/lib/context/DashboardContext'

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

// Mock Data
const shipmentData = [
  { date: '1', volume: 120 }, { date: '5', volume: 150 }, { date: '10', volume: 180 },
  { date: '15', volume: 140 }, { date: '20', volume: 220 }, { date: '25', volume: 280 }, { date: '30', volume: 310 }
]

const costData = [
  { name: 'Carrier Fees', value: 4500, color: '#4361EE' },
  { name: 'Materials', value: 2100, color: '#06b6d4' },
  { name: 'Labor', value: 1200, color: '#22c55e' },
  { name: 'Void Fill', value: 300, color: '#f59e0b' },
]

const activities = [
  { id: 'ORD-8439', action: 'Shipped via FedEx', time: '2 mins ago', status: 'Shipped', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
  { id: 'ORD-8438', action: 'Awaiting Dimensions', time: '15 mins ago', status: 'Pending', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'ORD-8437', action: 'Box out of stock', time: '1 hour ago', status: 'Cancelled', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  { id: 'ORD-8436', action: 'Shipped via UPS', time: '2 hours ago', status: 'Shipped', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
]

export default function DashboardClient() {
  const { stats, isRefreshing } = useDashboard()

  const kpis = [
    { label: 'Total Shipments', value: 8439, icon: Package, color: '#4361EE', trend: '+12%', isPositive: true },
    { label: 'Cost Saved', value: stats.totalSavings || 12450, icon: DollarSign, color: '#22c55e', trend: '+8.4%', isPositive: true, prefix: '$' },
    { label: 'Void Space Reduced', value: 24.5, icon: Zap, color: '#06b6d4', trend: '+2.1%', isPositive: true, suffix: '%', decimals: 1 },
    { label: 'Active Orders', value: 142, icon: Box, color: '#f59e0b', trend: '-1.5%', isPositive: false }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } }
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
              <h3 className="text-lg font-bold text-white">Shipment Volume</h3>
              <p className="text-sm text-gray-500">Last 30 days</p>
            </div>
            <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300">
              This Month
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
              <h3 className="text-lg font-bold text-white">Cost Breakdown</h3>
              <p className="text-sm text-gray-500">Distribution of expenses</p>
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
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="w-full grid grid-cols-2 gap-4 mt-2">
              {costData.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-400">{item.name}</span>
                  <span className="text-xs font-bold text-white ml-auto">${item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Activity Feed */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
        className="bg-[#0f0f1a] border border-white/[0.06] rounded-[24px] p-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-white">Recent Activity</h3>
          <Link href="/dashboard/orders" className="text-sm font-medium text-[#4361EE] hover:text-[#344FDA] transition-colors flex items-center gap-1">
            View All Orders <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {activities.length > 0 ? (
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
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-gray-600" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">No activity yet</h4>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">When you process orders or optimize packages, your recent activity will appear here.</p>
            <Link href="/dashboard/optimization" className="bg-[#4361EE] hover:bg-[#344FDA] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-[#4361EE]/20">
              Optimize First Order
            </Link>
          </div>
        )}
      </motion.div>
      
    </div>
  )
}
