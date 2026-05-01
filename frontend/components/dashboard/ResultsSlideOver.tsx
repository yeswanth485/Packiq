'use client'

import { useState } from 'react'
import { X, ChevronRight, Package, Box as BoxIcon, Quote, DollarSign, ShoppingCart } from 'lucide-react'
import BoxViewer3D from '@/components/3d/BoxViewer3D'
import { motion, AnimatePresence } from 'framer-motion'

interface OptimizationData {
  id: string
  product_snapshot: any
  recommended_box: string
  ai_response: any
  cost_savings_usd: number
  efficiency_score: number
  created_at: string
  box_catalog_data?: any
}

interface ResultsSlideOverProps {
  isOpen: boolean
  onClose: () => void
  data: OptimizationData | null
}

export default function ResultsSlideOver({ isOpen, onClose, data }: ResultsSlideOverProps) {
  const [show3D, setShow3D] = useState(false)

  if (!data) return null

  const before = data.product_snapshot || {}
  const after = data.ai_response || {}

  // Parse dimensions from recommended box catalog data or from AI response
  // If box_catalog_data exists, use it. Otherwise, extract from string or fallback
  const w = data.box_catalog_data?.width_cm || 30
  const h = data.box_catalog_data?.height_cm || 20
  const d = data.box_catalog_data?.length_cm || 15

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Slide Over Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-xl glass border-l border-white/10 shadow-2xl z-50 flex flex-col overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-400" />
                  {before.name || 'Optimization Details'}
                </h2>
                <p className="text-sm text-gray-400 mt-1">ID: {before.product_id || data.id.slice(0, 8)}</p>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 space-y-8">
              
              {/* Before vs After */}
              <div className="grid grid-cols-2 gap-4">
                {/* Before */}
                <div className="glass p-5 rounded-2xl border border-red-500/10 bg-red-500/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-3 py-1 bg-red-500/20 text-red-300 text-xs font-bold rounded-bl-lg">BEFORE</div>
                  <p className="text-sm text-gray-400 mb-4">Current Packaging</p>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Box Size</p>
                      <p className="text-sm font-medium text-gray-300">{before.current_box_size || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cost</p>
                      <p className="text-sm font-medium text-red-400">${Number(before.current_cost_usd || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Dimensions (L x W x H)</p>
                      <p className="text-sm font-medium text-gray-300">{before.length_cm || before.breadth_cm} x {before.width_cm} x {before.height_cm} cm</p>
                    </div>
                  </div>
                </div>

                {/* After */}
                <div className="glass p-5 rounded-2xl border border-green-500/10 bg-green-500/5 relative overflow-hidden shadow-[0_0_30px_rgba(34,197,94,0.1)]">
                  <div className="absolute top-0 right-0 px-3 py-1 bg-green-500/20 text-green-300 text-xs font-bold rounded-bl-lg flex items-center gap-1">
                    AFTER <ChevronRight className="w-3 h-3" />
                  </div>
                  <p className="text-sm text-gray-400 mb-4">Recommended</p>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Box Size</p>
                      <p className="text-sm font-medium text-indigo-300">{data.recommended_box || after.recommended_box}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">New Cost</p>
                      <p className="text-sm font-medium text-green-400">${Number(after.new_cost_usd || 0).toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-gray-500">Efficiency</p>
                        <p className="text-sm font-bold text-amber-400">{data.efficiency_score}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Savings</p>
                        <p className="text-lg font-bold text-green-400">+${Number(data.cost_savings_usd || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Reasoning */}
              <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <Quote className="w-4 h-4 text-indigo-400" />
                  AI Reasoning
                </h3>
                <div className="glass p-5 rounded-2xl border-l-4 border-indigo-500 bg-indigo-500/5">
                  <p className="text-sm text-indigo-200/80 leading-relaxed italic">
                    "{after.reasoning || 'Based on the dimensions and weight of the product, this box size offers the most optimal space utilization while minimizing material costs.'}"
                  </p>
                </div>
              </div>

              {/* 3D Box Preview */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <BoxIcon className="w-4 h-4 text-cyan-400" />
                    3D Box Preview
                  </h3>
                  <button 
                    onClick={() => setShow3D(!show3D)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1.5 bg-indigo-500/10 rounded-lg transition-colors"
                  >
                    {show3D ? 'Hide 3D View' : 'View 3D Box'}
                  </button>
                </div>
                
                <AnimatePresence>
                  {show3D && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <BoxViewer3D widthCm={w} heightCm={h} depthCm={d} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-white/5 bg-gray-900/50 flex justify-between items-center">
              <div className="text-xs text-gray-500">
                Processed with Claude 3.5 Sonnet
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-white/10 hover:bg-white/20 transition-colors">
                  Close
                </button>
                <button 
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          product_id: data.product_snapshot.id,
                          optimization_id: data.id,
                          box_id: data.box_catalog_data?.id,
                          total_cost_usd: data.ai_response.new_cost_usd
                        })
                      })
                      if (!res.ok) throw new Error('Order failed')
                      import('sonner').then(({ toast }) => toast.success('Order created successfully!'))
                      onClose()
                    } catch (err) {
                      import('sonner').then(({ toast }) => toast.error('Failed to create order'))
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Confirm & Order
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
