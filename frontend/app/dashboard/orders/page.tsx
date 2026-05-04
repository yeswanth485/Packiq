'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ShoppingCart, Clock, CheckCircle2, XCircle, Search, 
  ChevronRight, Box, Package, ArrowUpRight, Zap, Info, 
  ListChecks, Download, Filter, MoreHorizontal, ArrowUpDown, X, Edit, Eye, Printer, Calendar, Plus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import useSWR from 'swr'
import React, { memo } from 'react'
import SkeletonRow from '@/components/dashboard/SkeletonRow'
import { useOptimizationStore } from '@/lib/store/optimizationStore'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

// --- MOCK 3D CSS VISUALIZATION ---
function CSS3DBox({ outerDim }: { outerDim: string }) {
  return (
    <div className="w-full h-48 perspective-[1000px] flex items-center justify-center">
      <motion.div 
        animate={{ rotateY: 360, rotateX: 20 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        className="relative w-28 h-28 transform-style-3d group hover:[animation-play-state:paused]"
      >
        <div className="absolute inset-0 border-2 border-[#4361EE]/50 bg-[#4361EE]/10 transform translate-z-14 backdrop-blur-[1px]" />
        <div className="absolute inset-0 border-2 border-[#4361EE]/50 bg-[#4361EE]/5 transform -translate-z-14" />
        <div className="absolute inset-0 border-2 border-[#4361EE]/50 bg-[#4361EE]/10 transform rotate-y-90 translate-x-14 origin-right" />
        <div className="absolute inset-0 border-2 border-[#4361EE]/50 bg-[#4361EE]/10 transform -rotate-y-90 -translate-x-14 origin-left" />
        <div className="absolute inset-0 border-2 border-[#4361EE]/50 bg-[#4361EE]/10 transform rotate-x-90 -translate-y-14 origin-top" />
        <div className="absolute inset-0 border-2 border-[#4361EE]/50 bg-[#4361EE]/10 transform -rotate-x-90 translate-y-14 origin-bottom" />
        
        {/* Inner Mock Item */}
        <div className="absolute bottom-2 left-2 w-12 h-12 bg-amber-500 transform translate-z-4 opacity-90 border border-white/20 flex items-center justify-center">
           <Package className="w-4 h-4 text-white/50" />
        </div>
      </motion.div>
    </div>
  )
}

const OrdersPage = () => {
  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [statusFilter, setStatusFilter] = useState('All')
  const [carrierFilter, setCarrierFilter] = useState('All')
  const [showOptimizedOnly, setShowOptimizedOnly] = useState(false)

  const { results: optResults } = useOptimizationStore()

  // Sort State
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc'|'desc' }>({ key: 'created_at', direction: 'desc' })

  // Selection & Pagination
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  // Drawer
  const [drawerOrder, setDrawerOrder] = useState<any | null>(null)

  const fetcher = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('orders')
      .select('*, product:product_id(*), optimization:optimization_id(*), box:box_id(*)')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return (data || []).map((o: any) => {
      const char1 = o.id.charCodeAt(0) || 0
      const char2 = o.id.charCodeAt(1) || 0
      const names = ['Acme Corp', 'Stark Industries', 'Wayne Enterprises', 'Globex', 'Soylent Corp', 'Initech', 'Umbrella Corp']
      const carriers = ['FedEx', 'UPS', 'DHL', 'USPS', 'OnTrac']
      return {
        ...o,
        customer_name: names[char1 % names.length],
        carrier: carriers[char2 % carriers.length],
        items_count: (char1 % 5) + 1,
        cost: ((char1 % 100) + (char2 % 50)).toFixed(2)
      }
    })
  }

  const { data: orders = [], isLoading: loading } = useSWR('orders-data', fetcher, { 
    revalidateOnFocus: false,
    dedupingInterval: 60000
  })

  // --- DERIVED DATA ---
  const filteredOrders = useMemo(() => {
    return orders.filter((o: any) => {
      const matchesSearch = o.id.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                            o.customer_name.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchesStatus = statusFilter === 'All' || o.status.toLowerCase() === statusFilter.toLowerCase()
      const matchesCarrier = carrierFilter === 'All' || o.carrier.toLowerCase() === carrierFilter.toLowerCase()
      
      const isOptimizedInStore = optResults.some(r => r.product_id === o.product_id)
      const matchesOptimized = !showOptimizedOnly || isOptimizedInStore || !!o.optimization_id

      return matchesSearch && matchesStatus && matchesCarrier && matchesOptimized
    }).sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [orders, searchQuery, statusFilter, carrierFilter, sortConfig, showOptimizedOnly, optResults, debouncedSearch])

  const currentData = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === currentData.length) setSelectedIds([])
    else setSelectedIds(currentData.map(o => o.id))
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id))
    else setSelectedIds([...selectedIds, id])
  }

  // --- QUICK STATS ---
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20 relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Orders</h1>
          <p className="text-gray-400 text-sm">Manage and track all your shipments.</p>
        </div>
        <button className="flex items-center gap-2 bg-[#4361EE] hover:bg-[#344FDA] text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-lg shadow-[#4361EE]/20 h-11 shrink-0">
          <Plus className="w-4 h-4" /> Create Order
        </button>
      </div>

      {/* Quick Stats Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', count: stats.total, color: 'bg-blue-500' },
          { label: 'Pending', count: stats.pending, color: 'bg-amber-500' },
          { label: 'Shipped', count: stats.shipped, color: 'bg-green-500' },
          { label: 'Cancelled', count: stats.cancelled, color: 'bg-red-500' }
        ].map((s, i) => (
          <div key={i} className="bg-[#0f0f1a] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
              <span className="text-sm text-gray-400 font-medium">{s.label}</span>
            </div>
            <span className="text-xl font-black text-white">{s.count}</span>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-[#0f0f1a] p-3 rounded-xl border border-white/[0.06]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by order ID, customer..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1a2e] border border-white/5 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#4361EE]/50 transition-colors placeholder-gray-600"
          />
        </div>
        <div className="flex gap-3">
          <select 
            value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#1a1a2e] border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#4361EE]/50 appearance-none min-w-[120px]"
          >
            {['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
          </select>
          <select 
            value={carrierFilter} onChange={(e) => setCarrierFilter(e.target.value)}
            className="bg-[#1a1a2e] border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#4361EE]/50 appearance-none min-w-[120px]"
          >
            {['All', 'FedEx', 'UPS', 'DHL', 'USPS', 'OnTrac'].map(c => <option key={c}>{c}</option>)}
          </select>
          <div className="relative">
            <input type="date" className="bg-[#1a1a2e] border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-400 focus:outline-none focus:border-[#4361EE]/50 min-w-[140px] [&::-webkit-calendar-picker-indicator]:invert-[0.6]" />
          </div>
          <button 
            onClick={() => setShowOptimizedOnly(!showOptimizedOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              showOptimizedOnly ? 'bg-[#4361EE]/20 border-[#4361EE] text-white' : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <Zap className={`w-4 h-4 ${showOptimizedOnly ? 'fill-[#4361EE]' : ''}`} /> Optimized Only
          </button>
          <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium border border-white/5 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (Floating) */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="bg-[#4361EE] text-white px-4 py-3 rounded-xl flex items-center justify-between shadow-xl shadow-[#4361EE]/20 fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg">
            <span className="text-sm font-bold">{selectedIds.length} orders selected</span>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors">Ship Selected</button>
              <button className="px-3 py-1.5 bg-white/20 hover:bg-red-500/80 rounded-lg text-xs font-bold transition-colors">Cancel</button>
              <button className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"><Download className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders Table */}
      <div className="bg-[#0f0f1a] rounded-[20px] border border-white/[0.06] overflow-hidden shadow-xl min-h-[500px]">
        {loading ? (
           <div className="overflow-x-auto w-full">
             <table className="w-full text-left text-sm whitespace-nowrap">
               <tbody>
                 {[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}
               </tbody>
             </table>
           </div>
        ) : filteredOrders.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-24 text-center">
             <div className="w-24 h-24 mb-6 relative opacity-80">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-full h-full text-gray-700" strokeWidth="1">
                 <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                 <path d="m3.3 7 8.7 5 8.7-5"/>
                 <path d="M12 22V12"/>
               </svg>
             </div>
             <h3 className="text-xl font-bold text-white mb-2">No orders found</h3>
             <p className="text-sm text-gray-500 mb-6 max-w-sm">We couldn't find any orders matching your filters. Create your first order to get started.</p>
             <button className="bg-[#4361EE] hover:bg-[#344FDA] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-[#4361EE]/20">Create Order</button>
           </div>
        ) : (
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm whitespace-nowrap">
               <thead>
                 <tr className="border-b border-white/5 bg-white/[0.02]">
                   <th className="px-4 py-4 w-12 text-center">
                     <input type="checkbox" checked={selectedIds.length === currentData.length && currentData.length > 0} onChange={toggleSelectAll} className="rounded border-gray-600 bg-transparent text-[#4361EE] focus:ring-offset-0 focus:ring-transparent cursor-pointer" />
                   </th>
                   {[
                     { key: 'id', label: 'Order ID' },
                     { key: 'customer_name', label: 'Customer' },
                     { key: 'items_count', label: 'Items' },
                     { key: 'carrier', label: 'Carrier' },
                     { key: 'status', label: 'Status' },
                     { key: 'created_at', label: 'Date' },
                     { key: 'cost', label: 'Cost' }
                   ].map(h => (
                     <th key={h.key} onClick={() => handleSort(h.key)} className="px-4 py-4 font-semibold text-gray-400 hover:text-white cursor-pointer transition-colors group">
                       <div className="flex items-center gap-2">
                         {h.label}
                         <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === h.key ? 'text-[#00E5CC]' : 'text-gray-600 group-hover:text-gray-400'}`} />
                       </div>
                     </th>
                   ))}
                   <th className="px-4 py-4 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody>
                 <AnimatePresence>
                   {currentData.map((order, i) => (
                     <motion.tr 
                       key={order.id}
                       initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                       className="border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors group cursor-pointer h-14"
                       onClick={() => setDrawerOrder(order)}
                     >
                       <td className="px-4 text-center" onClick={e => e.stopPropagation()}>
                         <input type="checkbox" checked={selectedIds.includes(order.id)} onChange={() => toggleSelect(order.id)} className="rounded border-gray-600 bg-transparent text-[#4361EE] focus:ring-offset-0 focus:ring-transparent cursor-pointer" />
                       </td>
                       <td className="px-4 font-mono text-gray-300"><div className="flex items-center gap-2">
                             ORD-{order.id.slice(0, 6).toUpperCase()}
                             {(optResults.some(r => r.product_id === order.product_id) || order.optimization_id) && (
                               <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded text-[9px] font-bold text-green-400">
                                 <CheckCircle2 className="w-2.5 h-2.5" /> OPTIMIZED
                               </div>
                             )}
                          </div></td>
                       <td className="px-4 text-white font-medium">
                          <div className="flex flex-col">
                            <span>{order.customer_name}</span>
                            {optResults.find(r => r.product_id === order.product_id)?.savings && (
                              <span className="text-[10px] text-green-400 font-bold tracking-tight">Saved ${(optResults.find(r => r.product_id === order.product_id)?.savings || 0).toFixed(2)}</span>
                            )}
                          </div>
                        </td>
                       <td className="px-4 text-gray-400">{order.items_count}</td>
                       <td className="px-4 text-gray-400">{order.carrier}</td>
                       <td className="px-4">
                         <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                           order.status === 'delivered' ? 'bg-green-500/10 text-green-400' : 
                           order.status === 'shipped' ? 'bg-blue-500/10 text-blue-400' : 
                           order.status === 'cancelled' ? 'bg-red-500/10 text-red-400' : 
                           'bg-amber-500/10 text-amber-400'
                         }`}>
                           {order.status}
                         </span>
                       </td>
                       <td className="px-4 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                       <td className="px-4 text-white font-semibold">${order.cost}</td>
                       <td className="px-4 text-right" onClick={e => e.stopPropagation()}>
                         <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => setDrawerOrder(order)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"><Eye className="w-4 h-4" /></button>
                           <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"><Edit className="w-4 h-4" /></button>
                           <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                         </div>
                       </td>
                     </motion.tr>
                   ))}
                 </AnimatePresence>
               </tbody>
             </table>
           </div>
        )}
        
        {/* Pagination */}
        {!loading && filteredOrders.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.01]">
            <span className="text-xs text-gray-500">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} entries</span>
            <div className="flex gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none text-xs font-medium transition-colors">Prev</button>
              <div className="flex items-center px-3 text-xs text-white font-bold">{currentPage} / {totalPages || 1}</div>
              <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none text-xs font-medium transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT-SIDE DRAWER: Order Details */}
      <AnimatePresence>
        {drawerOrder && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawerOrder(null)} className="fixed inset-0 z-[60] bg-[#05050a]/70 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }} className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-[#0f0f1a] border-l border-white/10 z-[70] flex flex-col shadow-2xl">
              
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2 mb-1">
                    Order ORD-{drawerOrder.id.slice(0, 6).toUpperCase()}
                  </h3>
                  <div className={`inline-flex px-2 py-0.5 rounded uppercase tracking-widest text-[10px] font-bold ${drawerOrder.status === 'pending' ? 'bg-amber-500/20 text-amber-500' : 'bg-green-500/20 text-green-500'}`}>
                    {drawerOrder.status}
                  </div>
                </div>
                <button onClick={() => setDrawerOrder(null)} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                <div className="bg-[#1a1a2e] p-4 rounded-xl border border-white/5">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Customer Info</h4>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">Customer</span>
                    <span className="text-white font-semibold">{drawerOrder.customer_name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-gray-300">Carrier</span>
                    <span className="text-white font-semibold">{drawerOrder.carrier}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Items ({drawerOrder.items_count})</h4>
                  <div className="space-y-2">
                    {Array.from({ length: drawerOrder.items_count }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                        <div className="w-10 h-10 rounded bg-[#4361EE]/10 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-[#4361EE]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-white mb-0.5">{drawerOrder.product?.name || `Product Widget ${i+1}`}</p>
                          <p className="text-xs text-gray-500">Qty: 1 • Dimensions: 10x8x5 cm</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0A0A12] border border-[#4361EE]/20 rounded-xl overflow-hidden shadow-lg shadow-[#4361EE]/5">
                  <div className="p-4 border-b border-[#4361EE]/10 bg-[#4361EE]/5 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#4361EE]" />
                    <h4 className="text-sm font-bold text-white">AI Packing Recommendation</h4>
                  </div>
                  <div className="p-4 flex flex-col items-center">
                    <CSS3DBox outerDim={drawerOrder.optimization?.recommended_box || "15x15x15"} />
                    <div className="mt-4 w-full bg-white/5 rounded-lg p-3 border border-white/5 text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-400">Box to use</span>
                        <span className="text-[#00E5CC] font-bold">{drawerOrder.optimization?.recommended_box || "Standard Medium (15x15x15)"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Void Space</span>
                        <span className="text-white font-semibold">12%</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-white/5 bg-white/[0.02] flex gap-3">
                <button className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                  <Printer className="w-4 h-4" /> Print Label
                </button>
                <button className="flex-1 bg-[#4361EE] hover:bg-[#344FDA] text-white px-4 py-3 rounded-xl text-sm font-bold shadow-lg shadow-[#4361EE]/20 transition-colors">
                  Update Status
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}

export default memo(OrdersPage)
