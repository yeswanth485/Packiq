'use client'

import { useState, useMemo } from 'react'
import { 
  TrendingUp, TrendingDown, DollarSign, Package, 
  Zap, Percent, Share2, Activity, Download, Brain
} from 'lucide-react'
import { motion } from 'framer-motion'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area
} from 'recharts'
import { useOptimizationStore } from '@/lib/store/optimizationStore'
import { StaggerContainer, StaggerItem, CountUpNumber } from '@/components/animations'

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d')
  const { results: optResults, totalSaved, itemsProcessed } = useOptimizationStore()

  const chartData = useMemo(() => {
    if (!optResults || optResults.length === 0) {
      return [
        { name: 'Mon', value: 0 },
        { name: 'Tue', value: 0 },
        { name: 'Wed', value: 0 },
        { name: 'Thu', value: 0 },
        { name: 'Fri', value: 0 },
        { name: 'Sat', value: 0 },
        { name: 'Sun', value: 0 },
      ]
    }
    // Show the last 15 items' savings trend
    return optResults.slice(-15).map((r, i) => ({
      name: r.product_name.substring(0, 6) + '...',
      value: Number(r.savings.toFixed(2))
    }))
  }, [optResults])

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Production Analytics</h1>
          <p className="text-gray-500 text-sm font-medium">Real-time performance metrics and efficiency reporting.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex bg-white/[0.03] p-1 rounded-xl border border-white/5">
            {['7d', '30d', '90d'].map(r => (
              <button key={r} onClick={() => setDateRange(r)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${dateRange === r ? 'bg-[#00FFD1] text-[#0A0A0F]' : 'text-gray-500 hover:text-white'}`}>
                {r}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 bg-white/[0.03] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 hover:bg-white/10 transition-all">
            <Download className="w-4 h-4 text-[#00FFD1]" /> Export
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-8">
          <div className="glass p-8 rounded-[40px] h-[450px]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00FFD1]" /> Yield Efficiency
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#00FFD1]" />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Optimized</span>
              </div>
            </div>
            <div className="h-full w-full pb-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FFD1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00FFD1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4B5563', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#4B5563', fontSize: 10}} />
                  <Tooltip contentStyle={{backgroundColor: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px'}} />
                  <Area type="monotone" dataKey="value" stroke="#00FFD1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 grid grid-cols-1 gap-6">
          <div className="glass p-8 rounded-[40px]">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#00FFD1]/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#00FFD1]" />
              </div>
              <span className="text-green-400 text-xs font-bold">+12.4%</span>
            </div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Impact</p>
            <h3 className="text-3xl font-black text-white font-mono">$<CountUpNumber value={totalSaved} decimals={2} /></h3>
          </div>
          
          <div className="glass p-8 rounded-[40px]">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#4361EE]/10 flex items-center justify-center">
                <Brain className="w-6 h-6 text-[#4361EE]" />
              </div>
              <span className="text-blue-400 text-xs font-bold">98.2% Accuracy</span>
            </div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">AI Utilization</p>
            <h3 className="text-3xl font-black text-white font-mono"><CountUpNumber value={85} />%</h3>
          </div>
        </div>

      </div>

      <div className="grid md:grid-cols-3 gap-6">
         {[
           { label: 'Defect Density', value: '0.4%', icon: Activity, color: '#FF4444' },
           { label: 'Avg Cycle Time', value: '1.2s', icon: Zap, color: '#F59E0B' },
           { label: 'Throughput', value: '4.2k/hr', icon: Package, color: '#00FFD1' }
         ].map((kpi, i) => (
           <div key={i} className="glass p-6 rounded-3xl flex items-center gap-6">
             <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${kpi.color}15` }}>
               <kpi.icon className="w-6 h-6" style={{ color: kpi.color }} />
             </div>
             <div>
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">{kpi.label}</p>
               <p className="text-xl font-bold text-white">{kpi.value}</p>
             </div>
           </div>
         ))}
      </div>

    </div>
  )
}
