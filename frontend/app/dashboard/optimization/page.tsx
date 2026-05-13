'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, Plus, Trash2, ArrowRight, UploadCloud, Brain, Package, FileSpreadsheet, Download,
  CheckCircle2, AlertTriangle, ShieldCheck, TrendingDown, Info
} from 'lucide-react'
import { toast } from 'sonner'
import { useOptimizationStore, OptimizationResult } from '@/lib/store/optimizationStore'
import { useRouter } from 'next/navigation'
import Box3DViewer from '@/components/dashboard/Box3DViewer'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export default function OptimizationPage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { results, setResults, setRunning, addBatchResults } = useOptimizationStore()
  const router = useRouter()

  // Manual Entry State
  const [manualInput, setManualInput] = useState({
    productName: '',
    sku: '',
    category: 'general',
    l: '', w: '', h: '',
    weight: '0.5',
    fragility: 'low',
    quantity: '1',
    zone: '2',
    shippingMethod: 'standard',
    currentBox: '',
    currentBoxCost: ''
  })
  const [manualResult, setManualResult] = useState<OptimizationResult | null>(null)
  const [summaryReport, setSummaryReport] = useState<any>(null)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)

  const [processingStep, setProcessingStep] = useState(0)
  const [totalItems, setTotalItems] = useState(0)

  const steps = [
    "Validating product dimensions...",
    "Generating box candidates...",
    "Scoring fit, cost, and risk...",
    "Selecting optimal box...",
    "Calculating savings vs. baseline..."
  ]

  const handleManualOptimize = async () => {
    if (!manualInput.productName || !manualInput.l || !manualInput.w || !manualInput.h) {
      toast.error('Please fill in product name and dimensions.')
      return
    }

    setIsOptimizing(true)
    setTotalItems(1)
    setRunning()
    setManualResult(null)

    // Simulate steps for UI
    for (let i = 0; i < 4; i++) {
      setProcessingStep(i)
      await new Promise(r => setTimeout(r, 600))
    }

    try {
      const payload = [{
        product_name: manualInput.productName,
        sku: manualInput.sku,
        category: manualInput.category,
        'product L*W*H': `${manualInput.l}x${manualInput.w}x${manualInput.h}`,
        weight_kg: parseFloat(manualInput.weight),
        fragility: manualInput.fragility,
        quantity: parseInt(manualInput.quantity, 10),
        zone: parseInt(manualInput.zone, 10),
        shipping_method: manualInput.shippingMethod,
        'box L*W*H': manualInput.currentBox,
        box_price: manualInput.currentBoxCost ? parseFloat(manualInput.currentBoxCost) : undefined
      }]

      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: payload })
      })

      const data = await res.json()

      if (!res.ok || data.error) throw new Error(data.error || 'Failed to optimize')

      if (data.results && data.results[0] && data.results[0].status !== 'error') {
        const result = data.results[0] as OptimizationResult
        setManualResult(result)
        addBatchResults([result])
        setProcessingStep(4)
        toast.success('Optimization complete!')
      } else {
        throw new Error(data.results?.[0]?.error || 'Unknown error occurred')
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    const reader = new FileReader()

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: (res) => processBulkData(res.data)
      })
    } else if (extension === 'xlsx' || extension === 'xls') {
      reader.onload = (evt) => {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        processBulkData(XLSX.utils.sheet_to_json(ws))
      }
      reader.readAsBinaryString(file)
    } else {
      toast.error('Unsupported file format. Please use CSV or Excel.')
    }
  }

  const processBulkData = async (data: any[]) => {
    setIsOptimizing(true)
    setTotalItems(data.length)
    setRunning()
    setResults([], [])

    const BATCH_SIZE = 10 // Balanced for speed and reliability
    setProcessingStep(0)
    await new Promise(r => setTimeout(r, 600))

    const allResults: any[] = []
    try {
      for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE)
        setProcessingStep(i % 2 === 0 ? 1 : 2)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 45000)

        try {
          const res = await fetch('/api/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: batch }),
            signal: controller.signal
          })
          clearTimeout(timeoutId)
          
          if (!res.ok) throw new Error(`Batch failed (HTTP ${res.status})`)
          const resData = await res.json()
          
          if (resData.results) {
            const batchResults = resData.results.map((r: any) => ({
              ...r,
              status: r.status || 'success'
            }))
            addBatchResults(batchResults)
            allResults.push(...batchResults)
          }
        } catch (err) {
          console.error('Batch error:', err)
          toast.error(`Batch error. Including items with error status.`)
          // Add items as errors so they aren't lost from the manifest
          const errorResults = batch.map((p: any) => ({
            product_id: p.product_id || p.sku || 'unknown',
            product_name: p.product_name || p.name || 'Unknown',
            status: 'error',
            error: 'Batch processing failed',
            savings: 0,
            total_cost: 0,
            baseline_cost: 0,
            damage_risk: 'Low',
            optimized_box: 'Error',
            original_box: p['box_L*W*H_cm'] || p['box L*W*H'] || 'Unknown'
          }))
          addBatchResults(errorResults as any)
          allResults.push(...errorResults)
        }
      }
      setProcessingStep(4)
      await new Promise(r => setTimeout(r, 1000))
      toast.success(`Successfully optimized ${allResults.length} items!`)
      
      // Auto-generate summary and then navigate immediately
      await handleGenerateSummary(allResults)
      await new Promise(r => setTimeout(r, 500))
      router.push('/dashboard/orders')
    } catch (err: any) {
      toast.error('Optimization failed')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleGenerateSummary = async (optimizationResults: any[]) => {
    setIsGeneratingSummary(true)
    try {
      const res = await fetch('/api/optimize/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: optimizationResults, shipmentsPerMonth: 1000 })
      })
      const data = await res.json()
      if (data.success) {
        setSummaryReport(data.summary)
      }
    } catch (err) {
      console.error('Failed to generate summary', err)
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">AI Optimization</h1>
          <p className="text-gray-500 text-sm font-medium">Standardize packaging and minimize shipping costs.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column - Input */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass p-8 rounded-3xl">
            <div className="flex gap-4 p-1 bg-white/[0.03] border border-white/5 rounded-2xl w-fit mb-8">
              {['manual', 'bulk'].map((tab) => (
                <button 
                  key={tab} 
                  onClick={() => { setActiveTab(tab as any); setManualResult(null); }}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#00FFD1] text-[#0A0A0F]' : 'text-gray-500 hover:text-white'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'manual' ? (
                <motion.div key="manual" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  {/* Product Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Product Name</label>
                      <input type="text" value={manualInput.productName} onChange={e => setManualInput(s => ({...s, productName: e.target.value}))} placeholder="e.g. iPhone 15 Pro" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#00FFD1] transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">SKU / ID</label>
                      <input type="text" value={manualInput.sku} onChange={e => setManualInput(s => ({...s, sku: e.target.value}))} placeholder="IPH-15P-256" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#00FFD1] transition-all" />
                    </div>
                  </div>

                  {/* Dimensions & Weight */}
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Length (cm)</label>
                      <input type="number" value={manualInput.l} onChange={e => setManualInput(s => ({...s, l: e.target.value}))} placeholder="L" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#00FFD1] transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Width (cm)</label>
                      <input type="number" value={manualInput.w} onChange={e => setManualInput(s => ({...s, w: e.target.value}))} placeholder="W" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#00FFD1] transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Height (cm)</label>
                      <input type="number" value={manualInput.h} onChange={e => setManualInput(s => ({...s, h: e.target.value}))} placeholder="H" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#00FFD1] transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Weight (kg)</label>
                      <input type="number" value={manualInput.weight} onChange={e => setManualInput(s => ({...s, weight: e.target.value}))} placeholder="0.5" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#00FFD1] transition-all" />
                    </div>
                  </div>

                  {/* Logistics Parameters */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Fragility</label>
                      <select value={manualInput.fragility} onChange={e => setManualInput(s => ({...s, fragility: e.target.value}))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#00FFD1] transition-all [&>option]:bg-[#0A0A0F]">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="extreme">Extreme</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Zone (1-6)</label>
                      <select value={manualInput.zone} onChange={e => setManualInput(s => ({...s, zone: e.target.value}))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#00FFD1] transition-all [&>option]:bg-[#0A0A0F]">
                        {[1,2,3,4,5,6].map(z => <option key={z} value={z}>Zone {z}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Method</label>
                      <select value={manualInput.shippingMethod} onChange={e => setManualInput(s => ({...s, shippingMethod: e.target.value}))} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#00FFD1] transition-all [&>option]:bg-[#0A0A0F]">
                        <option value="standard">Standard</option>
                        <option value="express">Express</option>
                        <option value="same-day">Same-Day</option>
                      </select>
                    </div>
                  </div>

                  {/* Baseline Context */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Current Box (Optional)</label>
                      <input type="text" value={manualInput.currentBox} onChange={e => setManualInput(s => ({...s, currentBox: e.target.value}))} placeholder="e.g. 25x20x15" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#00FFD1] transition-all" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Current Box Cost ($)</label>
                      <input type="number" value={manualInput.currentBoxCost} onChange={e => setManualInput(s => ({...s, currentBoxCost: e.target.value}))} placeholder="0.00" className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#00FFD1] transition-all" />
                    </div>
                  </div>

                  <button 
                    onClick={handleManualOptimize}
                    className="w-full bg-[#00FFD1] text-[#0A0A0F] py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,209,0.2)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    <Brain className="w-4 h-4" /> Run AI Optimization
                  </button>

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
                    <p className="text-gray-500 text-xs mb-8">Includes dims, weight, fragility, and zone for bulk processing.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column - Results / Preview */}
        <div className="lg:col-span-5">
          <div className="glass p-6 md:p-8 rounded-3xl h-full flex flex-col">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#00FFD1]" /> Optimization Result
            </h3>
            
            {!manualResult ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                <Package className="w-16 h-16 mb-4 text-gray-600" />
                <p className="text-xs text-gray-400 font-medium">Run optimization to see detailed recommendations, cost breakdowns, and 3D preview.</p>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 space-y-6">
                
                {/* 3D Preview */}
                <div className="w-full h-48 bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
                  <Box3DViewer 
                    l={parseFloat(manualResult.optimized_box_dims?.split(/[xX*]/)[0]) || 20} 
                    w={parseFloat(manualResult.optimized_box_dims?.split(/[xX*]/)[1]) || 15} 
                    h={parseFloat(manualResult.optimized_box_dims?.split(/[xX*]/)[2]) || 10} 
                  />
                </div>

                {/* Primary Recommendation */}
                <div className="p-4 bg-[#00FFD1]/10 border border-[#00FFD1]/20 rounded-2xl flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[10px] font-black text-[#00FFD1] uppercase tracking-widest">Recommended Box</p>
                      {manualResult.optimization_status === 'improved' && (
                        <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[8px] font-black rounded-md border border-green-500/30 uppercase tracking-tighter">Improved</span>
                      )}
                    </div>
                    <p className="text-lg font-bold text-white">{manualResult.optimized_box}</p>
                    <p className="text-xs text-gray-400 mt-1">{manualResult.optimized_box_dims} • {manualResult.packaging_material}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Confidence</p>
                    <p className="text-xl font-black text-white">{manualResult.confidence_score}%</p>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Damage Risk</p>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`w-4 h-4 ${manualResult.damage_risk === 'Low' ? 'text-green-400' : manualResult.damage_risk === 'Medium' ? 'text-yellow-400' : 'text-red-400'}`} />
                      <span className="text-sm font-bold text-white">{manualResult.damage_risk}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Efficiency Boost</p>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-[#00FFD1]" />
                      <span className="text-sm font-bold text-white">{manualResult.space_utilization}% <span className="text-[10px] text-gray-500 ml-1 font-normal">Utilization</span></span>
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Cost Breakdown</h4>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Packaging (Box+Filler)</span>
                    <span className="font-mono text-white">${manualResult.packaging_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Shipping (Zone+Dim)</span>
                    <span className="font-mono text-white">${manualResult.shipping_cost.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-white/5">
                    <span className="text-white">Optimized Total</span>
                    <span className="font-mono text-[#00FFD1]">${manualResult.total_cost.toFixed(2)}</span>
                  </div>
                  
                  {manualResult.baseline_cost > 0 && (
                    <div className="flex justify-between items-center mt-2 p-2 bg-green-500/10 rounded-lg">
                      <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" /> Savings
                      </span>
                      <div className="text-right">
                        <span className="font-mono text-green-400 font-bold">${manualResult.savings.toFixed(2)}</span>
                        <span className="text-[10px] text-green-500/70 ml-1">({manualResult.savings_percent.toFixed(1)}%)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Reasoning */}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl relative overflow-hidden">
                  <Brain className="absolute -right-4 -bottom-4 w-16 h-16 text-white/5" />
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1"><Info className="w-3 h-3"/> AI Reasoning</p>
                  <p className="text-xs text-gray-300 leading-relaxed relative z-10">{manualResult.reasoning}</p>
                </div>

              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Processing Modal */}
      <AnimatePresence>
        {isOptimizing && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0A0A0F]/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="w-24 h-24 border-2 border-[#00FFD1]/20 border-t-[#00FFD1] rounded-full mx-auto mb-10 flex items-center justify-center">
                <Brain className="w-10 h-10 text-[#00FFD1]" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-tighter">AI Optimization Engine</h2>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Processing Data</span>
                <span className="text-[10px] font-black text-[#00FFD1] uppercase tracking-widest">
                  {results.length} / {totalItems} Items
                </span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-8">
                <motion.div initial={{ width: 0 }} animate={{ width: `${totalItems > 0 ? (results.length / totalItems) * 100 : 0}%` }} className="h-full bg-[#00FFD1] shadow-[0_0_20px_#00FFD1]" />
              </div>

              <div className="space-y-3 text-left pl-8 border-l border-white/10 ml-8">
                {steps.map((step, i) => (
                  <motion.div key={i}
                    animate={{ 
                      opacity: i === processingStep ? 1 : i < processingStep ? 0.4 : 0.1,
                      color: i === processingStep ? '#00FFD1' : '#fff'
                    }}
                    className="text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-3"
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

      {/* Business Summary Modal */}
      <AnimatePresence>
        {summaryReport && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-[#0A0A0F]/95 backdrop-blur-2xl flex items-center justify-center p-6"
          >
            <div className="max-w-3xl w-full glass p-8 rounded-[40px] border border-white/10 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#00FFD1]/20 rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-[#00FFD1]" />
                  </div>
                  <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">Business Impact Report</h2>
                </div>
                <button onClick={() => setSummaryReport(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <Trash2 className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">SKUs Optimized</p>
                    <p className="text-3xl font-black text-white">{summaryReport.SKUs_where_a_smaller_box_was_found?.count || summaryReport.SKUs_where_a_smaller_box_was_found || 0} <span className="text-sm text-gray-500">({summaryReport.SKUs_where_a_smaller_box_was_found?.percentage || ''})</span></p>
                  </div>
                  <div className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Monthly Cost Savings</p>
                    <p className="text-3xl font-black text-[#00FFD1]">{summaryReport.Estimated_monthly_cost_savings?.replace('USD', '$') || summaryReport.Estimated_monthly_cost_savings_USD || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Volume Reduction</p>
                    <p className="text-3xl font-black text-white">{summaryReport.Total_estimated_volume_reduction?.cm3 || summaryReport.Total_estimated_volume_reduction || '0'} <span className="text-sm text-gray-500">saved</span></p>
                  </div>
                  <div className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Carbon Footprint Reduction</p>
                    <p className="text-3xl font-black text-green-400">{summaryReport.Carbon_footprint_reduction_estimate || '0 kg'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-[#00FFD1]/5 border border-[#00FFD1]/10 rounded-3xl">
                <h4 className="text-[10px] font-black text-[#00FFD1] uppercase tracking-widest mb-4">Top Optimization Opportunities</h4>
                <div className="space-y-3">
                  {summaryReport.Top_3_SKUs_with_the_biggest_optimization_opportunity?.map((sku: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-gray-300">{sku.sku || sku.name || sku}</span>
                      <span className="font-mono text-white font-bold">{sku.savings || sku.opportunity || ''}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => router.push('/dashboard/orders')}
                className="w-full bg-[#00FFD1] text-[#0A0A0F] py-4 rounded-2xl font-black text-xs uppercase tracking-widest mt-8 hover:scale-[1.02] transition-all"
              >
                View Detailed Results
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
