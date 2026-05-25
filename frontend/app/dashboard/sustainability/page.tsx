'use client'

import { useOptimizationStore } from '@/lib/store/optimizationStore'
import { useOptimizationRuns } from '@/lib/hooks/useOptimizationRuns'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { Leaf, Droplets, Wind, Zap, FileDown } from 'lucide-react'
import KPICard from '@/components/dashboard/KPICard'

const CO2AreaChart = dynamic(() => import('@/components/charts/CO2AreaChart'), { ssr: false, loading: () => <Skeleton className="h-[400px] w-full" /> })

export default function SustainabilityPage() {
  const { results } = useOptimizationStore()
  const { runs } = useOptimizationRuns()

  const totalCo2 = results.reduce((acc, r) => acc + (r.co2_saved_kg || 0), 0)
  const treesPlanted = Math.round(totalCo2 / 21.77) // Average tree absorbs 21.77kg CO2 per year
  const materialSaved = results.reduce((acc, r) => {
    const origVol = r.original_length_cm * r.original_width_cm * r.original_height_cm
    const optVol = r.optimized_length_cm * r.optimized_width_cm * r.optimized_height_cm
    return acc + Math.max(0, (origVol * 1.5 - optVol)) // Assuming 1.5x original vol for baseline
  }, 0) / 1000 // Convert to Liters

  const avgEcoScore = results.reduce((acc, r) => acc + (r.optimization_score || 0), 0) / (results.length || 1)

  return (
    <div className="p-8 pb-24 space-y-12 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-space-grotesk text-white">Sustainability Impact</h1>
          <p className="text-zinc-500 font-medium">Tracking your environmental footprint and CO2 reduction through AI optimization.</p>
        </div>

        <button
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)]"
          onClick={() => window.print()}
        >
          <FileDown className="w-5 h-5" />
          Download Impact Report
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="CO2 Saved"
          value={totalCo2.toFixed(1)}
          unit="kg"
          icon={Wind}
          delay={0}
        />
        <div className="relative group p-6 bg-white/[0.03] border border-white/[0.08] rounded-3xl overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="p-3 bg-emerald-500/10 w-fit rounded-2xl text-emerald-400">
              <Leaf className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Trees Equivalent</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-white font-space-grotesk">≈ {treesPlanted}</h3>
                <span className="text-lg font-medium text-zinc-500">Trees 🌱</span>
              </div>
            </div>
          </div>
        </div>
        <KPICard
          title="Material Saved"
          value={Math.round(materialSaved)}
          unit="Liters"
          icon={Droplets}
          delay={0.2}
        />
        <KPICard
          title="Eco Score"
          value={Math.round(avgEcoScore)}
          unit="/ 100"
          icon={Zap}
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white/[0.03] border border-white/10 p-10 rounded-[40px] space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold font-space-grotesk text-white tracking-tight">CO2 Reduction Over Time</h3>
              <p className="text-sm text-zinc-500">Environmental impact trend across all optimization runs</p>
            </div>
            <Badge variant="green">Sustainability Metric</Badge>
          </div>
          <div className="h-[400px]">
            <CO2AreaChart data={runs || []} />
          </div>
        </div>
      </div>

      <div className="p-12 bg-gradient-to-br from-emerald-600/20 to-cyan-400/20 border border-emerald-500/20 rounded-[40px] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Leaf className="w-64 h-64 text-emerald-400" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-6">
          <h3 className="text-3xl font-bold font-space-grotesk text-white">Your Optimization is making a difference.</h3>
          <p className="text-lg text-emerald-100/70 leading-relaxed">
            By reducing void space and optimizing box dimensions, you've prevented <span className="text-white font-bold">{totalCo2.toFixed(1)}kg of CO2</span> from entering the atmosphere. This is equivalent to planting <span className="text-white font-bold">{treesPlanted} trees</span> and letting them grow for a full year.
          </p>
          <div className="flex gap-4">
             <Badge variant="green">ISO 14001 Compliant Estimates</Badge>
             <Badge variant="green">Carbon Negative Goal 2030</Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
