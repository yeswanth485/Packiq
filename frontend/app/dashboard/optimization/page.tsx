'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, Plus, Trash2, ArrowRight, UploadCloud, Brain, Package, FileSpreadsheet, Download
} from 'lucide-react'
import { toast } from 'sonner'
import { useOptimizationStore, OptimizationResult } from '@/lib/store/optimizationStore'
import Box3DViewer from '@/components/dashboard/Box3DViewer'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

const ECOMMERCE_BOXES = [
  { name: 'Amazon A1', l: 15, w: 10, h: 8, cost: 0.45 },
  { name: 'Amazon A3', l: 30, w: 22, h: 12, cost: 0.85 },
  { name: 'Flipkart F1', l: 18, w: 12, h: 12, cost: 0.35 },
  { name: 'Zepto Cube', l: 25, w: 15, h: 20, cost: 0.50 }
]

export default function OptimizationPage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setResults, setRunning } = useOptimizationStore()

  const simulateOptimization = (data: any[]): OptimizationResult[] => {
    return data.map((row, index) => {
      const productPrice = parseFloat(row.price || row['Product Price'] || '100')
      const weight = parseFloat(row.weight || row['Product Weight'] || '1.5')
      const dims = (row.dims || row['Product Dimensions'] || '10x10x10').split('x').map(Number)
      const l = dims[0] || 10, w = dims[1] || 10, h = dims[2] || 10
      
      // Simple logic: find a box that fits the dims
      const originalBox = ECOMMERCE_BOXES[1] // Default to a larger box
      const optimizedBox = ECOMMERCE_BOXES.find(b => b.l >= l && b.w >= w && b.h >= h) || ECOMMERCE_BOXES[1]
      
      const originalBoxCost = originalBox.cost
      const optimizedBoxCost = optimizedBox.cost
      const savings = originalBoxCost - optimizedBoxCost
      
      return {
        product_id: row.sku || row['SKU'] || `SKU-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        product_name: row.name || row['Product Name'] || 'Generic Product',
        product_price: productPrice,
        product_dims: `${l}x${w}x${h}`,
        product_weight: weight,
        original_box: originalBox.name,
        original_box_cost: originalBoxCost,
        optimized_box: optimizedBox.name,
        optimized_box_cost: optimizedBoxCost,
        cost_before: productPrice + originalBoxCost + 5.0, // base shipping
        cost_after: productPrice + optimizedBoxCost + 5.0,
        savings: Math.max(0, savings),
        void_reduction: Math.floor(Math.random() * 30) + 10,
        status: 'success'
      }
    })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    const extension = file.name.split('.').pop()?.toLowerCase()

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processData(results.data)
        }
      })
    } else if (extension === 'xlsx' || extension === 'xls') {
      reader.onload = (evt) => {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)
        processData(data)
      }
      reader.readAsBinaryString(file)
    } else {
      toast.error('Unsupported file format. Please use CSV or Excel.')
    }
  }

  const processData = async (data: any[]) => {
    setIsOptimizing(true)
    setRunning()
    toast.info(`Processing ${data.length} items...`)
    
    // Simulate AI processing delay
    await new Promise(r => setTimeout(r, 2000))
    
    const results = simulateOptimization(data)
    setResults(results, [])
    setIsOptimizing(false)
    toast.success('Bulk optimization complete! Check Shipments for details.')
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">AI Optimization</h1>
          <p className="text-gray-500 text-sm font-medium">Standardize packaging for Amazon, Flipkart, and Zepto.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="glass p-8 rounded-3xl">
            <div className="flex gap-4 p-1 bg-white/[0.03] border border-white/5 rounded-2xl w-fit mb-8">
              {['manual', 'bulk'].map((tab) => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#00FFD1] text-[#0A0A0F]' : 'text-gray-500 hover:text-white'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'manual' ? (
                <motion.div key="manual" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Single Entry</h3>
                    <button className="text-[10px] font-black text-[#00FFD1] uppercase tracking-widest flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add Row
                    </button>
                  </div>
                  {[1].map((i) => (
                    <div key={i} className="flex gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-[#00FFD1]/30 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                        <div className="col-span-2">
                          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Product Name</p>
                          <input type="text" placeholder="e.g. iPhone 15 Pro" className="bg-transparent border-none p-0 text-white text-sm focus:ring-0 w-full placeholder-gray-800" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Price ($)</p>
                          <input type="number" placeholder="999" className="bg-transparent border-none p-0 text-white text-sm focus:ring-0 w-full placeholder-gray-800" />
                        </div>
                        <div className="flex justify-end">
                          <button className="p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div key="bulk" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-white/10 rounded-[32px] p-12 text-center hover:border-[#00FFD1]/50 hover:bg-[#00FFD1]/5 transition-all cursor-pointer group"
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.xlsx,.xls" className="hidden" />
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-8 h-8 text-[#00FFD1]" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Upload Inventory Sheet</h3>
                    <p className="text-gray-500 text-xs mb-8">Supports CSV, XLSX for Amazon, Flipkart, Zepto standards.</p>
                    <div className="flex justify-center gap-4">
                       <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400">SKU</span>
                       <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400">Dimensions</span>
                       <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400">Price</span>
                    </div>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-gray-500" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Download Template</span>
                    </div>
                    <Download className="w-4 h-4 text-gray-600 cursor-pointer hover:text-white" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="glass p-8 rounded-3xl h-full flex flex-col">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#00FFD1]" /> Model Preview
            </h3>
            
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <div className="w-full h-64 mb-8 bg-black/20 rounded-3xl border border-white/5 overflow-hidden">
                <Box3DViewer l={20} w={20} h={15} />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
                360° Real-time spatial analysis for optimized volumetric yield.
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-gray-600">Model Stability</span>
                <span className="text-[#00FFD1]">High (99.4%)</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '99%' }} className="h-full bg-[#00FFD1]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

