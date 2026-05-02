'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  TrendingUp, TrendingDown, DollarSign, Package, 
  Zap, Percent, BarChart3, PieChart as PieIcon, LineChart as LineIcon,
  Calendar, Filter, Download
} from 'lucide-react'
import { motion } from 'framer-motion'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  Cell, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts'
import StatCard from '@/components/dashboard/StatCard'

const COLORS = ['#00E5CC', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444']

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>({
    totalSavings: 0,
    ordersCount: 0,
    efficiency: 0,
    avgSpace: 0
  })
  const [chartData, setChartData] = useState<any[]>([])
  const [boxData, setBoxData] = useState<any[]>([])
  const [distribution, setDistribution] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function loadAnalytics() {
      const { data: optimizations } = await supabase.from('optimizations').select('*').eq('status', 'completed') as { data: any[] | null }

      
      if (optimizations) {
        const totalSavings = (optimizations as any[]).reduce((acc: number, o: any) => acc + (o.cost_savings_usd || 0), 0)
        const avgEff = (optimizations as any[]).reduce((acc: number, o: any) => acc + (o.efficiency_score || 0), 0) / optimizations.length

        setStats({
          totalSavings,
          ordersCount: optimizations.length,
          efficiency: avgEff,
          avgSpace: 84.5 // Mocked for now
        })

        // Group by day for line chart
        const grouped = optimizations.reduce((acc: any, o) => {
          const date = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          acc[date] = (acc[date] || 0) + o.cost_savings_usd
          return acc
        }, {})
        
        setChartData(Object.entries(grouped).map(([date, savings]) => ({ date, savings })))

        // Mock Box Usage
        setBoxData([
          { name: 'Amazon A1', usage: 145 },
          { name: 'Amazon A2', usage: 98 },
          { name: 'Flipkart F1', usage: 76 },
          { name: 'Micro Box', usage: 54 },
          { name: 'Large Box', usage: 32 },
        ])

        // Mock Distribution
        setDistribution([
          { name: 'Standard', value: 45 },
          { name: 'Eco-Optimized', value: 55 },
        ])
      }
    }
    loadAnalytics()
  }, [supabase])

  return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Advanced Analytics</h1>
          <p className="text-gray-500 text-sm">Deep dive into your spatial efficiency and financial performance.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border border-white/5 transition-all">
            <Download className="w-4 h-4" /> Export Report
          </button>
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
             <button className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#00E5CC] text-[#0A0A0F]">Last 30 Days</button>
             <button className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all">All Time</button>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Savings" value={stats.totalSavings} icon={<DollarSign className="w-5 h-5" />} color="green" isCurrency />
        <StatCard label="Orders Processed" value={stats.ordersCount} icon={<Package className="w-5 h-5" />} color="indigo" isNumber />
        <StatCard label="Efficiency Rate" value={stats.efficiency} icon={<Percent className="w-5 h-5" />} color="cyan" isPercentage />
        <StatCard label="Space Utilized" value={stats.avgSpace} icon={<Zap className="w-5 h-5" />} color="amber" isPercentage />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Savings Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[40px] p-8 border-white/5 bg-white/[0.01]">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <LineIcon className="w-4 h-4 text-[#00E5CC]" /> Financial Trajectory
            </h3>
            <div className="text-green-400 text-xs font-bold bg-green-500/10 px-3 py-1 rounded-full">+12.5% vs Prev Period</div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5CC" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00E5CC" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 700 }} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', padding: '15px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 900, color: '#00E5CC' }}
                />
                <Area type="monotone" dataKey="savings" stroke="#00E5CC" strokeWidth={4} fillOpacity={1} fill="url(#colorSavings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Box Usage Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-[40px] p-8 border-white/5 bg-white/[0.01]">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" /> Inventory Velocity
            </h3>
            <div className="text-blue-400 text-xs font-bold bg-blue-500/10 px-3 py-1 rounded-full">Top Performers</div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={boxData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 700 }} width={80} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px' }}
                />
                <Bar dataKey="usage" fill="#3B82F6" radius={[0, 10, 10, 0]} barSize={24}>
                  {boxData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#00E5CC' : '#3B82F6'} opacity={1 - (index * 0.15)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Distribution Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-[40px] p-8 border-white/5 bg-white/[0.01]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-400" /> Optimization Impact
            </h3>
          </div>
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-3xl font-black text-white">55%</span>
               <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Optimized</span>
            </div>
          </div>
          <div className="flex justify-center gap-8 mt-4">
             {distribution.map((d, i) => (
               <div key={i} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-xs font-bold text-gray-400">{d.name}</span>
               </div>
             ))}
          </div>
        </motion.div>

        {/* Intelligence Insights */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-[40px] p-8 border-[#00E5CC]/20 bg-[#00E5CC]/5">
           <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-[#00E5CC]/20 flex items-center justify-center">
                 <Zap className="w-6 h-6 text-[#00E5CC]" />
              </div>
              <h3 className="text-lg font-black text-white">AI Insights</h3>
           </div>
           <div className="space-y-6">
              <div className="p-5 rounded-3xl bg-white/5 border border-white/5">
                 <p className="text-sm text-gray-300 leading-relaxed font-medium">
                    <span className="text-[#00E5CC] font-black">Recommendation:</span> High volume of small orders detected. Switching to <span className="text-white font-bold">Mailer M1</span> for 15% of your inventory could save an additional <span className="text-green-400 font-black">$420/month</span>.
                 </p>
              </div>
              <div className="p-5 rounded-3xl bg-white/5 border border-white/5">
                 <p className="text-sm text-gray-300 leading-relaxed font-medium">
                    <span className="text-blue-400 font-black">Spatial Alert:</span> Large Box usage is peak during Mondays. Consider bulk ordering <span className="text-white font-bold">Amazon B1</span> series to avoid stockouts.
                 </p>
              </div>
           </div>
        </motion.div>
      </div>
    </div>
  )
}
