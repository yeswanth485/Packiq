'use client'

import { createClient } from '@/lib/supabase/client'
import { 
  Box, Search, Plus, Edit2, Trash2, 
  Ruler, LayoutGrid, List, Filter, X,
  Package, ChevronRight, Bookmark, ArrowUpRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import React, { useState, useEffect, useMemo } from 'react'
import Box3DViewer from '@/components/dashboard/Box3DViewer'

const BOX_TEMPLATES = [
  { id: 'amz-a1', name: 'Amazon Standard A1', length: 15, width: 10, height: 8, material: 'Corrugated', category: 'Standard', supplier: 'Amazon', cost: 0.45, inStock: true, usage: 1240 },
  { id: 'amz-a3', name: 'Amazon Large A3', length: 30, width: 22, height: 12, material: 'Corrugated', category: 'Heavy Duty', supplier: 'Amazon', cost: 0.85, inStock: true, usage: 650 },
  { id: 'fli-f1', name: 'Flipkart Small F1', length: 18, width: 12, height: 12, material: 'Recycled', category: 'Standard', supplier: 'Flipkart', cost: 0.35, inStock: true, usage: 1100 },
  { id: 'eco-m1', name: 'EcoPack Medium', length: 25, width: 20, height: 15, material: 'Sustainable', category: 'Eco', supplier: 'EcoPack', cost: 0.55, inStock: true, usage: 2300 }
]

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState('Box Sizes')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const filteredItems = useMemo(() => {
    return BOX_TEMPLATES.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery])

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Catalog</h1>
          <p className="text-gray-500 text-sm font-medium">Manage your packaging inventory and product templates.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-white/[0.03] p-1 rounded-xl border border-white/5">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#00FFD1]/10 text-[#00FFD1]' : 'text-gray-500 hover:text-white'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#00FFD1]/10 text-[#00FFD1]' : 'text-gray-500 hover:text-white'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#00FFD1] text-[#0A0A0F] px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,209,0.2)] flex items-center gap-2 hover:scale-105 transition-all">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        <div className={selectedItem ? 'lg:col-span-8 space-y-6' : 'lg:col-span-12 space-y-6'}>
          
          {/* Search */}
          <div className="relative group">
            <Search className="w-4 h-4 text-gray-600 absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-[#00FFD1] transition-colors" />
            <input 
              type="text" 
              placeholder="Search catalog..." 
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white text-sm focus:border-[#00FFD1] transition-all"
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredItems.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedItem(item)}
                className={`glass p-6 rounded-3xl cursor-pointer group transition-all relative overflow-hidden ${selectedItem?.id === item.id ? 'border-[#00FFD1] bg-[#00FFD1]/5' : 'hover:border-white/20'}`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5 group-hover:border-[#00FFD1]/30 transition-all">
                    <Box className="w-6 h-6 text-[#00FFD1]" />
                  </div>
                  <span className="px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/5 text-gray-500">{item.category}</span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mb-6">
                  <Ruler className="w-3.5 h-3.5" />
                  {item.length}x{item.width}x{item.height} cm
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                  <span className="text-sm font-black text-[#00FFD1]">${item.cost.toFixed(2)}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Preview Panel */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="lg:col-span-4 sticky top-6">
              <div className="glass p-8 rounded-[40px] relative">
                <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 p-2 text-gray-600 hover:text-white bg-white/5 rounded-full"><X className="w-4 h-4" /></button>
                
                <h3 className="text-xl font-bold text-white mb-6">Template Preview</h3>
                <div className="h-64 mb-8 bg-black/20 rounded-3xl overflow-hidden border border-white/5">
                  <Box3DViewer l={selectedItem.length} w={selectedItem.width} h={selectedItem.height} />
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Efficiency Rating</span>
                    <span className="text-sm font-bold text-green-400">92%</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Supplier</span>
                    <span className="text-sm font-bold text-white">{selectedItem.supplier}</span>
                  </div>
                </div>

                <button className="w-full h-14 bg-[#00FFD1] text-[#0A0A0F] rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">
                  Set as Default
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  )
}
