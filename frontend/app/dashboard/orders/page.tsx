'use client'

import { useOptimizationStore } from '@/lib/store/optimizationStore'
import OrdersTable from '@/components/orders/OrdersTable'
import Link from 'next/link'
import { Plus, Package } from 'lucide-react'

export default function OrdersPage() {
  const { results } = useOptimizationStore()

  return (
    <div className="p-8 pb-24 space-y-12 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold font-space-grotesk text-white">Optimization Inventory</h1>
          <p className="text-zinc-500 font-medium">Review and inspect every optimized SKU in your latest catalog run.</p>
        </div>

        <Link
          href="/dashboard/optimize"
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] flex items-center gap-3"
        >
          <Plus className="w-5 h-5" />
          Optimize New Batch
        </Link>
      </div>

      {!results || results.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-8 bg-white/[0.02] border border-white/5 rounded-[40px] border-dashed">
          <div className="w-24 h-24 bg-blue-500/10 rounded-[32px] flex items-center justify-center">
            <Package className="w-12 h-12 text-blue-400 opacity-50" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-3xl font-bold font-space-grotesk text-white">No optimization results</h3>
            <p className="text-zinc-500 max-w-md mx-auto">
              Your optimized orders will appear here once you run the optimization engine.
            </p>
          </div>
        </div>
      ) : (
        <OrdersTable />
      )}
    </div>
  )
}
