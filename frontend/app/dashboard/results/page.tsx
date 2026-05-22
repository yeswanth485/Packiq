'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Search, RefreshCw, CheckCircle2,
  AlertCircle, ArrowUpRight,
  Package, Info, TrendingDown, Box as BoxIcon
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Box3DViewer from '@/components/dashboard/Box3DViewer'

export default function ResultsHistoryPage() {
  const [optimizedProducts, setOptimizedProducts] = useState<any[]>([])
  const [notOptimizedProducts, setNotOptimizedProducts] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'optimized' | 'not-optimized'>('optimized')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const supabase = createClient()
  const searchParams = useSearchParams()

  async function fetchResults() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const sessionId = searchParams.get('session_id')
      const url = sessionId
        ? `/api/optimization-results?session_id=${sessionId}`
        : '/api/optimization-results'

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      const json = await res.json()

      setOptimizedProducts(json.optimized ?? [])
      setNotOptimizedProducts(json.notOptimized ?? [])
      setStats(json.stats ?? {})
    } catch (err) {
      console.error('Results fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [])

  const filteredOptimized = useMemo(() => {
    return optimizedProducts.filter(p =>
      p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [optimizedProducts, searchTerm])

  const filteredNotOptimized = useMemo(() => {
    return notOptimizedProducts.filter(p =>
      p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [notOptimizedProducts, searchTerm])

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20 text-white min-h-screen bg-[#0d0d1a]">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 tracking-tight">
          Optimization History
        </h1>
        <p className="mt-2 text-slate-400 text-sm font-medium">
          Deep dive into your AI packaging analysis
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="TOTAL PROCESSED" value={stats.totalProcessed ?? 0} color="text-white" />
        <StatCard title="OPTIMIZED" value={stats.totalOptimized ?? 0} color="text-emerald-400" />
        <StatCard title="NOT OPTIMIZED" value={stats.totalNotOptimized ?? 0} color="text-red-400" />
        <StatCard title="SUCCESS RATE" value={`${(stats.successRate ?? 0).toFixed(1)}%`} color="text-cyan-400" />
        <StatCard title="TOTAL SAVINGS" value={`₹${(stats.totalSavings ?? 0).toFixed(2)}`} color="text-violet-400" />
      </div>

      {/* Tabs & Filters */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('optimized')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'optimized' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ✅ Optimized Details ({optimizedProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('not-optimized')}
              className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'not-optimized' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚠️ Why Not Optimized ({notOptimizedProducts.length})
            </button>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              placeholder="Search SKU or name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Grid Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse bg-white/5 rounded-2xl h-48 w-full" />
            ))
          ) : activeTab === 'optimized' ? (
            filteredOptimized.length === 0 ? (
              <EmptyState icon="📦" title="No optimized products yet" subtitle="Start by uploading your inventory sheet" />
            ) : (
              filteredOptimized.map(p => (
                <OptimizedCard
                  key={p.id}
                  p={p}
                  isExpanded={expandedId === p.id}
                  onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
                />
              ))
            )
          ) : (
            filteredNotOptimized.length === 0 ? (
              <EmptyState icon="✅" title="All products were optimized!" subtitle="No errors found in this batch" />
            ) : (
              filteredNotOptimized.map(p => (
                <NotOptimizedCard
                  key={p.id}
                  p={p}
                  isExpanded={expandedId === p.id}
                  onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
                />
              ))
            )
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, color }: any) {
  return (
    <div className="p-4 bg-[#1a1a2e] border border-white/5 rounded-2xl">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{title}</p>
      <p className={`text-xl font-black ${color}`}>{value}</p>
    </div>
  )
}

function OptimizedCard({ p, isExpanded, onToggle }: any) {
  const [show3D, setShow3D] = useState(false)

  return (
    <motion.div layout className="bg-[#1a1a2e] border border-white/5 rounded-2xl p-5 space-y-4 hover:border-violet-500/30 transition-colors">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex gap-2">
            <span className="px-2 py-0.5 bg-white/5 rounded text-[9px] font-mono font-bold text-slate-400">{p.sku}</span>
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter ${
              p.fragility === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {p.fragility}
            </span>
          </div>
          <h3 className="font-bold text-sm line-clamp-1">{p.productName}</h3>
          <p className="text-[10px] text-slate-500">{p.dimensions.l}x{p.dimensions.w}x{p.dimensions.h} cm</p>
        </div>
        <div className="text-right">
          <p className="text-emerald-400 font-black text-sm">₹{p.savings.toFixed(2)}</p>
          <p className="text-[9px] text-emerald-500/70 font-bold">SAVED</p>
        </div>
      </div>

      <div className="flex items-center gap-3 py-3 border-y border-white/5">
        <div className="flex-1 text-center">
          <p className="text-[8px] text-slate-500 font-bold uppercase">Baseline</p>
          <p className="text-[10px] font-bold truncate">{p.baselineBox}</p>
        </div>
        <ArrowUpRight className="w-4 h-4 text-slate-600 rotate-45" />
        <div className="flex-1 text-center">
          <p className="text-[8px] text-violet-400 font-bold uppercase">Optimized</p>
          <p className="text-[10px] font-bold text-violet-300 truncate">{p.optimizedBox}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-[9px] font-bold mb-1">
            <span className="text-slate-500 uppercase">Volume Utilization</span>
            <span className="text-violet-400">{p.volumeUtil.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-600 to-cyan-400" style={{ width: `${p.volumeUtil}%` }} />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShow3D(!show3D)}
            className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-colors uppercase tracking-widest flex items-center justify-center gap-2 ${
              show3D ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            <BoxIcon className="w-3 h-3" />
            3D View
          </button>
          <button
            onClick={onToggle}
            className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-colors uppercase tracking-widest ${
              isExpanded ? 'bg-violet-500/20 text-violet-400' : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            {isExpanded ? 'Hide Info' : 'Why Chosen'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {show3D && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 250, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden rounded-xl border border-white/5"
          >
            <Box3DViewer
              l={p.optimizedDims?.l || 0}
              w={p.optimizedDims?.w || 0}
              h={p.optimizedDims?.h || 0}
              productL={p.dimensions.l}
              productW={p.dimensions.w}
              productH={p.dimensions.h}
              spaceUtilization={p.volumeUtil}
              fragility={p.fragility?.toLowerCase() as any}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-4 pt-4 border-t border-white/5"
          >
            <p className="text-xs text-slate-300 leading-relaxed italic">"{p.whyChosen}"</p>
            <div className="grid grid-cols-2 gap-3 p-3 bg-white/[0.02] rounded-xl text-[10px]">
              <div>
                <p className="text-slate-500 uppercase font-bold">Shipping Cost</p>
                <p className="font-mono text-white">₹{p.shippingCost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase font-bold">Baseline Cost</p>
                <p className="font-mono text-white">₹{p.baselineCost.toFixed(2)}</p>
              </div>
            </div>
            <p className="text-[9px] text-slate-600 font-mono text-center">{p.timestamp}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function NotOptimizedCard({ p, isExpanded, onToggle }: any) {
  return (
    <motion.div layout className="bg-[#1a1a2e] border border-red-500/10 rounded-2xl p-5 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex gap-2">
            <span className="px-2 py-0.5 bg-white/5 rounded text-[9px] font-mono font-bold text-slate-400">{p.sku}</span>
            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[9px] font-bold uppercase tracking-tighter">
              {p.reasonCode}
            </span>
          </div>
          <h3 className="font-bold text-sm line-clamp-1">{p.productName}</h3>
        </div>
        <AlertCircle className="w-5 h-5 text-red-500" />
      </div>

      <p className="text-xs text-slate-400 line-clamp-2">{p.reason}</p>

      <button
        onClick={onToggle}
        className="w-full py-2 bg-red-500/5 hover:bg-red-500/10 rounded-xl text-[10px] font-bold text-red-400 transition-colors uppercase tracking-widest"
      >
        {isExpanded ? 'Hide Details' : 'Why not optimized & recommendation'}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-4 pt-4 border-t border-white/5"
          >
            <p className="text-xs text-slate-300 leading-relaxed">{p.explanation}</p>
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex gap-3">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-200/70 leading-normal">
                <span className="font-bold text-amber-500 block mb-1">RECOMMENDATION</span>
                {p.recommendation}
              </p>
            </div>
            <p className="text-[9px] text-slate-600 font-mono text-center">{p.timestamp}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function EmptyState({ icon, title, subtitle }: any) {
  return (
    <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
      <span className="text-6xl">{icon}</span>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-slate-500 text-sm">{subtitle}</p>
    </div>
  )
}
