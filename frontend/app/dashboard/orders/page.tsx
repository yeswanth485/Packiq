'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Package, Search, RefreshCw,
  ArrowUpRight, TrendingDown, Info
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import BoxViewer3D from '@/components/3d/BoxViewer3D'

interface OrderProduct {
  id: string
  sku: string
  productName: string
  baselineBox: string
  optimizedBox: string
  optimizedDims: { l: number; w: number; h: number }
  productDims: { l: number; w: number; h: number }
  totalCost: number
  savings: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  weight: number
  fragility: string
  timestamp: string
}

export default function OrdersPage() {
  const [products, setProducts] = useState<OrderProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const fresh = searchParams.get('fresh')

  function parseDimsFromString(boxStr?: string): {l:number,w:number,h:number} {
    if (!boxStr) return { l: 30, w: 22, h: 18 }
    const nums = boxStr.match(/\d+/g)?.map(Number) ?? []
    return { l: nums[0]??30, w: nums[1]??22, h: nums[2]??18 }
  }

  function mapSingleOrderToUI(order: any): OrderProduct {
    return {
      id: order.id,
      sku: order.product_snapshot?.sku
        ?? order.product?.sku
        ?? order.id.slice(0, 8).toUpperCase(),
      productName: order.product_snapshot?.product_name
        ?? order.product?.product_name
        ?? 'Unknown Product',
      baselineBox: order.baseline_box ?? 'N/A',
      optimizedBox: order.optimized_box ?? 'N/A',
      optimizedDims: order.optimized_dims
        ?? parseDimsFromString(order.optimized_box),
      productDims: order.product_dims ?? {
        l: order.product_snapshot?.length_cm ?? 0,
        w: order.product_snapshot?.width_cm ?? 0,
        h: order.product_snapshot?.height_cm ?? 0
      },
      totalCost: Number(order.total_cost ?? 0),
      savings: Number(order.savings ?? 0),
      riskLevel: (order.risk_level ?? 'LOW') as 'LOW'|'MEDIUM'|'HIGH',
      weight: Number(order.weight ?? order.product_snapshot?.weight_kg ?? 0),
      fragility: (order.fragility
        ?? order.product_snapshot?.fragility
        ?? 'LOW') as any,
      timestamp: new Date(order.created_at).toLocaleString('en-IN')
    }
  }

  function mapOrdersToUI(orders: any[]): OrderProduct[] {
    return orders.map(mapSingleOrderToUI)
  }

  async function fetchOrders() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }
      setUserId(session.user.id)

      const sessionId = searchParams.get('session_id')
      const url = sessionId ? `/api/orders?session_id=${sessionId}` : '/api/orders'

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      const json = await res.json()
      if (json.orders) setProducts(mapOrdersToUI(json.orders))
    } catch (err) {
      console.error('Orders fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [fresh])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        const newOrder = mapSingleOrderToUI(payload.new)
        setProducts(prev => [newOrder, ...prev])
        toast.success('New optimized order arrived ✓')
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesRisk = riskFilter === 'all' || p.riskLevel.toLowerCase() === riskFilter.toLowerCase()
      return matchesSearch && matchesRisk
    })
  }, [products, searchTerm, riskFilter])

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 pb-20 text-white min-h-screen bg-[#0d0d1a]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#00FFD1] to-blue-500 tracking-tight">
            Optimized Orders
          </h1>
          <p className="mt-2 text-slate-400 text-sm">
            Manage your AI-optimized packaging shipments.
          </p>
        </div>
        
        <button
          onClick={fetchOrders}
          className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            placeholder="Search SKU or product..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:border-[#00FFD1] outline-none"
          />
        </div>
        <select
          value={riskFilter}
          onChange={e => setRiskFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm outline-none cursor-pointer"
        >
          <option value="all">All Risk Levels</option>
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
        </select>
      </div>

      {/* Main Content */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <div className="animate-pulse bg-white/5 rounded-xl h-16 w-full" />
            <div className="animate-pulse bg-white/5 rounded-xl h-16 w-full" />
            <div className="animate-pulse bg-white/5 rounded-xl h-16 w-full" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <Package className="w-16 h-16 text-slate-700" />
            <h3 className="text-xl font-bold">No shipments yet</h3>
            <button 
              onClick={() => router.push('/dashboard/optimization')}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl font-bold transition-all"
            >
              Go to Optimization →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                  <th className="p-4 pl-6">Product</th>
                  <th className="p-4">Baseline Box</th>
                  <th className="p-4">Optimized Box</th>
                  <th className="p-4">Total Cost</th>
                  <th className="p-4">Savings</th>
                  <th className="p-4">Risk Level</th>
                  <th className="p-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr
                      onClick={() => setExpandedRow(expandedRow === item.id ? null : item.id)}
                      className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="p-4 pl-6">
                        <div className="font-bold text-sm">{item.productName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{item.sku}</div>
                      </td>
                      <td className="p-4 text-xs text-slate-400">{item.baselineBox}</td>
                      <td className="p-4">
                        <div className="text-xs font-bold text-[#00FFD1]">{item.optimizedBox}</div>
                        <div className="text-[10px] text-slate-500">
                          {item.optimizedDims.l}x{item.optimizedDims.w}x{item.optimizedDims.h} cm
                        </div>
                      </td>
                      <td className="p-4 font-mono text-sm">₹{item.totalCost.toFixed(2)}</td>
                      <td className="p-4 text-emerald-400 font-bold text-sm">₹{item.savings.toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-tighter uppercase ${
                          item.riskLevel === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                          item.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {item.riskLevel}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <button className="text-[#00FFD1] hover:underline text-xs font-bold">
                          {expandedRow === item.id ? 'Close' : 'View 3D'}
                        </button>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {expandedRow === item.id && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-black/20"
                        >
                          <td colSpan={7} className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              <div className="h-64 rounded-xl overflow-hidden border border-white/10">
                                <BoxViewer3D
                                  widthCm={item.optimizedDims.w}
                                  heightCm={item.optimizedDims.h}
                                  depthCm={item.optimizedDims.l}
                                />
                              </div>
                              <div className="space-y-4">
                                <h4 className="text-[#00FFD1] font-bold text-sm uppercase">Shipment Details</h4>
                                <div className="grid grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <p className="text-slate-500">Product Dims</p>
                                    <p>{item.productDims.l}x{item.productDims.w}x{item.productDims.h} cm</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500">Weight</p>
                                    <p>{item.weight} kg</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500">Fragility</p>
                                    <p>{item.fragility}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500">Created At</p>
                                    <p>{item.timestamp}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
