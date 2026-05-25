'use client'

import { useOptimizationStore } from '@/lib/store/optimizationStore'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/Skeleton'
import { useState } from 'react'
import { Package, Search, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

const Box3DViewer = dynamic(() => import('@/components/orders/Box3DViewer'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full rounded-[40px]" />
})

export default function ThreeDPage() {
  const { results } = useOptimizationStore()
  const [selectedId, setSelectedId] = useState<string | null>(results?.[0]?.id || null)
  const [search, setSearch] = useState('')

  const filtered = results.filter(r =>
    r.product_name?.toLowerCase().includes(search.toLowerCase())
  )

  const selected = results.find(r => r.id === selectedId) || results[0]

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col lg:flex-row gap-8">
      {/* Sidebar List */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold font-space-grotesk text-white">3D Intelligence</h1>
          <p className="text-zinc-500 text-sm">Visualize spatial optimization in real-time.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search SKUs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <Package className="w-10 h-10 text-zinc-700 mx-auto" />
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">No SKUs Found</p>
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                  selectedId === item.id
                    ? 'bg-blue-600/10 border-blue-500/50 text-white'
                    : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/5'
                }`}
              >
                <div className="space-y-1 overflow-hidden">
                  <p className="font-bold truncate text-sm">{item.product_name}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50 truncate">
                    {item.optimized_box_name}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform ${selectedId === item.id ? 'translate-x-1 text-blue-400' : 'opacity-0 group-hover:opacity-100'}`} />
              </button>
            ))
          )}
        </div>
      </div>

      {/* 3D Canvas View */}
      <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-[40px] relative overflow-hidden flex flex-col">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center">
              <Package className="w-12 h-12 text-zinc-700" />
            </div>
            <p className="text-zinc-500 font-bold uppercase tracking-[0.2em]">Select a SKU to visualize</p>
          </div>
        ) : (
          <>
            <div className="absolute top-8 left-8 z-10 space-y-4">
               <div className="space-y-1">
                  <Badge variant="blue" className="uppercase tracking-widest text-[9px] mb-2">Active Visualization</Badge>
                  <h2 className="text-3xl font-bold font-space-grotesk text-white">{selected.product_name}</h2>
                  <p className="text-zinc-500 font-medium">{selected.optimized_box_name} • {selected.optimized_length_cm}x{selected.optimized_width_cm}x{selected.optimized_height_cm} cm</p>
               </div>

               <div className="flex gap-3">
                  <div className="px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Efficiency</p>
                    <p className="text-white font-bold">{Math.round(selected.space_utilization_percent)}%</p>
                  </div>
                  <div className="px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl">
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Savings</p>
                    <p className="text-emerald-400 font-bold">₹{selected.savings_inr.toFixed(0)}</p>
                  </div>
               </div>
            </div>

            <div className="flex-1 w-full h-full">
              <Box3DViewer
                productName={selected.product_name}
                originalDims={{ l: selected.original_length_cm, w: selected.original_width_cm, h: selected.original_height_cm }}
                optimizedDims={{ l: selected.optimized_length_cm, w: selected.optimized_width_cm, h: selected.optimized_height_cm }}
              />
            </div>

            <div className="absolute bottom-8 right-8 z-10 flex gap-4">
                <div className="bg-[#0A0F1E]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl space-y-4 min-w-[240px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Dimensions</span>
                    <Badge variant="outline" className="text-[9px]">Metric</Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Length</span>
                      <span className="text-white font-bold">{selected.optimized_length_cm} cm</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Width</span>
                      <span className="text-white font-bold">{selected.optimized_width_cm} cm</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400">Height</span>
                      <span className="text-white font-bold">{selected.optimized_height_cm} cm</span>
                    </div>
                  </div>
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
