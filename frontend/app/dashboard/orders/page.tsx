'use client'

import { useState } from 'react'
import { 
  Search, Package, Zap, Filter, Eye, Printer, Plus, X, ShieldCheck, AlertTriangle, TrendingDown, CheckCircle2, Box
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOptimizationStore, OptimizationResult } from '@/lib/store/optimizationStore'
import Box3DViewer from '@/components/dashboard/Box3DViewer'

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OptimizationResult | null>(null)
  const { results: orders, totalSaved } = useOptimizationStore()

  const filteredOrders = orders.filter(order => 
    order.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.product_id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const highRiskCount = orders.filter(o => o.damage_risk === 'High').length

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Shipment Manifests</h1>
          <p className="text-gray-500 text-sm font-medium">Manage order logistics, view 3D packing guides, and print labels.</p>
        </div>
        <button className="bg-[#00FFD1] text-[#0A0A0F] px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,209,0.2)] flex items-center gap-2 hover:scale-105 transition-all">
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Processed', count: orders.length, color: '#00FFD1' },
          { label: 'Optimized', count: orders.filter(o => o.savings > 0).length, color: '#22c55e' },
          { label: 'Total Saved', count: `$${totalSaved.toFixed(2)}`, color: '#F59E0B' },
          { label: 'High Risk', count: highRiskCount, color: '#FF4444' }
        ].map((s, i) => (
          <div key={i} className="glass p-4 flex justify-between items-center rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{s.label}</span>
            </div>
            <span className="text-lg font-bold text-white">{s.count}</span>
          </div>
        ))}
      </div>

      {/* Main Table Container */}
      <div className="glass rounded-[40px] overflow-hidden">
        {/* Toolbar */}
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

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#0A0A0F] sticky top-0 z-10">
              <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="px-8 py-4">Baseline Box</th>
                <th className="px-8 py-4">Optimized Box</th>
                <th className="px-8 py-4">Total Cost</th>
                <th className="px-8 py-4">Savings</th>
                <th className="px-8 py-4">Risk Level</th>
                <th className="px-8 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.length > 0 ? filteredOrders.map((order, idx) => (
                <tr key={`${order.product_id}-${idx}`} onClick={() => setSelectedOrder(order)} className="hover:bg-white/[0.02] transition-colors cursor-pointer group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-xs">{order.product_name}</span>
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-tighter">{order.original_box || 'Not specified'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="px-2 py-1 rounded-full bg-[#00FFD1]/10 text-[#00FFD1] text-[9px] font-black uppercase tracking-widest border border-[#00FFD1]/20">
                        {order.optimized_box || 'No Change'}
                      </span>
                      <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono uppercase">
                         {order.optimized_box_dims}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      {order.baseline_cost > 0 && <span className="text-[10px] text-gray-600 line-through font-mono">${order.baseline_cost.toFixed(2)}</span>}
                      <span className="font-bold text-white font-mono text-sm">${order.total_cost.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {order.savings > 0 ? (
                      <div className="flex items-center gap-1 text-[#00FFD1] font-mono text-xs font-bold bg-[#00FFD1]/5 border border-[#00FFD1]/10 px-2 py-1 rounded-md w-fit">
                        <TrendingDown className="w-3 h-3" /> {order.savings_percent.toFixed(1)}%
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-500 font-mono">—</span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <div className={`flex items-center gap-1.5 text-xs font-bold ${
                      order.damage_risk === 'Low' ? 'text-green-400' : order.damage_risk === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {order.damage_risk === 'Low' ? <ShieldCheck className="w-4 h-4"/> : <AlertTriangle className="w-4 h-4"/>}
                      {order.damage_risk}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan={6} className="px-8 py-20 text-center text-gray-500">
                      <Package className="w-10 h-10 mx-auto mb-4 opacity-20" />
                      <p className="text-xs uppercase tracking-widest font-black">No shipments available</p>
                      <p className="text-[10px] mt-1">Run an optimization to populate manifests.</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shipment Manifest Slide-over */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="fixed inset-0 z-[60] bg-[#0A0A0F]/80 backdrop-blur-md" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-full max-w-[500px] bg-[#0A0A0F] border-l border-white/10 z-[70] flex flex-col shadow-2xl">
              
              {/* Manifest Header */}
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Shipment Manifest</h3>
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{selectedOrder.product_id}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
              </div>

              {/* Manifest Body */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
                
                {/* 3D View */}
                <div className="h-56 bg-black/40 rounded-3xl border border-white/5 overflow-hidden relative">
                   <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest z-10 border border-white/10">
                     {selectedOrder.optimized_box} • {selectedOrder.optimized_box_dims}
                   </div>
                   <Box3DViewer 
                    l={parseFloat(selectedOrder.optimized_box_dims?.split(/[xX*]/)[0]) || 20} 
                    w={parseFloat(selectedOrder.optimized_box_dims?.split(/[xX*]/)[1]) || 15} 
                    h={parseFloat(selectedOrder.optimized_box_dims?.split(/[xX*]/)[2]) || 10} 
                   />
                </div>

                {/* Score Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Confidence</p>
                    <p className="text-lg font-black text-[#00FFD1]">{selectedOrder.confidence_score}%</p>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Void Redux</p>
                    <p className="text-lg font-black text-white">{selectedOrder.space_utilization}%</p>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Risk Level</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {selectedOrder.damage_risk === 'Low' ? <ShieldCheck className="w-3.5 h-3.5 text-green-400"/> : <AlertTriangle className="w-3.5 h-3.5 text-yellow-400"/>}
                      <span className={`text-sm font-bold ${selectedOrder.damage_risk === 'Low' ? 'text-green-400' : 'text-yellow-400'}`}>{selectedOrder.damage_risk}</span>
                    </div>
                  </div>
                </div>

                {/* Costs */}
                <div>
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Zap className="w-3 h-3 text-[#00FFD1]"/> Economics</h4>
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Packaging (Box, Tape, Filler)</span>
                      <span className="font-mono text-white">${selectedOrder.packaging_cost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Shipping (Dim Wt + Zone)</span>
                      <span className="font-mono text-white">${selectedOrder.shipping_cost.toFixed(2)}</span>
                    </div>
                    <div className="pt-3 mt-1 border-t border-white/5 flex justify-between items-center">
                      <span className="text-xs font-bold text-white uppercase tracking-widest">Optimized Total</span>
                      <span className="text-lg font-black font-mono text-[#00FFD1]">${selectedOrder.total_cost.toFixed(2)}</span>
                    </div>
                    {selectedOrder.baseline_cost > 0 && (
                      <div className="mt-2 flex justify-between text-xs items-center p-2 bg-green-500/10 rounded-lg">
                        <span className="text-green-400 font-bold">Baseline: ${selectedOrder.baseline_cost.toFixed(2)}</span>
                        <span className="text-green-400 font-bold font-mono text-right flex items-center gap-1">
                          <TrendingDown className="w-3 h-3"/> {selectedOrder.savings_percent.toFixed(1)}% (-${selectedOrder.savings.toFixed(2)})
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Materials & Tips */}
                <div>
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Packing Instructions</h4>
                  <div className="p-5 bg-[#00FFD1]/5 border border-[#00FFD1]/20 rounded-2xl">
                    <p className="text-xs text-gray-300 leading-relaxed mb-4">{selectedOrder.reasoning}</p>
                    
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#00FFD1] mt-0.5 shrink-0" />
                        <span className="text-xs text-white">Use <strong className="text-[#00FFD1]">{selectedOrder.packaging_material}</strong> with <strong>{selectedOrder.fill_material}</strong>.</span>
                      </div>
                      {selectedOrder.packing_tips?.map((tip, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#00FFD1]/50 mt-1.5 shrink-0 ml-1.5" />
                          <span className="text-xs text-gray-300">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Manifest Footer (Actions) */}
              <div className="p-6 border-t border-white/5 bg-[#0A0A0F] grid grid-cols-2 gap-4">
                <button className="h-12 bg-white/[0.03] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors border border-white/10 flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" /> Print Label
                </button>
                <button className="h-12 bg-[#00FFD1] text-[#0A0A0F] rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform flex items-center justify-center shadow-[0_0_15px_rgba(0,255,209,0.2)]">
                  Verify & Dispatch
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}
