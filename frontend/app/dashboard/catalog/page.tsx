'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Box, Search, Plus, Edit2, Trash2, 
  ChevronRight, Info, Package, Ruler, DollarSign 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'

const OptimizedBoxViewer = dynamic(() => import('@/components/dashboard/OptimizedBoxViewer'), { ssr: false })

export default function CatalogPage() {
  const [boxes, setBoxes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedBox, setSelectedBox] = useState<any | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function loadBoxes() {
      const { data, error } = await supabase.from('box_catalog').select('*').order('name')
      if (error) toast.error('Failed to load catalog')
      else setBoxes(data || [])
      setLoading(false)
    }
    loadBoxes()
  }, [supabase])

  const filteredBoxes = boxes.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.supplier?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Box Catalog</h1>
          <p className="text-gray-500 text-sm">Manage your standard packaging inventory and view 3D dimensions.</p>
        </div>
        <button className="bg-[#00E5CC] hover:bg-[#00c2ad] text-[#0A0A0F] px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-[#00E5CC]/20 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Custom Box
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
            <input 
              type="text" 
              placeholder="Search by name or supplier..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-[#00E5CC]/30 transition-all"
            />
          </div>

          <div className="glass rounded-3xl border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-white/[0.02] text-gray-500 border-b border-white/5 font-black uppercase tracking-widest text-[10px]">
                    <th className="px-6 py-4">Box Type</th>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Dimensions (L*W*H)</th>
                    <th className="px-6 py-4">Cost</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBoxes.map((b) => (
                    <motion.tr 
                      layout
                      key={b.id} 
                      className={`border-b border-white/5 transition-colors cursor-pointer group ${selectedBox?.id === b.id ? 'bg-[#00E5CC]/5' : 'hover:bg-white/[0.01]'}`}
                      onClick={() => setSelectedBox(b)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${b.supplier === 'Amazon' ? 'bg-orange-500/10 text-orange-500' : b.supplier === 'Flipkart' ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-500'}`}>
                            <Box className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-gray-200">{b.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-medium">{b.supplier || 'Internal'}</td>
                      <td className="px-6 py-4 text-gray-400 font-mono text-xs">{b.length_cm} * {b.width_cm} * {b.height_cm} cm</td>
                      <td className="px-6 py-4 text-white font-bold">${b.cost_usd?.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${b.in_stock ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                          {b.in_stock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedBox ? (
              <motion.div 
                key={selectedBox.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass p-8 rounded-3xl border-[#00E5CC]/20 bg-[#00E5CC]/5 sticky top-24"
              >
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-xl font-black text-white">Box Preview</h4>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#00E5CC]">{selectedBox.sku}</span>
                </div>

                <OptimizedBoxViewer dimensions={`${selectedBox.length_cm}*${selectedBox.width_cm}*${selectedBox.height_cm}`} />

                <div className="mt-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Ruler className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Dimensions</span>
                      </div>
                      <div className="text-sm font-black text-white">{selectedBox.length_cm}x{selectedBox.width_cm}x{selectedBox.height_cm}</div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <DollarSign className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Unit Cost</span>
                      </div>
                      <div className="text-sm font-black text-[#00E5CC]">${selectedBox.cost_usd}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                      <Package className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Material & Specs</span>
                    </div>
                    <p className="text-xs text-gray-400 capitalize">{selectedBox.material || 'Corrugated Fiberboard'} • Max Weight: {selectedBox.max_weight_kg}kg</p>
                    {selectedBox.eco_certified && (
                      <div className="mt-3 flex items-center gap-2 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-lg w-fit">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">Eco Certified</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="glass p-12 rounded-3xl border-dashed border-white/10 flex flex-col items-center justify-center text-center sticky top-24">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                  <Info className="w-8 h-8 text-gray-700" />
                </div>
                <h4 className="text-lg font-bold text-gray-400 mb-2">No Box Selected</h4>
                <p className="text-xs text-gray-600 leading-relaxed">Select a box from the catalog to <br />view its 3D visualization and specs.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
