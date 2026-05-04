'use client'

import { useState, useRef, useEffect, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, Clock, Plus, Trash2, Box, ArrowRight, X, FileSpreadsheet, 
  UploadCloud, CheckCircle2, AlertCircle, Shield, ChevronDown, ChevronRight, Bookmark, Download
} from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { useDashboard } from '@/lib/context/DashboardContext'
import { useOptimizationStore, OptimizationResult } from '@/lib/store/optimizationStore'

// --- MOCK 3D CSS VISUALIZATION ---
function CSS3DBox({ outerDim, innerItems }: any) {
  // outerDim is "L*W*H" e.g. "15*10*8"
  // innerItems is an array of products
  
  return (
    <div className="w-full h-64 perspective-[1000px] flex items-center justify-center">
      <motion.div 
        animate={{ rotateY: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="relative w-40 h-40 transform-style-3d group hover:[animation-play-state:paused]"
      >
        {/* Outer Box Bounds (Glassy) */}
        <div className="absolute inset-0 border-2 border-[#00E5CC]/40 bg-[#00E5CC]/10 transform translate-z-20 backdrop-blur-[2px]" />
        <div className="absolute inset-0 border-2 border-[#00E5CC]/40 bg-[#00E5CC]/5 transform -translate-z-20" />
        <div className="absolute inset-0 border-2 border-[#00E5CC]/40 bg-[#00E5CC]/10 transform rotate-y-90 translate-x-20 origin-right" />
        <div className="absolute inset-0 border-2 border-[#00E5CC]/40 bg-[#00E5CC]/10 transform -rotate-y-90 -translate-x-20 origin-left" />
        <div className="absolute inset-0 border-2 border-[#00E5CC]/40 bg-[#00E5CC]/10 transform rotate-x-90 -translate-y-20 origin-top" />
        <div className="absolute inset-0 border-2 border-[#00E5CC]/40 bg-[#00E5CC]/10 transform -rotate-x-90 translate-y-20 origin-bottom" />
        
        {/* Inner Products Mock */}
        {innerItems.map((item: any, i: number) => {
          const colors = ['bg-indigo-500', 'bg-pink-500', 'bg-amber-500', 'bg-green-500']
          const color = colors[i % colors.length]
          return (
            <div key={i} className={`absolute bottom-4 left-4 w-16 h-16 ${color} transform translate-z-[${(i+1)*10}px] opacity-80 shadow-2xl border border-white/20`} style={{ transform: `translateZ(${(i)*20}px) translateX(${(i)*10}px)`}}>
               <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white text-center p-1 leading-tight">{item.name || `P${i+1}`}</div>
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}

// --- MAIN PAGE ---
const OptimizationPage = () => {
  const { refreshStats } = useDashboard()

  // State
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual')
  
  // Manual State
  const [products, setProducts] = useState([{ id: 1, name: '', l: '', w: '', h: '', weight: '', fragile: false }])
  const [boxes, setBoxes] = useState([{ id: 1, name: '', l: '', w: '', h: '', qty: '' }])
  const [autoSelectBoxes, setAutoSelectBoxes] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settings, setSettings] = useState({ goal: 'void', unit: 'cm', weightUnit: 'kg', fragilePad: 0 })

  // Bulk State
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Global Store
  const { 
    results: storeResults, 
    status: storeStatus, 
    lastRun, 
    totalSaved, 
    itemsProcessed,
    setRunning,
    addBatchResults,
    reset: resetStore
  } = useOptimizationStore()

  // Engine State
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [engineStep, setEngineStep] = useState(0)
  const [results, setResultsLocal] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [itemsDone, setItemsDone] = useState(0)
  const [itemsTotal, setItemsTotal] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [eta, setEta] = useState<string>('--:--')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isCancelled, setIsCancelled] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const resultsRef = useRef<HTMLDivElement>(null)
  
  // History
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Actions
  const addProduct = () => setProducts([...products, { id: Date.now(), name: '', l: '', w: '', h: '', weight: '', fragile: false }])
  const removeProduct = (id: number) => setProducts(products.filter(p => p.id !== id))
  
  const addBox = () => setBoxes([...boxes, { id: Date.now(), name: '', l: '', w: '', h: '', qty: '' }])
  const removeBox = (id: number) => setBoxes(boxes.filter(b => b.id !== id))

  const handleBulkUpload = (selectedFile: File) => {
    setValidationError(null)
    setFile(selectedFile)
    const fileType = selectedFile.name.split('.').pop()?.toLowerCase()

    const handleData = (data: any[]) => {
      // Validation: product_id, product_name, product L*W*H, box L*W*H, price
      const required = ['product_id', 'product_name', 'product L*W*H', 'box L*W*H', 'price']
      const headers = data.length > 0 ? Object.keys(data[0]) : []
      const missing = required.filter(h => !headers.includes(h))

      if (missing.length > 0) {
        setValidationError(`Missing required columns: ${missing.join(', ')}`)
        setFile(null)
        setParsedData([])
        return
      }

      setParsedData(data)
      setItemsTotal(data.length)
      toast.success('File validated successfully!')
    }

    if (fileType === 'csv') {
      Papa.parse(selectedFile, { 
        header: true, 
        skipEmptyLines: true, 
        transformHeader: (h) => h.trim().toLowerCase().replace(/ /g, '_').replace(/l\*w\*h/g, 'L*W*H'),
        complete: (res) => {
           // We need to map headers back to the expected format for validation if transformHeader changed them too much
           // But actually the user request said: product_id, product_name, product L*W*H, box L*W*H, price
           // Let's stick to what they said.
           handleData(res.data)
        } 
      })
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const wb = XLSX.read(e.target?.result, { type: 'binary' })
        const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
        handleData(json)
      }
      reader.readAsBinaryString(selectedFile)
    }
  }

  const removeFile = () => {
    setFile(null)
    setParsedData([])
    setValidationError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const runOptimization = async () => {
    // Determine payload based on tab
    let payload = []
    if (activeTab === 'bulk') {
      if (!parsedData.length) return toast.error('Please upload a valid file first')
      payload = parsedData
    } else {
      const validProducts = products.filter(p => p.name && p.l && p.w && p.h)
      if (!validProducts.length) return toast.error('Please add at least one complete product')
      
      payload = validProducts.map(p => ({
        'product_id': `PROD-${p.id}`,
        'product_name': p.name,
        'product L*W*H': `${p.l}*${p.w}*${p.h}`,
        'box L*W*H': '20*20*20',
        'price': '5.00'
      }))
    }

    setIsOptimizing(true)
    setItemsDone(0)
    setItemsTotal(payload.length)
    setStartTime(Date.now())
    setEta('--:--')
    setIsCancelled(false)
    setRunning() // Store action
    
    abortControllerRef.current = new AbortController()

    // Scroll to results section immediately
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)

    try {
      // We process in batches of 10 as requested
      const batchSize = 10
      for (let i = 0; i < payload.length; i += batchSize) {
        if (abortControllerRef.current?.signal.aborted) break

        const batch = payload.slice(i, i + batchSize)
        const response = await fetch('/api/optimize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ products: batch }),
          signal: abortControllerRef.current?.signal
        })
        
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Optimization failed')
        
        // Update Store
        addBatchResults(data.results.map((r: any) => ({
          ...r,
          void_reduction: 12.4, // Mocked for now
          status: 'success'
        })))

        // Update local UI
        const completed = i + batch.length
        setItemsDone(completed)
        
        // Calculate ETA
        const elapsed = (Date.now() - (startTime || Date.now())) / 1000
        const perItem = elapsed / completed
        const remaining = (payload.length - completed) * perItem
        const mins = Math.floor(remaining / 60)
        const secs = Math.round(remaining % 60)
        setEta(`${mins}:${secs.toString().padStart(2, '0')}`)
      }

      if (!abortControllerRef.current?.signal.aborted) {
        setResultsLocal({
           items: storeResults,
           totalSavings: totalSaved,
           recommendedBox: storeResults[0]?.optimized_box || "15*10*8"
        })
        setIsOptimizing(false)
        toast.success('Optimization Complete!')
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.error('Optimization cancelled')
      } else {
        toast.error(error.message)
        setError(error.message)
      }
      setIsOptimizing(false)
    }
  }

  return (
    <div className="w-full relative flex flex-col h-screen bg-[#05050a] overflow-y-auto">
      <div className="p-6 md:p-8 flex flex-col min-h-full">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">AI Optimization Engine</h1>
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Engine Online</span>
            </div>
          </div>
          <p className="text-sm text-gray-400">Calculate the perfect packaging for any combination of products instantly</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button onClick={() => setIsHistoryOpen(true)} className="flex items-center gap-2 text-gray-400 hover:text-white px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium">
            <Clock className="w-4 h-4" /> History
          </button>
          <button 
            onClick={runOptimization} 
            disabled={isOptimizing || (activeTab === 'bulk' && !file)} 
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-semibold text-sm transition-all shadow-lg ${
              isOptimizing || (activeTab === 'bulk' && !file) 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-[#4361EE] hover:bg-[#344FDA] text-white shadow-[#4361EE]/20'
            }`}
          >
            <Zap className="w-4 h-4" /> Run Optimization
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid lg:grid-cols-12 gap-6 relative">
        
        {/* LEFT COLUMN: Input Panel */}
        <div className="lg:col-span-7 flex flex-col gap-6 overflow-y-auto pb-24 pr-2">
          
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-[#0f0f1a] p-1 rounded-xl border border-white/[0.06] w-fit">
            <button onClick={() => setActiveTab('manual')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'manual' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Manual Entry</button>
            <button onClick={() => setActiveTab('bulk')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'bulk' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>Bulk Upload (CSV/Excel)</button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'manual' ? (
              <motion.div key="manual" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
                
                {/* Products Section */}
                <div className="bg-[#0f0f1a] rounded-[20px] border border-white/[0.06] p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white">Products to Pack</h2>
                    <button onClick={addProduct} className="flex items-center gap-2 text-xs font-semibold text-[#4361EE] hover:text-[#344FDA] bg-[#4361EE]/10 px-3 py-1.5 rounded-lg transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Product
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <AnimatePresence>
                      {products.map((p, i) => (
                        <motion.div key={p.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-start gap-3 group">
                          <div className="flex-1 grid grid-cols-12 gap-3 bg-[#1a1a2e] p-3 rounded-xl border border-white/[0.05] focus-within:border-[#4361EE]/50 transition-colors">
                            <input 
                              placeholder="Product Name" 
                              value={p.name} onChange={(e) => { const np = [...products]; np[i].name = e.target.value; setProducts(np) }}
                              className="col-span-12 sm:col-span-4 bg-transparent border-none text-white text-sm focus:outline-none focus:ring-0 placeholder-gray-600"
                            />
                            <div className="col-span-12 sm:col-span-5 flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-3">
                               <input placeholder="L" className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-gray-600 text-center" value={p.l} onChange={(e) => { const np = [...products]; np[i].l = e.target.value; setProducts(np) }} />
                               <span className="text-gray-600 text-xs">x</span>
                               <input placeholder="W" className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-gray-600 text-center" value={p.w} onChange={(e) => { const np = [...products]; np[i].w = e.target.value; setProducts(np) }} />
                               <span className="text-gray-600 text-xs">x</span>
                               <input placeholder="H" className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-gray-600 text-center" value={p.h} onChange={(e) => { const np = [...products]; np[i].h = e.target.value; setProducts(np) }} />
                            </div>
                            <div className="col-span-12 sm:col-span-3 flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-3">
                               <input placeholder="Wt" className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-gray-600" value={p.weight} onChange={(e) => { const np = [...products]; np[i].weight = e.target.value; setProducts(np) }} />
                               <button onClick={() => { const np = [...products]; np[i].fragile = !np[i].fragile; setProducts(np) }} className={`p-1.5 rounded-md transition-colors ${p.fragile ? 'bg-amber-500/20 text-amber-500' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}>
                                 <Shield className="w-4 h-4" />
                               </button>
                            </div>
                          </div>
                          <button onClick={() => removeProduct(p.id)} className="p-3 mt-1 rounded-xl text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Boxes Section */}
                <div className="bg-[#0f0f1a] rounded-[20px] border border-white/[0.06] p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white">Available Boxes</h2>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                        <input type="checkbox" checked={autoSelectBoxes} onChange={(e) => setAutoSelectBoxes(e.target.checked)} className="rounded border-gray-600 bg-transparent text-[#4361EE] focus:ring-offset-0 focus:ring-transparent" />
                        Auto-select from Catalog
                      </label>
                      {!autoSelectBoxes && (
                        <button onClick={addBox} className="flex items-center gap-2 text-xs font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
                          <Plus className="w-3.5 h-3.5" /> Add Box
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {!autoSelectBoxes && (
                    <div className="space-y-3">
                      <AnimatePresence>
                        {boxes.map((b, i) => (
                          <motion.div key={b.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-start gap-3">
                            <div className="flex-1 grid grid-cols-12 gap-3 bg-[#1a1a2e] p-3 rounded-xl border border-white/[0.05] focus-within:border-[#4361EE]/50 transition-colors">
                              <input placeholder="Box Name" value={b.name} onChange={(e) => { const nb = [...boxes]; nb[i].name = e.target.value; setBoxes(nb) }} className="col-span-12 sm:col-span-5 bg-transparent border-none text-white text-sm focus:outline-none placeholder-gray-600" />
                              <div className="col-span-12 sm:col-span-5 flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-3">
                                 <input placeholder="L" className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-gray-600 text-center" value={b.l} onChange={(e) => { const nb = [...boxes]; nb[i].l = e.target.value; setBoxes(nb) }} />
                                 <span className="text-gray-600 text-xs">x</span>
                                 <input placeholder="W" className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-gray-600 text-center" value={b.w} onChange={(e) => { const nb = [...boxes]; nb[i].w = e.target.value; setBoxes(nb) }} />
                                 <span className="text-gray-600 text-xs">x</span>
                                 <input placeholder="H" className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-gray-600 text-center" value={b.h} onChange={(e) => { const nb = [...boxes]; nb[i].h = e.target.value; setBoxes(nb) }} />
                              </div>
                              <div className="col-span-12 sm:col-span-2 border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-3">
                                 <input placeholder="Qty" className="w-full bg-transparent text-white text-sm focus:outline-none placeholder-gray-600" value={b.qty} onChange={(e) => { const nb = [...boxes]; nb[i].qty = e.target.value; setBoxes(nb) }} />
                              </div>
                            </div>
                            <button onClick={() => removeBox(b.id)} className="p-3 mt-1 rounded-xl text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Settings Section */}
                <div className="bg-[#0f0f1a] rounded-[20px] border border-white/[0.06] shadow-xl overflow-hidden">
                  <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="w-full flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors">
                    <h2 className="text-lg font-bold text-white">Optimization Settings</h2>
                    {isSettingsOpen ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                  </button>
                  <AnimatePresence>
                    {isSettingsOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-6 pb-6 border-t border-white/[0.06]">
                        <div className="pt-4 grid sm:grid-cols-3 gap-4 mb-6">
                          {['void', 'cost', 'speed'].map((goal) => (
                            <button 
                              key={goal} onClick={() => setSettings({...settings, goal})}
                              className={`p-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-2 ${settings.goal === goal ? 'border-[#4361EE] bg-[#4361EE]/10 text-white' : 'border-white/5 bg-[#1a1a2e] text-gray-400 hover:bg-white/5'}`}
                            >
                              {goal === 'void' && <Box className="w-5 h-5" />}
                              {goal === 'cost' && <span className="text-lg">💰</span>}
                              {goal === 'speed' && <Zap className="w-5 h-5" />}
                              {goal === 'void' ? 'Minimize Void Space' : goal === 'cost' ? 'Reduce Carrier Cost' : 'Speed'}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="text-xs text-gray-500 font-medium mb-2 block">Unit System</label>
                            <div className="flex bg-[#1a1a2e] p-1 rounded-lg border border-white/5">
                              {['cm', 'inches', 'mm'].map((u) => (
                                <button key={u} onClick={() => setSettings({...settings, unit: u})} className={`flex-1 text-xs py-1.5 rounded-md capitalize transition-colors ${settings.unit === u ? 'bg-white/10 text-white' : 'text-gray-500'}`}>{u}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 font-medium mb-2 block">Fragile Padding ({settings.fragilePad}mm)</label>
                            <input type="range" min="0" max="50" value={settings.fragilePad} onChange={(e) => setSettings({...settings, fragilePad: parseInt(e.target.value)})} className="w-full accent-[#4361EE]" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </motion.div>
            ) : (
              <motion.div key="bulk" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
                
                {/* File Dropzone / Strip */}
                {file ? (
                  /* STATE B: File Selected (Collapsed Strip) */
                  <motion.div 
                    initial={{ height: 160, opacity: 0 }} 
                    animate={{ height: 56, opacity: 1 }} 
                    className="flex items-center justify-between px-4 bg-[#0f0f1a] rounded-xl border border-green-500/30 overflow-hidden"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                         <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white mr-2">{file.name}</span>
                        <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                    </div>
                    <button onClick={removeFile} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </motion.div>
                ) : (
                  /* STATE A: No File (Large Dropzone) */
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleBulkUpload(e.dataTransfer.files[0]) }}
                    className={`border-2 border-dashed rounded-[20px] min-h-[160px] flex flex-col items-center justify-center p-8 text-center transition-all duration-250 ${
                      isDragging ? 'border-[#4361EE] bg-[#4361EE]/5' : 'border-white/10 bg-[#0f0f1a] hover:bg-white/[0.04]'
                    }`}
                  >
                    <UploadCloud className="w-8 h-8 text-[#4361EE] mb-3" />
                    <h3 className="text-sm font-bold text-white mb-1">Drop your CSV or Excel here</h3>
                    <p className="text-xs text-gray-500 mb-4 font-medium">product_id, product_name, product L*W*H, box L*W*H, price</p>
                    
                    <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleBulkUpload(e.target.files[0])} />
                    <button onClick={() => fileInputRef.current?.click()} className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-6 py-2 rounded-lg font-bold text-xs transition-all">
                      Browse Files
                    </button>
                  </div>
                )}

                {/* Validation Error Banner */}
                <AnimatePresence>
                  {validationError && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-400 font-medium leading-relaxed">{validationError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            )}
          </AnimatePresence>

          <button 
            onClick={runOptimization} 
            disabled={isOptimizing}
            className="w-full h-14 relative group overflow-hidden rounded-[16px] bg-gradient-to-r from-[#4361EE] to-[#3B82F6] shadow-xl shadow-[#4361EE]/20 hover:shadow-[#4361EE]/40 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
          >
            {isOptimizing ? (
              <div className="absolute inset-0 flex items-center justify-center gap-3">
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span className="font-bold text-white tracking-wider">ANALYZING...</span>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center gap-2">
                <Zap className="w-5 h-5 text-white fill-white/20" />
                <span className="font-black text-white text-lg tracking-wide uppercase">Run Optimization</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
          </button>
          
        </div>

        {/* RIGHT COLUMN: Results Panel */}
        <div className="lg:col-span-5 h-full relative" id="optimization-results" ref={resultsRef}>
           <div className={`w-full h-full min-h-[600px] bg-[#0f0f1a] rounded-[24px] border transition-all duration-500 overflow-hidden flex flex-col ${results ? 'border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.1)]' : isOptimizing ? 'border-[#4361EE]/50 shadow-[0_0_40px_rgba(67,97,238,0.1)]' : 'border-white/[0.06] border-dashed'}`}>
             
             {/* Default State */}
             {!isOptimizing && !results && (
               <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-50">
                 <div className="w-32 h-32 mb-8 relative perspective-[1000px]">
                   <motion.div animate={{ rotateY: 360, rotateX: 360 }} transition={{ duration: 15, repeat: Infinity, ease: 'linear' }} className="w-full h-full transform-style-3d">
                      <div className="absolute inset-0 border border-white/20 transform translate-z-16" />
                      <div className="absolute inset-0 border border-white/20 transform -translate-z-16" />
                      <div className="absolute inset-0 border border-white/20 transform rotate-y-90 translate-x-16 origin-right" />
                      <div className="absolute inset-0 border border-white/20 transform -rotate-y-90 -translate-x-16 origin-left" />
                   </motion.div>
                 </div>
                 <h3 className="text-xl font-bold text-white mb-2">Run your first optimization</h3>
                 <p className="text-sm text-gray-400">Add products and boxes on the left, then hit Run to see the 3D visualization.</p>
               </div>
             )}

             {/* Problem 3: Processing State */}
             {isOptimizing && (
               <div className="flex-1 flex flex-col p-8 relative">
                 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(67,97,238,0.1),transparent_70%)]" />
                 
                 <div className="relative z-10 space-y-8">
                   <div className="flex justify-between items-end">
                     <div>
                       <h3 className="text-lg font-bold text-white mb-1">AI Optimization Running...</h3>
                       <p className="text-xs text-gray-400">Processing item <span className="text-white font-bold">{itemsDone}</span> of <span className="text-white font-bold">{itemsTotal}</span></p>
                     </div>
                     <button 
                        onClick={() => { abortControllerRef.current?.abort(); setIsOptimizing(false); setIsCancelled(true); }}
                        className="text-xs font-bold text-red-500 hover:text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors"
                     >
                       Cancel
                     </button>
                   </div>

                   {/* Progress Bar */}
                   <div className="space-y-2">
                     <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(itemsDone / itemsTotal) * 100}%` }}
                          className="h-full bg-gradient-to-r from-[#4361EE] to-[#3B82F6] relative"
                        >
                          <div className="absolute inset-0 bg-white/30 animate-[shimmer_1s_infinite]" />
                        </motion.div>
                     </div>
                     <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-gray-500">
                        <span>ETA: {eta}</span>
                        <span>{Math.round((itemsDone / itemsTotal) * 100)}%</span>
                     </div>
                   </div>

                   {/* Live Log */}
                   <div className="bg-black/40 rounded-xl border border-white/5 p-4 h-48 overflow-y-auto font-mono text-[10px] space-y-1 scrollbar-hide">
                      <p className="text-green-500">Initializing PackIQ Optimization Engine...</p>
                      <p className="text-[#4361EE]">Model: claude-haiku-4-5-20251001</p>
                      <p className="text-gray-500">Checking local SKU cache...</p>
                      {storeResults.slice(-5).map((r, i) => (
                        <p key={i} className="text-white flex justify-between">
                          <span>✓ {r.product_name}</span>
                          <span className="text-green-400">Saved ${r.savings.toFixed(2)}</span>
                        </p>
                      ))}
                      {isOptimizing && <p className="text-[#4361EE] animate-pulse">_ Processing batch...</p>}
                   </div>
                 </div>
               </div>
             )}

             {/* Results State */}
             {results && !isOptimizing && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                  {/* Completion Summary */}
                  <div className="p-6 border-b border-white/5 bg-green-500/[0.04]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" /> Optimization Complete
                      </h3>
                      <span className="text-xs text-gray-500">{itemsProcessed} items in {((Date.now() - (startTime || Date.now())) / 1000).toFixed(1)}s</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-[#1a1a2e] p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Total Saved</p>
                        <p className="text-lg font-black text-green-400">${totalSaved.toFixed(2)}</p>
                      </div>
                      <div className="bg-[#1a1a2e] p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Avg Void</p>
                        <p className="text-lg font-black text-white">12.4%</p>
                      </div>
                      <div className="bg-[#1a1a2e] p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Changes</p>
                        <p className="text-lg font-black text-amber-400">{results.items.filter((i:any) => i.savings > 0).length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 p-6 flex flex-col items-center justify-center relative min-h-[300px] border-b border-white/5">
                     <CSS3DBox outerDim={results.recommendedBox} innerItems={products.filter(p => p.name)} />
                     <div className="absolute bottom-6 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs text-white flex items-center gap-2">
                       <Box className="w-4 h-4" /> Visualizing Last Recommended: <span className="font-bold text-[#00E5CC]">{results.recommendedBox}</span>
                     </div>
                  </div>

                  {/* Problem 4: Results Table */}
                  <ResultsTable data={storeResults} />
               </motion.div>
             )}
           </div>
        </div>
      </div>

      {/* History Drawer Overlay */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsHistoryOpen(false)} className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }} className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a12] border-l border-white/10 z-50 flex flex-col shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Clock className="w-5 h-5" /> Optimization History</h3>
                <button onClick={() => setIsHistoryOpen(false)} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-xl border border-white/5 bg-[#151522] hover:border-[#4361EE]/50 hover:bg-[#4361EE]/5 transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-500">{i * 2} hours ago</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Saved $4.50</span>
                    </div>
                    <p className="text-sm font-bold text-white mb-1">Batch #{8439 - i}</p>
                    <p className="text-xs text-gray-400">3 Products • 15x10x8 Box</p>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-white/5">
                <button className="w-full py-3 text-red-400 bg-red-400/5 hover:bg-red-400/10 rounded-xl text-sm font-bold transition-colors">Clear History</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      </div>
    </div>
  )
}

// --- RESULTS TABLE COMPONENT ---
const ResultsTable = ({ data }: { data: OptimizationResult[] }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: keyof OptimizationResult, direction: 'asc' | 'desc' } | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 25

  const filteredData = data.filter(item => 
    item.product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig) return 0
    const { key, direction } = sortConfig
    if (a[key]! < b[key]!) return direction === 'asc' ? -1 : 1
    if (a[key]! > b[key]!) return direction === 'asc' ? 1 : -1
    return 0
  })

  const paginatedData = sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  const totalPages = Math.ceil(sortedData.length / rowsPerPage)

  const handleSort = (key: keyof OptimizationResult) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const exportToCSV = () => {
    const headers = ['Product ID', 'Product Name', 'Original Box', 'Recommended Box', 'Void Reduction %', 'Est. Savings']
    const rows = sortedData.map(item => [
      item.product_id,
      item.product_name,
      item.original_box,
      item.optimized_box,
      item.void_reduction.toFixed(2) + '%',
      '$' + item.savings.toFixed(2)
    ])
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `optimization_results_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="p-4 border-b border-white/5 flex items-center justify-between gap-4 bg-black/20">
        <div className="relative flex-1 max-w-sm">
          <input 
            type="text" 
            placeholder="Search products..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-[#4361EE]/50 transition-colors"
          />
          <Plus className="w-4 h-4 text-gray-500 absolute left-3 top-2.5 rotate-45" />
        </div>
        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all"
        >
          <Download className="w-4 h-4" /> Export Results
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse table-fixed">
          <thead className="sticky top-0 z-20 bg-[#0f0f1a] shadow-sm">
            <tr className="border-b border-white/5">
              {[
                { label: 'Product ID', key: 'product_id' },
                { label: 'Product Name', key: 'product_name' },
                { label: 'Original Box', key: 'original_box' },
                { label: 'Recommended Box', key: 'optimized_box' },
                { label: 'Void Reduction %', key: 'void_reduction' },
                { label: 'Est. Savings', key: 'savings' }
              ].map((col) => (
                <th 
                  key={col.key} 
                  onClick={() => handleSort(col.key as keyof OptimizationResult)}
                  className="p-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {sortConfig?.key === col.key && (
                      <ChevronDown className={`w-3 h-3 transition-transform ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, i) => (
              <tr 
                key={i} 
                className={`border-b border-white/[0.02] transition-colors hover:bg-white/[0.02] ${
                  item.savings > 1.0 ? 'bg-green-500/[0.03]' : item.status === 'warning' ? 'bg-amber-500/[0.03]' : ''
                }`}
              >
                <td className="p-4 text-xs font-mono text-gray-400 truncate">{item.product_id}</td>
                <td className="p-4 text-xs text-white font-medium truncate">{item.product_name}</td>
                <td className="p-4 text-xs text-gray-400 font-mono">{item.original_box}</td>
                <td className="p-4 text-xs text-[#00E5CC] font-bold font-mono">{item.optimized_box}</td>
                <td className="p-4 text-xs font-bold text-white">12.4%</td>
                <td className="p-4 text-xs font-black text-green-400">${item.savings.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {paginatedData.length === 0 && (
          <div className="p-10 text-center text-gray-500 text-sm">No results found matching your search.</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-white/5 flex items-center justify-between bg-black/20">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(OptimizationPage)
