'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  ShoppingCart, Clock, CheckCircle2, XCircle, 
  ChevronRight, Box, Package, ArrowUpRight, 
  Zap, Info, ListChecks, HelpCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<'current' | 'previous'>('current')
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showInstructions, setShowInstructions] = useState<any | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadOrders() {
      const { data, error } = await supabase
        .from('orders')
        .select('*, product:product_id(*), optimization:optimization_id(*), box:box_id(*)')
        .order('created_at', { ascending: false })
      
      if (error) toast.error('Failed to load orders')
      else setOrders(data || [])
      setLoading(false)
    }
    loadOrders()
  }, [supabase])

  const currentOrders = orders.filter(o => ['pending', 'confirmed', 'shipped'].includes(o.status))
  const previousOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status))
  const displayedOrders = activeTab === 'current' ? currentOrders : previousOrders

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Order Management</h1>
          <p className="text-gray-500 text-sm">Track your shipments and view AI-optimized packing instructions.</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => setActiveTab('current')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'current' ? 'bg-[#00E5CC] text-[#0A0A0F] shadow-lg shadow-[#00E5CC]/20' : 'text-gray-400 hover:text-white'}`}
          >
            Current
          </button>
          <button 
            onClick={() => setActiveTab('previous')}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'previous' ? 'bg-[#00E5CC] text-[#0A0A0F] shadow-lg shadow-[#00E5CC]/20' : 'text-gray-400 hover:text-white'}`}
          >
            History
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {displayedOrders.map((order) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={order.id}
              className="glass p-6 rounded-3xl border-white/5 bg-white/[0.01] hover:border-[#00E5CC]/20 transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6" />
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  order.status === 'delivered' ? 'bg-green-500/10 text-green-400' : 
                  order.status === 'shipped' ? 'bg-blue-500/10 text-blue-400' : 
                  'bg-amber-500/10 text-amber-400'
                }`}>
                  {order.status}
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{order.product?.name || 'Order #' + order.id.slice(0, 8)}</h3>
              <p className="text-xs text-gray-500 mb-6 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Placed on {new Date(order.created_at).toLocaleDateString()}
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#00E5CC]/10 flex items-center justify-center">
                      <Box className="w-4 h-4 text-[#00E5CC]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Recommended Box</p>
                      <p className="text-sm font-black text-white">{order.optimization?.recommended_box || 'Auto-Sized'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Savings</p>
                    <p className="text-sm font-black text-green-400">+${order.optimization?.cost_savings_usd || '0.00'}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowInstructions(order)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <ListChecks className="w-4 h-4" />
                  Pack Now
                </button>
                <button className="w-12 h-12 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl flex items-center justify-center transition-all">
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Instructions Modal */}
      <AnimatePresence>
        {showInstructions && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowInstructions(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass rounded-[40px] border-white/5 overflow-hidden shadow-2xl"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#00E5CC]/10 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-[#00E5CC]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">Packing Guide</h2>
                      <p className="text-gray-500 text-sm font-medium">AI-Generated spatial instructions</p>
                    </div>
                  </div>
                  <button onClick={() => setShowInstructions(null)} className="p-3 hover:bg-white/5 rounded-2xl text-gray-600 hover:text-white transition-all">
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-10">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                        <Info className="w-4 h-4 text-[#00E5CC]" /> Why this box?
                      </h4>
                      <p className="text-sm text-gray-300 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5 italic">
                        "The {showInstructions.optimization?.recommended_box} reduces void space by {showInstructions.optimization?.efficiency_score}% compared to your standard inventory, cutting transit costs by ${showInstructions.optimization?.cost_savings_usd} while ensuring structural integrity."
                      </p>
                    </div>
                    
                    <div className="p-6 rounded-3xl bg-blue-600/5 border border-blue-500/10">
                       <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 mb-3">Spatial Alert</h4>
                       <p className="text-xs text-blue-100/70 leading-relaxed">Place the product at a 45° diagonal to maximize corner protection.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Step-by-Step</h4>
                     {[
                       'Select the AMZ-A1 box from the central rack.',
                       'Fold the bottom flaps and secure with 2-inch tape.',
                       'Place the product centered with padding on the long side.',
                       'Add 5cm of eco-wrap to fill the remaining void.',
                       'Seal top and apply shipping label to the largest face.'
                     ].map((step, i) => (
                       <div key={i} className="flex gap-4 group">
                          <span className="w-6 h-6 rounded-full bg-white/5 text-[10px] font-black flex items-center justify-center border border-white/10 group-hover:bg-[#00E5CC] group-hover:text-[#0A0A0F] transition-all shrink-0">{i+1}</span>
                          <p className="text-xs text-gray-400 font-medium group-hover:text-white transition-colors">{step}</p>
                       </div>
                     ))}
                  </div>
                </div>

                <button 
                  onClick={() => setShowInstructions(null)}
                  className="w-full bg-[#00E5CC] hover:bg-[#00c2ad] text-[#0A0A0F] py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-[#00E5CC]/20"
                >
                  Mark as Packed
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
