'use client'

import React, { useState, useEffect, useMemo, memo } from 'react'
import { Plus, Search, Filter, Package, Truck, Calendar, Box as BoxIcon, ChevronDown, ChevronUp, Eye, TrendingDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useOptimizationStore } from '@/lib/store/optimizationStore'
import { motion, AnimatePresence } from 'framer-motion'
import Box3DViewer from '@/components/dashboard/Box3DViewer'

const OrdersClient = memo(function OrdersClient({ initialOrders, products }: { initialOrders: any[], products: any[] }) {
  const { results: optResults } = useOptimizationStore()
  const [orders, setOrders] = useState(initialOrders)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // Subscribe to realtime inserts on orders for the current user
  useEffect(() => {
    let channel: any | null = null
    let mounted = true

    async function setup() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase.channel(`orders:user=${user.id}`)

      // Listen for INSERT and UPDATE events so Orders UI stays in sync
      channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, async (payload: any) => {
        if (!mounted) return
        const newRow = payload?.new
        if (!newRow) return
        // Enrich row with product data if not present
        if (!newRow.product && (newRow.product_id || newRow.product_snapshot)) {
          try {
            if (newRow.product_snapshot) {
              newRow.product = newRow.product_snapshot
            }
            if (!newRow.product && newRow.product_id) {
              const { data: product } = await supabase.from('products').select('*').eq('id', newRow.product_id).single()
              if (product) newRow.product = product
            }
          } catch (err) {
            // ignore enrichment errors
          }
        }
        setOrders(prev => [newRow, ...prev])
      })

      channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` }, async (payload: any) => {
        if (!mounted) return
        const updated = payload?.new
        if (!updated) return
        // Enrich as above
        if (!updated.product && (updated.product_id || updated.product_snapshot)) {
          try {
            if (updated.product_snapshot) {
              updated.product = updated.product_snapshot
            }
            if (!updated.product && updated.product_id) {
              const { data: product } = await supabase.from('products').select('*').eq('id', updated.product_id).single()
              if (product) updated.product = product
            }
          } catch (err) {}
        }
        setOrders(prev => prev.map(o => o.id === updated.id ? updated : o))
      })

      await channel.subscribe()
    }

    setup()

    return () => {
      mounted = false
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    carrier: '',
    tracking_number: '',
    quantity: 1,
  })

  const mergedOrders = useMemo(() => {
    const dbList = [...orders]
    const dbIds = new Set(dbList.map(o => o.id))

    const sessionOrders = optResults.map((r, index) => ({
      id: `session-${r.product_id}-${index}`,
      created_at: new Date().toISOString(),
      status: 'Ready to Ship',
      carrier: 'Auto-Assigned',
      tracking_number: 'PENDING',
      product_name: r.product_name,
      baseline_box: r.original_box || 'N/A',
      optimized_box: r.optimized_box || 'N/A',
      baseline_cost: r.baseline_cost || 0,
      total_cost: r.total_cost || 0,
      savings: r.savings || 0,
      optimized_dims: r.optimizedDims,
      product_dims: { l: r.lengthCm, w: r.widthCm, h: r.heightCm },
      product: {
        name: r.product_name,
        sku: r.sku
      },
      product_snapshot: {
        name: r.product_name,
        sku: r.sku,
        length_cm: r.lengthCm,
        width_cm: r.widthCm,
        height_cm: r.heightCm,
        weight_kg: r.product_weight || 0,
        fragility: r.fragility
      }
    }))

    sessionOrders.forEach(so => {
      if (!dbIds.has(so.id)) {
        dbList.unshift(so)
      }
    })

    return dbList
  }, [orders, optResults])

  const filteredOrders = mergedOrders.filter(o => {
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    const matchesSearch = o.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (o.product?.name || o.product_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Find the selected product to create a snapshot
      const selectedProduct = products.find(p => p.id === formData.product_id)

      const { data, error } = await (supabase as any)
        .from('orders')
        .insert({
          user_id: user.id,
          product_id: formData.product_id,
          sku: selectedProduct?.sku || null,
          product_name: selectedProduct?.name || null,
          length_cm: selectedProduct?.length_cm || null,
          width_cm: selectedProduct?.width_cm || null,
          height_cm: selectedProduct?.height_cm || null,
          weight_kg: selectedProduct?.weight_kg || null,
          fragility_level: selectedProduct?.fragility_level || null,
          carrier: formData.carrier,
          tracking_number: formData.tracking_number,
          quantity: formData.quantity,
          status: 'pending'
        })
        .select('*')
        .single()

      if (!error && data) {
        // Manually attach product object for the UI to render correctly immediately
        data.product = selectedProduct
      }

      if (error) throw error

      setOrders([data, ...orders])
      setIsModalOpen(false)
      toast.success('Order created successfully')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Ready to Ship': return 'bg-[#00FFD1]/10 text-[#00FFD1] border border-[#00FFD1]/20'
      case 'Ready to Ship': return 'bg-[#00FFD1]/10 text-[#00FFD1] border border-[#00FFD1]/20'
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
      case 'confirmed': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
      case 'shipped': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
      case 'delivered': return 'bg-green-500/10 text-green-400 border border-green-500/20'
      case 'cancelled': return 'bg-red-500/10 text-red-400 border border-red-500/20'
      default: return 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
    }
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search orders or tracking..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-xl pl-10 pr-8 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Ready to Ship">Ready to Ship</option>
              <option value="Ready to Ship">Ready to Ship</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Create Order
        </button>
      </div>

      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 text-left">Reference</th>
                <th className="px-6 py-4 text-left">Product</th>
                <th className="px-6 py-4 text-left">Optimization</th>
                <th className="px-6 py-4 text-left">Costs</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <React.Fragment key={o.id}>
                  <tr
                    onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono text-gray-300 text-xs">
                      #{o.id.startsWith('session') ? 'OPT-' + o.id.slice(-4).toUpperCase() : o.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-gray-200 font-bold text-sm">{o.product?.name || o.product_name || 'Unknown Product'}</span>
                        <span className="text-[10px] text-gray-500">{o.product?.sku || o.sku || 'No SKU'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] text-gray-500 uppercase font-black">Old:</span>
                           <span className="text-[10px] text-gray-400">{o.baseline_box || 'Standard'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] text-[#00FFD1] uppercase font-black">AI:</span>
                           <span className="text-[10px] text-white font-bold">{o.optimized_box || 'Optimal'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 line-through">${(o.baseline_cost || 0).toFixed(2)}</span>
                        <span className="text-sm text-[#00FFD1] font-black">${(o.total_cost || 0).toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-[#00FFD1] transition-colors">
                          {expandedId === o.id ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                       </button>
                    </td>
                  </tr>
                  <AnimatePresence>
                    {expandedId === o.id && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white/[0.01]"
                      >
                        <td colSpan={6} className="px-6 py-8">
                          <div className="grid lg:grid-cols-2 gap-10">
                             <div className="h-64 rounded-3xl overflow-hidden border border-white/10 glass relative">
                                <Box3DViewer
                                  l={o.optimized_dims?.l || 30}
                                  w={o.optimized_dims?.w || 22}
                                  h={o.optimized_dims?.h || 18}
                                  productL={o.product_dims?.l || 10}
                                  productW={o.product_dims?.w || 10}
                                  productH={o.product_dims?.h || 10}
                                  spaceUtilization={85}
                                  fragility={(o.product_snapshot?.fragility || 'LOW').toLowerCase() as any}
                                />
                                <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-md rounded-lg border border-white/10">
                                   <span className="text-[10px] font-black text-[#00FFD1] uppercase tracking-widest">3D Box Simulation</span>
                                </div>
                             </div>
                             <div className="space-y-6">
                                <div>
                                   <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                      <TrendingDown className="w-3 h-3 text-[#00FFD1]" /> Savings Analysis
                                   </h4>
                                   <div className="grid grid-cols-2 gap-4">
                                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                         <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Projected Savings</p>
                                         <p className="text-xl font-black text-emerald-400">${(o.savings || 0).toFixed(2)}</p>
                                      </div>
                                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                         <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Cost Reduction</p>
                                         <p className="text-xl font-black text-white">{Math.round(((o.savings || 0) / (o.baseline_cost || 1)) * 100)}%</p>
                                      </div>
                                   </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8 text-[10px]">
                                   <div>
                                      <p className="font-black text-gray-500 uppercase tracking-widest mb-2">Carrier Details</p>
                                      <div className="space-y-1">
                                         <p className="text-gray-300 font-bold">Courier: <span className="text-white">{o.carrier || 'Auto-Assigned'}</span></p>
                                         <p className="text-gray-300 font-bold">Tracking: <span className="text-indigo-400 font-mono">{o.tracking_number || 'PENDING'}</span></p>
                                      </div>
                                   </div>
                                   <div>
                                      <p className="font-black text-gray-500 uppercase tracking-widest mb-2">Package Specification</p>
                                      <div className="space-y-1">
                                         <p className="text-gray-300 font-bold">Box: <span className="text-white">{o.optimized_box || 'N/A'}</span></p>
                                         <p className="text-gray-300 font-bold">Dims: <span className="text-white">{o.optimized_dims?.l}x{o.optimized_dims?.w}x{o.optimized_dims?.h} cm</span></p>
                                      </div>
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
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No orders found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Create New Order</h2>
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Product</label>
                <select 
                  required
                  value={formData.product_id}
                  onChange={e => setFormData({...formData, product_id: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Select a product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku || p.id.slice(0,6)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Quantity</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Carrier</label>
                <input 
                  type="text" 
                  placeholder="e.g. FedEx, UPS, USPS"
                  value={formData.carrier}
                  onChange={e => setFormData({...formData, carrier: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Tracking Number</label>
                <input 
                  type="text" 
                  placeholder="Tracking code"
                  value={formData.tracking_number}
                  onChange={e => setFormData({...formData, tracking_number: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
})

export default OrdersClient
