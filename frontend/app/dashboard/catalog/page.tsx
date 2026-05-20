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

const FALLBACK_BOXES = [
  // 1. Extra Small Envelopes & Flap Mailers
  { id: 'mailer-xs1', name: 'Premium XS Flap Enveloper',  length_cm: 15.2, width_cm: 10.2, height_cm:  2.0, material: 'Kraft Paper', category: 'Mailer', supplier: 'EcoPack', cost_usd: 0.12 },
  { id: 'mailer-xs2', name: 'Document Kraft Envelope S',  length_cm: 18.0, width_cm: 12.0, height_cm:  2.0, material: 'Kraft Paper', category: 'Mailer', supplier: 'EcoPack', cost_usd: 0.15 },
  { id: 'mailer-xs3', name: 'Document Kraft Envelope M',  length_cm: 20.0, width_cm: 15.0, height_cm:  2.5, material: 'Kraft Paper', category: 'Mailer', supplier: 'EcoPack', cost_usd: 0.18 },
  
  // 2. Small Envelopes & Bubble Mailers
  { id: 'mailer-sm1', name: 'Eco-Bubble Mailer S',        length_cm: 22.0, width_cm: 16.0, height_cm:  3.0, material: 'Compostable', category: 'Mailer', supplier: 'EcoPack', cost_usd: 0.22 },
  { id: 'mailer-sm2', name: 'Eco-Bubble Mailer M',        length_cm: 25.0, width_cm: 18.0, height_cm:  3.5, material: 'Compostable', category: 'Mailer', supplier: 'EcoPack', cost_usd: 0.26 },
  { id: 'mailer-sm3', name: 'Eco-Bubble Mailer L',        length_cm: 28.0, width_cm: 20.0, height_cm:  4.0, material: 'Compostable', category: 'Mailer', supplier: 'EcoPack', cost_usd: 0.30 },

  // 3. USPS / FedEx Standard Small Boxes
  { id: 'usps-sm',    name: 'USPS Small Flat Rate Box',   length_cm: 21.9, width_cm: 14.3, height_cm:  4.8, material: 'Corrugated', category: 'Standard', supplier: 'USPS', cost_usd: 0.35 },
  { id: 'box-xs-cub', name: 'Micro Cube Box XS',          length_cm: 10.0, width_cm: 10.0, height_cm: 10.0, material: 'Corrugated', category: 'Standard', supplier: 'Generic', cost_usd: 0.25 },
  { id: 'box-sm-cub', name: 'Mini Cube Box S',            length_cm: 15.0, width_cm: 15.0, height_cm: 15.0, material: 'Corrugated', category: 'Standard', supplier: 'Generic', cost_usd: 0.32 },
  { id: 'box-s1',     name: 'Courier Box S1',             length_cm: 20.0, width_cm: 15.0, height_cm: 10.0, material: 'Corrugated', category: 'Standard', supplier: 'Courier', cost_usd: 0.38 },
  { id: 'box-s2',     name: 'Courier Box S2',             length_cm: 20.0, width_cm: 20.0, height_cm: 15.0, material: 'Corrugated', category: 'Standard', supplier: 'Courier', cost_usd: 0.44 },

  // 4. Medium Boxes & Packing Cartons
  { id: 'box-m1',     name: 'Fulfillment Box M1',         length_cm: 25.0, width_cm: 20.0, height_cm: 15.0, material: 'Corrugated', category: 'Standard', supplier: 'FulfillCo', cost_usd: 0.48 },
  { id: 'box-m2',     name: 'Fulfillment Box M2',         length_cm: 30.0, width_cm: 20.0, height_cm: 15.0, material: 'Corrugated', category: 'Standard', supplier: 'FulfillCo', cost_usd: 0.55 },
  { id: 'box-m3',     name: 'Fulfillment Box M3',         length_cm: 30.0, width_cm: 25.0, height_cm: 20.0, material: 'Corrugated', category: 'Standard', supplier: 'FulfillCo', cost_usd: 0.62 },
  { id: 'box-md-cub', name: 'Standard Cube Box M1',       length_cm: 20.0, width_cm: 20.0, height_cm: 20.0, material: 'Corrugated', category: 'Standard', supplier: 'Generic', cost_usd: 0.46 },
  { id: 'box-md-cu2', name: 'Standard Cube Box M2',       length_cm: 25.0, width_cm: 25.0, height_cm: 25.0, material: 'Corrugated', category: 'Standard', supplier: 'Generic', cost_usd: 0.58 },
  { id: 'usps-md1',   name: 'USPS Medium Flat Rate 1',    length_cm: 28.0, width_cm: 22.0, height_cm: 15.0, material: 'Corrugated', category: 'Standard', supplier: 'USPS', cost_usd: 0.60 },
  { id: 'usps-md2',   name: 'USPS Medium Flat Rate 2',    length_cm: 35.0, width_cm: 30.0, height_cm: 12.0, material: 'Corrugated', category: 'Standard', supplier: 'USPS', cost_usd: 0.68 },

  // 5. Large Carton Boxes
  { id: 'box-l1',     name: 'Enterprise Box L1',          length_cm: 35.0, width_cm: 25.0, height_cm: 20.0, material: 'Corrugated', category: 'Standard', supplier: 'Generic', cost_usd: 0.72 },
  { id: 'box-l2',     name: 'Enterprise Box L2',          length_cm: 35.0, width_cm: 30.0, height_cm: 25.0, material: 'Corrugated', category: 'Standard', supplier: 'Generic', cost_usd: 0.80 },
  { id: 'box-l3',     name: 'Enterprise Box L3',          length_cm: 40.0, width_cm: 30.0, height_cm: 20.0, material: 'Corrugated', category: 'Standard', supplier: 'Generic', cost_usd: 0.88 },
  { id: 'box-lg-cub', name: 'Master Cube Box L',          length_cm: 30.0, width_cm: 30.0, height_cm: 30.0, material: 'Corrugated', category: 'Standard', supplier: 'Generic', cost_usd: 0.78 },
  { id: 'usps-lg',    name: 'USPS Large Flat Rate Box',   length_cm: 31.0, width_cm: 31.0, height_cm: 14.0, material: 'Corrugated', category: 'Standard', supplier: 'USPS', cost_usd: 0.75 },
  { id: 'fedex-lg',   name: 'FedEx Standard Large Box',   length_cm: 45.0, width_cm: 35.0, height_cm: 25.0, material: 'Corrugated', category: 'Standard', supplier: 'FedEx', cost_usd: 1.05 },

  // 6. Extra Large & Heavy Duty Double-Wall Cartons
  { id: 'box-xl1',    name: 'Master Box XL1',             length_cm: 45.0, width_cm: 40.0, height_cm: 30.0, material: 'Corrugated', category: 'Standard', supplier: 'Generic', cost_usd: 1.25 },
  { id: 'box-xl2',    name: 'Master Box XL2',             length_cm: 50.0, width_cm: 40.0, height_cm: 30.0, material: 'Corrugated', category: 'Standard', supplier: 'Generic', cost_usd: 1.45 },
  { id: 'box-xl-cub', name: 'Industrial Cube Box XL',     length_cm: 40.0, width_cm: 40.0, height_cm: 40.0, material: 'Corrugated', category: 'Standard', supplier: 'Generic', cost_usd: 1.38 },
  { id: 'dw-hd1',     name: 'Heavy Duty DW Double-Wall S',length_cm: 30.0, width_cm: 25.0, height_cm: 20.0, material: 'Double Wall', category: 'Heavy Duty', supplier: 'Generic', cost_usd: 1.10 },
  { id: 'dw-hd2',     name: 'Heavy Duty DW Double-Wall M',length_cm: 40.0, width_cm: 40.0, height_cm: 30.0, material: 'Double Wall', category: 'Heavy Duty', supplier: 'Generic', cost_usd: 1.65 },
  { id: 'dw-hd3',     name: 'Heavy Duty DW Double-Wall L',length_cm: 50.0, width_cm: 50.0, height_cm: 40.0, material: 'Double Wall', category: 'Heavy Duty', supplier: 'Generic', cost_usd: 2.25 },
]

