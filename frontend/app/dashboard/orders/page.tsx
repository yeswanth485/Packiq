'use client'

import { useState } from 'react'
import { 
  Search, Package, Zap, Filter, Eye, Printer, Plus, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOptimizationStore } from '@/lib/store/optimizationStore'
import Box3DViewer from '@/components/dashboard/Box3DViewer'

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const { results: optResults } = useOptimizationStore()

  // Use optimization results as our source of truth for "Orders/Shipments"
  const orders = optResults.length > 0 ? optResults : []

  const filteredOrders = orders.filter(order => 
    order.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.product_id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Orders</h1>
          <p className="text-gray-500 text-sm font-medium">Manage order logistics and verify packing accuracy.</p>
        </div>
        <button className="bg-[#00FFD1] text-[#0A0A0F] px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,209,0.2)] flex items-center gap-2 hover:scale-105 transition-all">
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Pending', count: orders.length, color: '#F59E0B' },
          { label: 'Optimized', count: orders.filter(o => o.savings > 0).length, color: '#00FFD1' },
          { label: 'Revenue Impact', count: `$${orders.reduce((acc, o) => acc + o.savings, 0).toFixed(2)}`, color: '#22c55e' },
          { label: 'Anomalies', count: 0, color: '#FF4444' }
        ].map((s, i) => (
          <div key={i} className="glass p-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{s.label}</span>
            </div>
            <span className="text-lg font-bold text-white">{s.count}</span>
          </div>
        ))}
      </div>

      <div className="glass rounded-[40px] overflow-hidden">
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 group w-full">
            <Search className="w-4 h-4 text-gray-600 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#00FFD1] transition-colors" />
            <input 
              type="text" 
              placeholder="Search by SKU or Product Name..." 
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white text-sm focus:border-[#00FFD1] transition-all"
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex-1 md:flex-none bg-white/[0.03] border border-white/10 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all flex items-center justify-center gap-2">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0A0A0F] sticky top-0 z-10">
              <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="px-8 py-4">Product / SKU</th>
                <th className="px-8 py-4">Recommended Box</th>
                <th className="px-8 py-4">Product Price</th>
                <th className="px-8 py-4">Box Price</th>
                <th className="px-8 py-4">Savings</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                <tr key={order.product_id} onClick={() => setSelectedOrder(order)} className="hover:bg-white/[0.02] transition-colors cursor-pointer group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{order.product_name}</span>
                      <span className="text-[10px] font-mono text-gray-500">{order.product_id}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-gray-500 text-[8px] font-black uppercase line-through">{order.original_box}</span>
                      <span className="px-2 py-1 rounded-full bg-[#00FFD1]/10 text-[#00FFD1] text-[9px] font-black uppercase tracking-widest">
                        {order.optimized_box}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-gray-400 font-mono text-xs font-medium">${order.product_price.toFixed(2)}</td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-600 line-through font-mono">${order.original_box_cost.toFixed(2)}</span>
                      <span className="font-bold text-white font-mono text-xs">${order.optimized_box_cost.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-1 text-[#00FFD1] font-mono text-xs font-bold bg-[#00FFD1]/5 px-3 py-1 rounded-full w-fit">
                      <Zap className="w-3 h-3" /> +${order.savings.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 text-gray-600 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan={6} className="px-8 py-20 text-center text-gray-500">
                      <Package className="w-10 h-10 mx-auto mb-4 opacity-20" />
                      <p className="text-xs uppercase tracking-widest font-black">No shipments processed yet</p>
                      <p className="text-[10px] mt-1">Upload a bulk file in Optimization to see results.</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-[#0A0A0F] border-l border-white/10 z-[70] flex flex-col p-8">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-bold text-white">Shipment Manifest</h3>
                <button onClick={() => setSelectedOrder(null)} className="p-2 bg-white/5 rounded-full text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-8 flex-1 overflow-y-auto no-scrollbar">
                <div className="h-64 bg-black/40 rounded-[32px] border border-white/5 overflow-hidden">
                   {/* 360 Dynamic View of the Optimized Box */}
                   <Box3DViewer 
                    l={parseInt(selectedOrder.optimized_box_dims?.split('x')[0]) || 20} 
                    w={parseInt(selectedOrder.optimized_box_dims?.split('x')[1]) || 15} 
                    h={parseInt(selectedOrder.optimized_box_dims?.split('x')[2]) || 10} 
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="glass p-4">
                     <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Product Price</p>
                     <p className="text-sm font-bold text-white">${selectedOrder.product_price.toFixed(2)}</p>
                   </div>
                   <div className="glass p-4">
                     <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Box Price</p>
                     <p className="text-sm font-bold text-[#00FFD1]">${selectedOrder.optimized_box_cost.toFixed(2)}</p>
                   </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">AI Spatial Intelligence</h4>
                  <div className="p-6 bg-[#00FFD1]/5 border border-[#00FFD1]/20 rounded-3xl">
                    <p className="text-xs text-gray-300 leading-relaxed">
                      AI identified a <span className="text-[#00FFD1] font-bold">{selectedOrder.void_reduction}%</span> reduction in void fill by migrating to the <span className="text-white font-bold">{selectedOrder.optimized_box}</span> standard.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <button className="h-14 bg-white/5 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10">
                  <Printer className="w-4 h-4 mx-auto mb-1" /> Label
                </button>
                <button className="h-14 bg-[#00FFD1] text-[#0A0A0F] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
                  Confirm Dispatch
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}

