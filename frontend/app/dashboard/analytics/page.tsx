'use client'

import { useOptimizationStore } from '@/lib/store/optimizationStore'
import { useOptimizationRuns } from '@/lib/hooks/useOptimizationRuns'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { Filter, Calendar, BarChart3, TrendingUp, Search } from 'lucide-react'
import { useState } from 'react'

const SKUComparisonChart = dynamic(() => import('@/components/charts/SKUComparisonChart'), { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> })
const SavingsDistributionChart = dynamic(() => import('@/components/charts/SavingsDistributionChart'), { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> })
const SpaceUtilizationScatter = dynamic(() => import('@/components/charts/SpaceUtilizationScatter'), { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> })
const SavingsLineChart = dynamic(() => import('@/components/charts/SavingsLineChart'), { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> })

export default function AnalyticsPage() {
  const { results } = useOptimizationStore()
  const { runs } = useOptimizationRuns()
  const [filterFragility, setFilterFragility] = useState('all')

  const filteredResults = results.filter(r =>
    filterFragility === 'all' ? true : r.fragility === filterFragility
  )

  return (
    <div className="p-8 pb-24 space-y-12 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-space-grotesk text-white">AI Analytics</h1>
          <p className="text-zinc-500 font-medium">Deep insights into your packaging efficiency and cost structures.</p>
        </div>

        <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
          <button
            onClick={() => setFilterFragility('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${filterFragility === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterFragility('low')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${filterFragility === 'low' ? 'bg-emerald-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            Low
          </button>
          <button
            onClick={() => setFilterFragility('medium')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${filterFragility === 'medium' ? 'bg-amber-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            Med
          </button>
          <button
            onClick={() => setFilterFragility('high')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${filterFragility === 'high' ? 'bg-red-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            High
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cost Comparison */}
        <div className="bg-white/[0.03] border border-white/10 p-10 rounded-[40px] space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold font-space-grotesk text-white tracking-tight">SKU Cost Comparison</h3>
              <p className="text-sm text-zinc-500">Original vs Optimized box pricing per SKU</p>
            </div>
            <BarChart3 className="w-6 h-6 text-blue-400" />
          </div>
          <div className="h-[400px]">
            <SKUComparisonChart data={filteredResults} />
          </div>
        </div>

        {/* Savings Distribution */}
        <div className="bg-white/[0.03] border border-white/10 p-10 rounded-[40px] space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold font-space-grotesk text-white tracking-tight">Savings Distribution</h3>
              <p className="text-sm text-zinc-500">Frequency of savings percentages across catalog</p>
            </div>
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="h-[400px]">
            <SavingsDistributionChart data={filteredResults} />
          </div>
        </div>

        {/* Space Utilization Scatter */}
        <div className="bg-white/[0.03] border border-white/10 p-10 rounded-[40px] space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold font-space-grotesk text-white tracking-tight">Space Utilization Scatter</h3>
              <p className="text-sm text-zinc-500">Efficiency vs Product Volume (colored by fragility)</p>
            </div>
            <Search className="w-6 h-6 text-cyan-400" />
          </div>
          <div className="h-[400px]">
            <SpaceUtilizationScatter data={filteredResults} />
          </div>
        </div>

        {/* Historical Score */}
        <div className="bg-white/[0.03] border border-white/10 p-10 rounded-[40px] space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold font-space-grotesk text-white tracking-tight">Historical Savings Trend</h3>
              <p className="text-sm text-zinc-500">Total savings generated across multiple runs</p>
            </div>
            <Calendar className="w-6 h-6 text-purple-400" />
          </div>
          <div className="h-[400px]">
            <SavingsLineChart data={runs || []} />
          </div>
        </div>
      </div>
    </div>
  )
}
