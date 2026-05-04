'use client'

import { createClient } from '@/lib/supabase/client'
import { 
  Box, Search, Plus, Edit2, Trash2, 
  ChevronRight, Info, Package, Ruler, DollarSign,
  LayoutGrid, List, Filter, X, Upload, CheckCircle2,
  MoreVertical, ArrowRight, Tag, Bookmark
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import React, { memo, useState, useEffect, useMemo } from 'react'
import SkeletonCard from '@/components/dashboard/SkeletonCard'
import { useOptimizationStore } from '@/lib/store/optimizationStore'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

// --- MOCK DATA ---

const BOX_TEMPLATES = [
  // Amazon Standard Boxes
  { id: 'amz-a1', name: 'Amazon A1', length: 15.2, width: 10.1, height: 8.5, material: 'Corrugated', category: 'Standard', supplier: 'Amazon', cost: 0.45, inStock: true, usage: 1240 },
  { id: 'amz-a3', name: 'Amazon A3', length: 22.8, width: 15.2, height: 10.1, material: 'Corrugated', category: 'Standard', supplier: 'Amazon', cost: 0.65, inStock: true, usage: 980 },
  { id: 'amz-a4', name: 'Amazon A4', length: 30.4, width: 22.8, height: 12.7, material: 'Corrugated', category: 'Large', supplier: 'Amazon', cost: 0.85, inStock: true, usage: 650 },
  { id: 'amz-m1', name: 'Amazon Mailer M1', length: 25.4, width: 15.2, height: 2.5, material: 'Kraft Bubble', category: 'Mailer', supplier: 'Amazon', cost: 0.25, inStock: true, usage: 3400 },
  
  // Flipkart Boxes
  { id: 'flp-f1', name: 'Flipkart F1', length: 18.0, width: 12.0, height: 12.0, material: 'Double Wall', category: 'Heavy Duty', supplier: 'Flipkart', cost: 0.85, inStock: true, usage: 750 },
  { id: 'flp-f2', name: 'Flipkart F2', length: 25.0, width: 20.0, height: 15.0, material: 'Double Wall', category: 'Heavy Duty', supplier: 'Flipkart', cost: 1.20, inStock: false, usage: 420 },
  { id: 'flp-s1', name: 'Flipkart S1', length: 10.0, width: 10.0, height: 10.0, material: 'Corrugated', category: 'Small', supplier: 'Flipkart', cost: 0.35, inStock: true, usage: 1100 },
  
  // Quick Commerce (Zepto & Blinkit)
  { id: 'zep-b1', name: 'Zepto Grocery Bag', length: 35.0, width: 20.0, height: 15.0, material: 'Recycled Paper', category: 'Bag', supplier: 'Zepto', cost: 0.15, inStock: true, usage: 8900 },
  { id: 'zep-b2', name: 'Zepto Large Bag', length: 45.0, width: 25.0, height: 20.0, material: 'Recycled Paper', category: 'Bag', supplier: 'Zepto', cost: 0.25, inStock: true, usage: 4100 },
  { id: 'bli-b1', name: 'Blinkit Paper Bag', length: 30.0, width: 18.0, height: 12.0, material: 'Kraft Paper', category: 'Bag', supplier: 'Blinkit', cost: 0.12, inStock: true, usage: 10500 },
  { id: 'bli-b2', name: 'Blinkit Cold Bag', length: 25.0, width: 20.0, height: 15.0, material: 'Insulated Foil', category: 'Insulated', supplier: 'Blinkit', cost: 0.55, inStock: true, usage: 2300 },
  
  // Logistics Providers
  { id: 'fdx-s', name: 'FedEx Small', length: 31.0, width: 27.6, height: 3.8, material: 'Recycled', category: 'Eco', supplier: 'FedEx', cost: 0.50, inStock: true, usage: 2100 },
  { id: 'ups-m', name: 'UPS Medium', length: 30.0, width: 20.0, height: 20.0, material: 'Corrugated', category: 'Standard', supplier: 'UPS', cost: 1.10, inStock: true, usage: 560 }
]

const PRODUCT_TEMPLATES = [
  { id: 'p1', name: 'iPhone 15 Pro', length: 14.7, width: 7.1, height: 0.8, weight: 0.187, category: 'Electronics', material: 'Glass/Titanium', cost: 999, usage: 450 },
  { id: 'p2', name: 'MacBook Air M2', length: 30.4, width: 21.5, height: 1.1, weight: 1.24, category: 'Electronics', material: 'Aluminum', cost: 1199, usage: 230 },
  { id: 'p3', name: 'Leather Wallet', length: 11, width: 9, height: 2, weight: 0.08, category: 'Accessories', material: 'Leather', cost: 45, usage: 890 }
]

// --- COMPONENTS ---

import Box3DViewer from '@/components/dashboard/Box3DViewer'

// --- MAIN PAGE ---

const CatalogPage = () => {
  const [activeTab, setActiveTab] = useState('Box Sizes')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(true)
  const { results: optResults } = useOptimizationStore()

  const boxUsageCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    optResults.forEach(r => {
      if (r.optimized_box) counts[r.optimized_box] = (counts[r.optimized_box] || 0) + 1
    })
    return counts
  }, [optResults])
  
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const tabs = ['Box Sizes', 'Products', 'Templates']

  const currentItems = useMemo(() => {
    const base = activeTab === 'Box Sizes' ? BOX_TEMPLATES : activeTab === 'Products' ? PRODUCT_TEMPLATES : []
    return base.filter(item => item.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
  }, [activeTab, debouncedSearch])

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-24 px-4 md:px-0 relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Catalog</h1>
          <p className="text-gray-400 text-sm">Manage your packaging inventory and product catalog.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-[#0f0f1a] p-1 rounded-xl border border-white/[0.06] mr-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-[#4361EE] hover:bg-[#344FDA] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-[#4361EE]/20 flex items-center gap-2 transition-all">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="relative border-b border-white/[0.06]">
        <div className="flex gap-8">
          {tabs.map(tab => (
            <button 
              key={tab} 
              onClick={() => { setActiveTab(tab); setSelectedItem(null); }}
              className={`pb-4 text-sm font-bold transition-all relative ${activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4361EE]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Main Content */}
        <div className={selectedItem ? 'lg:col-span-8 space-y-6' : 'lg:col-span-12 space-y-6'}>
          
          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 group">
              <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#4361EE] transition-colors" />
              <input 
                type="text" 
                placeholder={`Search ${activeTab.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0f0f1a] border border-white/[0.06] rounded-xl pl-12 pr-6 py-3 text-sm text-white focus:outline-none focus:border-[#4361EE]/50 transition-all placeholder-gray-600"
              />
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-[#0f0f1a] border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-gray-400 hover:text-white transition-colors">
                <Filter className="w-3.5 h-3.5" /> Filter
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div 
                key="grid"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {loading ? (
                  [1,2,3,4,5,6].map(i => <SkeletonCard key={i} />)
                ) : (
                  currentItems.map((item, i) => (

                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedItem(item)}
                    className={`bg-[#0f0f1a] border rounded-[28px] p-6 shadow-xl cursor-pointer group transition-all relative overflow-hidden ${selectedItem?.id === item.id ? 'border-[#4361EE] ring-1 ring-[#4361EE]/20' : 'border-white/[0.06] hover:border-white/20'}`}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform ${activeTab === 'Box Sizes' ? 'text-amber-500' : 'text-blue-500'}`}>
                        {activeTab === 'Box Sizes' ? <Box className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                      </div>
                      <div className="flex gap-2">
                        {activeTab === 'Box Sizes' && boxUsageCounts[item.name] > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/20">
                            Frequent Fit
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/5 text-gray-500">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
                    <p className="text-xs text-gray-500 mb-6 flex items-center gap-2 font-mono">
                      <Ruler className="w-3 h-3" />
                      {item.length} x {item.width} x {item.height} {activeTab === 'Box Sizes' ? 'cm' : 'cm'}
                    </p>

                    <div className="space-y-3">
                       <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-600">
                         <span>Material</span>
                         <span className="text-gray-300">{item.material}</span>
                       </div>
                       {activeTab === 'Box Sizes' && (
                         <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-600">
                           <span>Usage</span>
                           <span className="text-green-400">{item.usage.toLocaleString()} orders</span>
                         </div>
                       )}
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                       <div className="flex gap-2">
                          <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button className="p-2 bg-white/5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                       </div>
                       <button className="bg-[#4361EE]/10 hover:bg-[#4361EE] text-[#4361EE] hover:text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                         Use in Order
                       </button>
                    </div>
                  </motion.div>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="list"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-[#0f0f1a] border border-white/[0.06] rounded-[24px] overflow-hidden"
              >
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-gray-500">Name</th>
                      <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-gray-500">Dimensions</th>
                      <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-gray-500">Material</th>
                      <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-gray-500">Category</th>
                      <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-gray-500">Usage</th>
                      <th className="px-6 py-4 text-right font-black uppercase tracking-widest text-[10px] text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item, i) => (
                      <tr 
                        key={item.id} 
                        onClick={() => setSelectedItem(item)}
                        className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors group cursor-pointer ${selectedItem?.id === item.id ? 'bg-[#4361EE]/5' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500">
                              {activeTab === 'Box Sizes' ? <Box className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                            </div>
                            <span className="font-bold text-white">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-400 font-mono text-xs">{item.length}x{item.width}x{item.height} cm</td>
                        <td className="px-6 py-4 text-gray-500">{item.material}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/5 text-gray-500">{item.category}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{item.usage?.toLocaleString() || '0'}</td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Preview Panel */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-4 h-fit sticky top-24"
            >
              <div className="bg-[#0f0f1a] border border-[#4361EE]/30 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                {/* Close Button */}
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white bg-white/5 rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-[#4361EE]/10 flex items-center justify-center text-[#4361EE]">
                    {activeTab === 'Box Sizes' ? <Box className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedItem.name}</h3>
                    <p className="text-xs text-gray-500">{selectedItem.supplier || selectedItem.category} Template</p>
                  </div>
                </div>

                <div className="h-64 mb-8">
                   <Box3DViewer l={selectedItem.length} w={selectedItem.width} h={selectedItem.height} />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                   <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Dimensions</p>
                      <p className="text-sm font-black text-white">{selectedItem.length}x{selectedItem.width}x{selectedItem.height} cm</p>
                   </div>
                   <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Unit Cost</p>
                      <p className="text-sm font-black text-[#00E5CC]">${selectedItem.cost?.toFixed(2) || '0.00'}</p>
                   </div>
                   <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Material</p>
                      <p className="text-sm font-bold text-gray-300">{selectedItem.material}</p>
                   </div>
                   <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">In Stock</p>
                      <p className={`text-sm font-bold ${selectedItem.inStock !== false ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedItem.inStock !== false ? 'Yes' : 'No'}
                      </p>
                   </div>
                </div>

                <div className="flex gap-3">
                   <button className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl text-sm font-bold border border-white/5 transition-all">
                     Edit Item
                   </button>
                   <button className="flex-1 bg-[#4361EE] hover:bg-[#344FDA] text-white py-3 rounded-xl text-sm font-bold shadow-xl shadow-[#4361EE]/20 transition-all">
                     Use Template
                   </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-[#0f0f1a] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#4361EE]/10 flex items-center justify-center text-[#4361EE]">
                       <Plus className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Add New Item</h2>
                      <p className="text-gray-500 text-sm">Define a new product or box size for your catalog</p>
                    </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:text-white bg-white/5 rounded-lg transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                   <div className="col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Item Name</label>
                      <input type="text" placeholder="e.g. Standard Medium Box" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4361EE]/50 transition-colors" />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Category</label>
                      <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4361EE]/50 appearance-none transition-colors">
                        <option>Standard</option>
                        <option>Electronics</option>
                        <option>Heavy Duty</option>
                        <option>Eco-Friendly</option>
                      </select>
                   </div>
                   <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Material</label>
                      <input type="text" placeholder="e.g. Corrugated" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#4361EE]/50 transition-colors" />
                   </div>
                   <div className="col-span-2 grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 block text-center">Length</label>
                        <input type="number" placeholder="L" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center focus:outline-none focus:border-[#4361EE]/50 transition-colors" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 block text-center">Width</label>
                        <input type="number" placeholder="W" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center focus:outline-none focus:border-[#4361EE]/50 transition-colors" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2 block text-center">Height</label>
                        <input type="number" placeholder="H" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center focus:outline-none focus:border-[#4361EE]/50 transition-colors" />
                      </div>
                   </div>
                </div>

                <div className="flex gap-4">
                   <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-bold transition-all">
                     Cancel
                   </button>
                   <button onClick={() => { setIsModalOpen(false); toast.success('Item added to catalog'); }} className="flex-1 bg-[#4361EE] hover:bg-[#344FDA] text-white py-4 rounded-2xl font-bold shadow-xl shadow-[#4361EE]/20 transition-all">
                     Save Item
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default memo(CatalogPage)