export default function CatalogPage() {
  const supabase = useMemo(() => createClient(), [])
  const [activeTab, setActiveTab] = useState('Box Sizes')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [boxes, setBoxes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBoxes() {
      const { data, error } = await supabase.from('box_catalog').select('*')
      if (data && data.length > 0) {
        setBoxes(data)
      } else {
        setBoxes(FALLBACK_BOXES)
      }
      setLoading(false)
    }
    fetchBoxes()
  }, [supabase])

  const filteredItems = useMemo(() => {
    return boxes.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery, boxes])

  const handleSeedCatalog = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/box-catalog/seed', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to seed catalog')
      const data = await res.json()
      if (data.inserted) {
        toast.success(`Successfully added ${data.inserted} standard boxes to your catalog!`)
        // Refresh boxes
        const { data: newBoxes } = await supabase.from('box_catalog').select('*')
        if (newBoxes) setBoxes(newBoxes)
      } else if (data.message) {
        toast.info(data.message)
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[1200px] w-full mx-auto space-y-6 pb-20 px-4 md:px-0">
      
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
          <button onClick={handleSeedCatalog} disabled={loading} className="bg-white/5 border border-white/10 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50">
            Seed Standard Boxes
          </button>
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

          {loading ? (
            <div className="text-center py-20 text-gray-500">Loading catalog...</div>
          ) : (
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
                    <span className="px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/5 text-gray-500">{item.category || 'Standard'}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">{item.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mb-6">
                    <Ruler className="w-3.5 h-3.5" />
                    {item.length_cm}x{item.width_cm}x{item.height_cm} cm
                  </div>

                  <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                    <span className="text-sm font-black text-[#00FFD1]">${(item.cost_usd || 0).toFixed(2)}</span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="lg:col-span-4 sticky top-6">
              <div className="glass p-8 rounded-[40px] relative">
                <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 p-2 text-gray-600 hover:text-white bg-white/5 rounded-full"><X className="w-4 h-4" /></button>
                
                <h3 className="text-xl font-bold text-white mb-6">Template Preview</h3>
                <div className="h-64 mb-8 bg-black/20 rounded-3xl overflow-hidden border border-white/5 flex items-center justify-center">
                  <Box3DViewer l={selectedItem.length_cm} w={selectedItem.width_cm} h={selectedItem.height_cm} />
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Material</span>
                    <span className="text-sm font-bold text-white">{selectedItem.material || 'Corrugated'}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Supplier</span>
                    <span className="text-sm font-bold text-white">{selectedItem.supplier || 'Generic'}</span>
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
