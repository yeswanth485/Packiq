'use client'

import { useState, useMemo } from 'react'
import { Package, Zap, TrendingUp, ArrowRight, CheckCircle2, AlertCircle, Box, Brain, Sparkles, Activity } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { useInspectionFeed } from '@/lib/hooks/useInspectionFeed'
import { StaggerContainer, StaggerItem, CountUpNumber } from '@/components/animations'

export default function DashboardClient() {
  const { inspections, loading: feedLoading } = useInspectionFeed()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastAnalysis, setLastAnalysis] = useState<any>(null)

  const stats = useMemo(() => {
    const total = inspections.length
    const defects = inspections.filter(i => i.status === 'rejected').length
    const rate = total > 0 ? (defects / total) * 100 : 0
    const avgConf = total > 0 ? inspections.reduce((acc, i) => acc + (i.confidence_score || 0), 0) / total : 0
    
    return { total, defects, rate, avgConf }
  }, [inspections])

  const chartData = useMemo(() => {
    return inspections.slice().reverse().map((i, idx) => ({
      name: idx,
      confidence: i.confidence_score * 100
    }))
  }, [inspections])

  const runAIAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          line_id: inspections[0]?.line_id || 'demo-line',
          data_sample: inspections.slice(0, 10)
        })
      })
      const data = await res.json()
      setLastAnalysis(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Units Inspected', value: stats.total, icon: Package, color: '#00FFD1' },
          { label: 'Defects Caught', value: stats.defects, icon: AlertCircle, color: '#FF4444' },
          { label: 'Yield Rate', value: 100 - stats.rate, suffix: '%', icon: TrendingUp, color: '#22c55e' },
          { label: 'Avg Confidence', value: stats.avgConf * 100, suffix: '%', icon: Brain, color: '#4361EE' }
        ].map((kpi, i) => (
          <div key={i} className="glass p-6 rounded-2xl border-l-4" style={{ borderLeftColor: kpi.color }}>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${kpi.color}15` }}>
                <kpi.icon className="w-5 h-5" style={{ color: kpi.color }} />
              </div>
            </div>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{kpi.label}</p>
            <h3 className="text-2xl font-bold text-white font-mono">
              <CountUpNumber value={kpi.value} suffix={kpi.suffix} decimals={kpi.value % 1 !== 0 ? 1 : 0} />
            </h3>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Main Feed & Chart */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass p-6 rounded-3xl h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00FFD1]" /> Live Confidence Stream
              </h3>
            </div>
            <div className="h-full w-full pb-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FFD1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00FFD1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis hide />
                  <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.2)" fontSize={10} />
                  <Area type="monotone" dataKey="confidence" stroke="#00FFD1" fillOpacity={1} fill="url(#colorConf)" strokeWidth={2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Real-time Inspection Log</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Live</span>
              </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto no-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-[#0A0A0F] z-10">
                  <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                    <th className="px-6 py-4">Unit ID</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Confidence</th>
                    <th className="px-6 py-4">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence initial={false}>
                    {inspections.map((item) => (
                      <motion.tr 
                        key={item.id} 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-gray-300">{item.unit_id}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            item.status === 'passed' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-[#00FFD1]">{(item.confidence_score * 100).toFixed(1)}%</td>
                        <td className="px-6 py-4 text-xs text-gray-500">{new Date(item.timestamp).toLocaleTimeString()}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
              {inspections.length === 0 && (
                <div className="p-20 text-center text-gray-600 italic">Waiting for incoming data stream...</div>
              )}
            </div>
          </div>
        </div>

        {/* AI Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-gradient-to-br from-[#185FA5]/20 to-[#00FFD1]/20 border border-[#00FFD1]/20 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Brain className="w-20 h-20 text-[#00FFD1]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00FFD1]" /> Claude AI Insights
            </h3>
            <p className="text-xs text-gray-400 mb-8 leading-relaxed">Run a deep analysis on the last 500 units to identify hidden patterns.</p>
            
            <button 
              onClick={runAIAnalysis}
              disabled={isAnalyzing || inspections.length === 0}
              className="w-full py-4 bg-[#00FFD1] text-[#0A0A0F] rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {isAnalyzing ? "Processing Data..." : "Generate Analysis"}
            </button>

            <AnimatePresence>
              {lastAnalysis && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-6">
                  <div className="p-4 bg-[#0A0A0F]/50 rounded-2xl border border-white/5">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Summary</div>
                    <p className="text-xs text-gray-300 leading-relaxed">{lastAnalysis.summary}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Recommendations</div>
                    {lastAnalysis.recommendations?.map((r: string, i: number) => (
                      <div key={i} className="flex gap-2 text-xs text-gray-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00FFD1] shrink-0 mt-1" />
                        {r}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="glass p-8 rounded-3xl">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6">System Health</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Model Latency</span>
                <span className="text-sm font-bold text-white">18ms</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-[85%] bg-[#00FFD1]" />
              </div>
              
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Edge Uptime</span>
                <span className="text-sm font-bold text-white">99.98%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-[99%] bg-[#00FFD1]" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
