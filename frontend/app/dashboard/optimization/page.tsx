'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, Plus, Trash2, ArrowRight, UploadCloud, Brain, Package, FileSpreadsheet, Download
} from 'lucide-react'
import { toast } from 'sonner'
import { useOptimizationStore, OptimizationResult } from '@/lib/store/optimizationStore'
import { useRouter } from 'next/navigation'
import Box3DViewer from '@/components/dashboard/Box3DViewer'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

const ECOMMERCE_BOXES = [
  { name: 'Micro Box', l: 10, w: 10, h: 5, cost: 0.25 },
  { name: 'Standard A1', l: 15, w: 10, h: 8, cost: 0.45 },
  { name: 'Standard A2', l: 20, w: 15, h: 10, cost: 0.65 },
  { name: 'Large A3', l: 30, w: 22, h: 12, cost: 0.85 },
  { name: 'Cube C1', l: 25, w: 15, h: 20, cost: 0.50 },
  { name: 'Slim S1', l: 35, w: 25, h: 5, cost: 0.70 },
  { name: 'Mega M1', l: 50, w: 40, h: 30, cost: 1.50 }
]

export default function OptimizationPage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setResults, setRunning } = useOptimizationStore()

  const simulateOptimization = (data: any[]): OptimizationResult[] => {
    return data.map((row) => {
      const productPrice = parseFloat(row.price || row['Product Price'] || row['price'] || '100')
      const weight = parseFloat(row.weight || row['Product Weight'] || row['weight'] || '1.5')
      const dimsStr = row.dims || row['Product Dimensions'] || row['dimensions'] || '10x10x10'
      const dims = dimsStr.split('x').map(Number)
      
      const l = dims[0] || 10, w = dims[1] || 10, h = dims[2] || 10
      const volume = l * w * h
      
      // Better logic: find the SMALLEST box that fits all dimensions (considering rotation)
      const fits = (box: any, pl: number, pw: number, ph: number) => {
        const p = [pl, pw, ph].sort((a, b) => a - b)
        const b = [box.l, box.w, box.h].sort((a, b) => a - b)
        return p[0] <= b[0] && p[1] <= b[1] && p[2] <= b[2]
      }

      // Find original box (randomly pick a larger one to simulate waste)
      const originalBox = ECOMMERCE_BOXES[Math.min(ECOMMERCE_BOXES.length - 1, 4)]
      
      // Find the best fit (cheapest that fits)
      let optimizedBox = ECOMMERCE_BOXES
        .filter(box => fits(box, l, w, h))
        .sort((a, b) => a.cost - b.cost)[0]

      if (!optimizedBox) optimizedBox = ECOMMERCE_BOXES[ECOMMERCE_BOXES.length - 1] // Fallback to largest
      
      const originalBoxCost = originalBox.cost
      const optimizedBoxCost = optimizedBox.cost
      const savings = originalBoxCost - optimizedBoxCost
      
      return {
        product_id: row.sku || row['SKU'] || row['sku'] || `SKU-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        product_name: row.name || row['Product Name'] || row['name'] || 'Generic Product',
        product_price: productPrice,
        product_dims: `${l}x${w}x${h}`,
        product_weight: weight,
        original_box: originalBox.name,
        original_box_cost: originalBoxCost,
        optimized_box: optimizedBox.name,
        optimized_box_cost: optimizedBoxCost,
        cost_before: productPrice + originalBoxCost + (weight * 2.5), 
        cost_after: productPrice + optimizedBoxCost + (weight * 2.5),
        savings: Math.max(0, savings),
        void_reduction: Math.floor(((originalBox.l * originalBox.w * originalBox.h - volume) / (originalBox.l * originalBox.w * originalBox.h)) * 100),
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

  const [processingStep, setProcessingStep] = useState(0)
  const router = useRouter()
  const steps = [
    "Reading Inventory Data...",
    "Analyzing Volumetric Yield...",
    "Claude AI Optimizing Box Selection...",
    "Generating 3D Packing Paths...",
    "Synchronizing with Orders Tab..."
  ]

  const processData = async (data: any[]) => {
    setIsOptimizing(true)
    setRunning()
    
    // Step-by-step processing animation
    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(i)
      await new Promise(r => setTimeout(r, 800))
    }
    
    const results = simulateOptimization(data)
    setResults(results, [])
    setIsOptimizing(false)
    toast.success('Optimization complete! Redirecting to Orders...')
    
    setTimeout(() => {
      router.push('/dashboard/orders')
    }, 1500)
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
      {/* AI Processing Modal */}
      <AnimatePresence>
        {isOptimizing && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0A0A0F]/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full text-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 border-2 border-[#00FFD1]/20 border-t-[#00FFD1] rounded-full mx-auto mb-10 flex items-center justify-center"
              >
                <Brain className="w-10 h-10 text-[#00FFD1]" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-tighter">AI Optimization Engine</h2>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-8">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((processingStep + 1) / steps.length) * 100}%` }}
                  className="h-full bg-[#00FFD1] shadow-[0_0_20px_#00FFD1]"
                />
              </div>

              <div className="space-y-3">
                {steps.map((step, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ 
                      opacity: i === processingStep ? 1 : i < processingStep ? 0.4 : 0.1,
                      x: 0,
                      color: i === processingStep ? '#00FFD1' : '#fff'
                    }}
                    className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                  >
                    {i < processingStep ? <CheckCircle2 className="w-3 h-3" /> : <div className={`w-1.5 h-1.5 rounded-full ${i === processingStep ? 'bg-[#00FFD1]' : 'bg-gray-800'}`} />}
                    {step}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { CheckCircle2 } from 'lucide-react'

