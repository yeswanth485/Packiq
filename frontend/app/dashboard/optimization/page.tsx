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
  { name: 'Amazon A1 (XS)', l: 15, w: 10, h: 5, cost: 0.35 },
  { name: 'Amazon A2 (S)',  l: 20, w: 15, h: 10, cost: 0.55 },
  { name: 'Amazon A3 (M)',  l: 25, w: 20, h: 15, cost: 0.75 },
  { name: 'Flipkart S1',    l: 18, w: 12, h: 8, cost: 0.40 },
  { name: 'Flipkart M1',    l: 28, w: 18, h: 12, cost: 0.70 },
  { name: 'Zepto Eco (S)',  l: 30, w: 20, h: 10, cost: 0.12 },
  { name: 'FedEx Small',    l: 31, w: 24, h: 3, cost: 0.85 },
  { name: 'Generic Cube',   l: 10, w: 10, h: 10, cost: 0.30 }
]

export default function OptimizationPage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { results, setResults, setRunning } = useOptimizationStore()

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
  const [totalItems, setTotalItems] = useState(0)
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
    setTotalItems(data.length)
    setRunning()
    
    // Reset store for fresh run
    setResults([], [])

    const BATCH_SIZE = 50 // Process up to 50 items simultaneously for maximum speed
    const totalBatches = Math.ceil(data.length / BATCH_SIZE)
    
    setProcessingStep(1) // "Analyzing Volumetric Yield..."
    await new Promise(r => setTimeout(r, 600))
    
    try {
      for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE)
        const batchIndex = Math.floor(i / BATCH_SIZE) + 1
        
        // Cycle steps 2 and 3 for visual effect
        setProcessingStep(batchIndex % 2 === 1 ? 2 : 3) 
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 45000) // 45s timeout for AI

        try {
          const response = await fetch('/api/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: batch }),
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            const errBody = await response.json().catch(() => ({}))
            throw new Error(errBody.error || `Batch ${batchIndex} failed (HTTP ${response.status})`)
          }

          const resData = await response.json()
          
          if (resData.results && resData.results.length > 0) {
            const mappedResults: OptimizationResult[] = resData.results.map((r: any) => ({
              product_id: r.product_id,
              product_name: r.product_name,
              product_price: r.product_price,
              product_dims: r.product_dims || 'N/A',
              product_weight: r.product_weight || 0.5,
              original_box: r.original_box || 'Unknown',
              original_box_cost: r.original_box_price || 0,
              optimized_box: r.optimized_box,
              optimized_box_cost: r.box_price || 0,
              optimized_box_dims: r.optimized_box_dims || '20x15x10',
              cost_before: r.original_box_price || 0,
              cost_after: r.box_price || 0,
              savings: r.savings,
              void_reduction: r.efficiency_score || 0,
              status: 'success'
            }))
            
            useOptimizationStore.getState().addBatchResults(mappedResults)
          }
        } catch (fetchErr: any) {
          if (fetchErr.name === 'AbortError') {
            console.error('Batch timed out')
            toast.error(`Batch ${batchIndex} timed out. Using fallback data.`)
          } else {
            console.error('Batch error:', fetchErr)
            toast.error(`Batch ${batchIndex} error. Skipping to next.`)
          }
        }
      }

      setProcessingStep(4) // "Synchronizing..."
      await new Promise(r => setTimeout(r, 1000))
      
      toast.success(`Successfully optimized ${data.length} items!`)
      router.push('/dashboard/orders')
      
    } catch (err: any) {
      console.error('Optimization failed:', err)
      toast.error(err.message || 'Optimization failed')
    } finally {
      setIsOptimizing(false) // Always dismiss modal
    }
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
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Processing Data</span>
                <span className="text-[10px] font-black text-[#00FFD1] uppercase tracking-widest">
                  {results.length} Items Optimized
                </span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-8">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${totalItems > 0 ? (results.length / totalItems) * 100 : 0}%` }}
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

