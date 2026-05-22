'use client'

import { useState, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Trash2, UploadCloud, Brain, Package, FileSpreadsheet, Download,
  CheckCircle2, AlertTriangle, ShieldCheck, TrendingDown, Info
} from 'lucide-react'
import { toast } from 'sonner'
import { useOptimizationStore, OptimizationResult } from '@/lib/store/optimizationStore'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Box3DViewer from '@/components/dashboard/Box3DViewer'
import { LimitGuard } from '@/components/LimitReachedWall'
import { parseFile, ParseResult, generateCSVTemplate } from '@/lib/fileParser'

const OptimizationClient = memo(function OptimizationClient() {
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { results, setResults, setRunning, addBatchResults } = useOptimizationStore()
  const [uploadedFileName, setUploadedFileName] = useState('')
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
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD')
  const INR_RATE = 83.5
  const [manualResult, setManualResult] = useState<OptimizationResult | null>(null)
  const [summaryReport, setSummaryReport] = useState<any>(null)

  const [processingStep, setProcessingStep] = useState(0)
  const [totalItems, setTotalItems] = useState(0)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [quotaExceededError, setQuotaExceededError] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const steps = [
    "Scanning product catalog...",
    "Loading box catalog...",
    "Running XGBoost scoring engine...",
    "Selecting optimal packaging...",
    "Finalizing results & updating orders..."
  ]

  const fmt = (val: number) => currency === 'INR'
    ? `₹${(val * INR_RATE).toFixed(0)}`
    : `$${val.toFixed(2)}`

  const downloadTemplate = () => {
    generateCSVTemplate()
  }

  const handleManualOptimize = async () => {
    if (!manualInput.productName || !manualInput.l || !manualInput.w || !manualInput.h) {
      toast.error('Please fill in product name and dimensions.')
      return
    }

    setIsOptimizing(true)
    setTotalItems(1)
    setRunning()
    setManualResult(null)

    setProcessingStep(0)
    await new Promise(r => setTimeout(r, 200))
    setProcessingStep(1)
    await new Promise(r => setTimeout(r, 200))

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      const payload = [{
        product_name: manualInput.productName,
        sku: manualInput.sku,
        category: manualInput.category,
        length_cm: parseFloat(manualInput.l),
        width_cm: parseFloat(manualInput.w),
        height_cm: parseFloat(manualInput.h),
        weight_kg: parseFloat(manualInput.weight),
        fragility: manualInput.fragility,
        quantity: parseInt(manualInput.quantity, 10),
        zone: parseInt(manualInput.zone, 10),
        shipping_method: manualInput.shippingMethod,
        current_box: manualInput.currentBox,
        box_price: manualInput.currentBoxCost ? parseFloat(manualInput.currentBoxCost) : undefined
      }]

      setProcessingStep(2)
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ products: payload })
      })

      const data = await res.json()

      if (res.status === 403 || data.error === 'QUOTA_EXCEEDED') {
        setQuotaExceededError(data.message || 'Subscription limit exceeded. Please upgrade.')
        setShowUpgradeModal(true)
        throw new Error(data.message || 'Subscription limit exceeded')
      }

      if (!res.ok || data.error) throw new Error(data.error || 'Failed to optimize')

      if (data.success && data.results && data.results.length > 0) {
        setProcessingStep(3)
        await new Promise(r => setTimeout(r, 200))
        setProcessingStep(4)
        setManualResult(data.results[0])

        // Save to global store
        setResults(data.results, [])

        toast.success(
          `✓ Optimized ${data.total_optimized} of ${data.total_processed} products. ` +
          `₹${data.total_savings?.toFixed(2)} saved!`
        )
        // Keep the result on screen for manual entry instead of immediate redirect
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedFileName(file.name)
    try {
      const result = await parseFile(file)
      setParseResult(result)
    } catch (err: any) {
      toast.error(err.message || 'Failed to parse file')
    }
  }

  const processBulkData = async (data: any[]) => {
    setIsOptimizing(true)
    setTotalItems(data.length)
    setRunning()
    setResults([], [])

    try {
      setProcessingStep(0)
      await new Promise(r => setTimeout(r, 200))
      setProcessingStep(1)
      await new Promise(r => setTimeout(r, 200))
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      setProcessingStep(2)
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          products: data,
          fileName: uploadedFileName || 'Bulk Upload'
        })
      })

      const resData = await res.json()

      if (res.status === 403 || resData.error === 'QUOTA_EXCEEDED') {
        setQuotaExceededError(resData.message || 'Subscription limit exceeded. Please upgrade.')
        setShowUpgradeModal(true)
        throw new Error(resData.message || 'Subscription limit exceeded')
      }

      if (!res.ok) throw new Error(`Optimization failed (HTTP ${res.status})`)

      if (resData.success) {
        setProcessingStep(3)
        await new Promise(r => setTimeout(r, 200))
        setProcessingStep(4)

        // Save to global store
        setResults(resData.results, [])

        toast.success(
          `✓ Optimized ${resData.total_optimized} of ${resData.total_processed} products. ` +
          `₹${resData.total_savings?.toFixed(2)} saved!`
        )
        setTimeout(() => router.push(`/dashboard/orders?session_id=${resData.session_id}&fresh=true`), 1000)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Optimization failed')
    } finally {
      setIsOptimizing(false)
    }
  }

  return (
    <LimitGuard>
      <div className="max-w-[1200px] w-full mx-auto space-y-6 pb-20 px-4 md:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">AI Optimization</h1>
          <p className="text-gray-500 text-sm font-medium">Standardize packaging and minimize shipping costs.</p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-xl">
          {(['USD', 'INR'] as const).map(c => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                currency === c ? 'bg-[#00FFD1] text-[#0A0A0F]' : 'text-gray-500 hover:text-white'
              }`}
            >
              {c === 'USD' ? '$ USD' : '₹ INR'}
            </button>
          ))}
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

                  <button
                    onClick={handleManualOptimize}
                    className="w-full bg-[#00FFD1] text-[#0A0A0F] py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,209,0.2)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    <Brain className="w-4 h-4" /> Run AI Optimization
                  </button>
                </motion.div>
              ) : (
                <motion.div key="bulk" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  {!parseResult ? (
                    <>
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/10 rounded-[32px] p-12 text-center hover:border-[#00FFD1]/50 hover:bg-[#00FFD1]/5 transition-all cursor-pointer group"
                      >
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.xlsx,.xls" className="hidden" />
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                          <UploadCloud className="w-8 h-8 text-[#00FFD1]" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Upload Inventory Sheet</h3>
                        <p className="text-gray-500 text-xs mb-8">Supports CSV and Excel. Includes dims, weight, fragility, and zone for bulk processing.</p>
                      </div>
                      <button onClick={downloadTemplate} className="w-full py-3 bg-white/[0.03] border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" /> Download CSV Template
                      </button>
                    </>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-between">
                        <p className="text-sm font-bold text-white flex items-center gap-2">
                          <FileSpreadsheet className="w-5 h-5 text-[#00FFD1]" />
                          {parseResult.validCount} products ready
                        </p>
                        <button onClick={() => setParseResult(null)} className="text-xs text-gray-500 hover:text-white">Clear</button>
                      </div>
                      <button onClick={() => processBulkData(parseResult.data)} className="w-full bg-[#00FFD1] text-[#0A0A0F] py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,209,0.2)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                        <Brain className="w-4 h-4" /> Run Batch Optimization
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-5">
          {manualResult ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass p-6 md:p-8 rounded-3xl h-full space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white uppercase tracking-tight">AI Analysis</h2>
                <div className="px-3 py-1 bg-[#00FFD1]/10 border border-[#00FFD1]/20 rounded-full">
                  <span className="text-[10px] font-black text-[#00FFD1] uppercase tracking-widest">Optimized</span>
                </div>
              </div>

              <div className="aspect-square w-full">
                <Box3DViewer
                  l={manualResult.optimizedDims?.l || 0}
                  w={manualResult.optimizedDims?.w || 0}
                  h={manualResult.optimizedDims?.h || 0}
                  productL={manualResult.lengthCm}
                  productW={manualResult.widthCm}
                  productH={manualResult.heightCm}
                  spaceUtilization={manualResult.volumeUtil}
                  fragility={manualResult.fragility?.toLowerCase() as any}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Recommended Box</p>
                  <p className="text-white font-bold">{manualResult.optimizedBox || 'N/A'}</p>
                </div>
                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Savings</p>
                  <p className="text-[#00FFD1] font-bold">{fmt(manualResult.savings || 0)}</p>
                </div>
              </div>

              <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">AI Reasoning</p>
                <p className="text-xs text-gray-400 leading-relaxed italic">"{manualResult.reason}"</p>
              </div>

              <button
                onClick={() => router.push('/dashboard/orders')}
                className="w-full py-4 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                View in Orders
              </button>
            </motion.div>
          ) : (
            <div className="glass p-6 md:p-8 rounded-3xl h-full flex flex-col items-center justify-center text-center opacity-50">
              <Package className="w-16 h-16 mb-4 text-gray-600" />
              <p className="text-xs text-gray-400 font-medium">Results will appear in the history and orders tabs after processing.</p>
            </div>
          )}
        </div>
      </div>

      {/* Processing Modal */}
      <AnimatePresence>
        {isOptimizing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-[#0A0A0F]/90 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="max-w-md w-full">
              <div className="text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="w-24 h-24 border-2 border-[#00FFD1]/20 border-t-[#00FFD1] rounded-full mx-auto mb-10 flex items-center justify-center">
                  <Brain className="w-10 h-10 text-[#00FFD1]" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-8 uppercase tracking-tighter">AI Optimization Engine</h2>
              </div>
              <div className="space-y-4 mb-10">
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{
                      x: 0,
                      opacity: i === processingStep ? 1 : i < processingStep ? 0.6 : 0.2,
                      color: i === processingStep ? '#00FFD1' : '#fff'
                    }}
                    className="text-xs font-bold uppercase tracking-[0.1em] flex items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl"
                  >
                    {i < processingStep ? (
                      <div className="w-5 h-5 rounded-full bg-[#00FFD1]/20 flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-[#00FFD1]" />
                      </div>
                    ) : i === processingStep ? (
                      <div className="w-5 h-5 rounded-full border-2 border-[#00FFD1] border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10" />
                    )}
                    {step}
                  </motion.div>
                ))}
              </div>

              {processingStep === 4 && results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass p-6 rounded-3xl border-[#00FFD1]/20 space-y-4"
                >
                  <h3 className="text-[10px] font-black text-[#00FFD1] uppercase tracking-widest text-center">Optimization Summary</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-500 uppercase mb-1">Total SKUs</p>
                      <p className="text-white font-black text-lg">{results.length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-500 uppercase mb-1">Void Reduction</p>
                      <p className="text-[#00FFD1] font-black text-lg">{Math.round(results.reduce((acc, r) => acc + (r.volumeUtil || 0), 0) / results.length)}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-500 uppercase mb-1">Savings</p>
                      <p className="text-white font-black text-lg">{fmt(results.reduce((acc, r) => acc + (r.savings || 0), 0))}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-[#0A0A0F]/95 backdrop-blur-2xl flex items-center justify-center p-6">
            <div className="max-w-md w-full glass p-8 rounded-[40px] border border-white/10 text-center">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
              <h3 className="text-2xl font-bold text-white uppercase tracking-tighter mb-3">Limit Exceeded</h3>
              <p className="text-sm text-gray-400 mb-8">{quotaExceededError}</p>
              <button onClick={() => { setShowUpgradeModal(false); router.push('/dashboard/subscription'); }} className="w-full bg-[#00FFD1] text-[#0A0A0F] py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Upgrade Subscription</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </LimitGuard>
  )
})

export default OptimizationClient
