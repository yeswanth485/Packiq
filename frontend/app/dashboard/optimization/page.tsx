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

  // Engine State
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [engineStep, setEngineStep] = useState(0)
  const [results, setResults] = useState<any>(null)
  
  // History
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Actions
  const addProduct = () => setProducts([...products, { id: Date.now(), name: '', l: '', w: '', h: '', weight: '', fragile: false }])
  const removeProduct = (id: number) => setProducts(products.filter(p => p.id !== id))
  
  const addBox = () => setBoxes([...boxes, { id: Date.now(), name: '', l: '', w: '', h: '', qty: '' }])
  const removeBox = (id: number) => setBoxes(boxes.filter(b => b.id !== id))

  const handleBulkUpload = (selectedFile: File) => {
    setFile(selectedFile)
    const fileType = selectedFile.name.split('.').pop()?.toLowerCase()

    const handleData = (data: any[]) => {
      setParsedData(data)
      toast.success('File parsed successfully!')
    }

    if (fileType === 'csv') {
      Papa.parse(selectedFile, { header: true, skipEmptyLines: true, complete: (res) => handleData(res.data) })
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

  const runOptimization = async () => {
    // Determine payload based on tab
    let payload = []
    if (activeTab === 'bulk') {
      if (!parsedData.length) return toast.error('Please upload a valid file first')
      payload = parsedData
    } else {
      // Manual mode mapping to backend schema
      const validProducts = products.filter(p => p.name && p.l && p.w && p.h)
      if (!validProducts.length) return toast.error('Please add at least one complete product')
      
      payload = validProducts.map(p => ({
        'product id': `PROD-${p.id}`,
        'product name': p.name,
        'product L*W*H': `${p.l}*${p.w}*${p.h}`,
        'current used box L*W*H': '20*20*20', // Default fallback for old schema
        'box price': '5.00'
      }))
    }

    setIsOptimizing(true)
    setEngineStep(1)
    
    // Simulate Loading Steps for UX
    setTimeout(() => setEngineStep(2), 800)
    setTimeout(() => setEngineStep(3), 1600)
    setTimeout(() => setEngineStep(4), 2400)

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: payload }),
      })
      
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Optimization failed')
      
      // Simulate slight delay to let Step 4 render
      setTimeout(() => {
        setResults({
           items: data.results,
           totalSavings: data.results.reduce((a:any, b:any) => a + b.savings, 0),
           recommendedBox: data.results[0]?.optimized_box || "15*10*8"
        })
        setIsOptimizing(false)
        setEngineStep(0)
        refreshStats()
        toast.success('Optimization Complete!')
      }, 800)

    } catch (error: any) {
      toast.error(error.message)
      setIsOptimizing(false)
      setEngineStep(0)
    }
  }

  return (
    <div className="w-full relative overflow-hidden flex flex-col h-full min-h-screen -m-6 md:-m-8 p-6 md:p-8 bg-[#05050a]">
      
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
          <button onClick={runOptimization} disabled={isOptimizing} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#4361EE] hover:bg-[#344FDA] text-white px-6 py-2 rounded-lg font-semibold text-sm transition-all shadow-lg shadow-[#4361EE]/20 disabled:opacity-50">
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
                
                {/* File Dropzone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleBulkUpload(e.dataTransfer.files[0]) }}
                  className={`border-2 border-dashed rounded-[20px] p-16 text-center transition-all shadow-xl ${
                    isDragging ? 'border-[#4361EE] bg-[#4361EE]/5' : 'border-white/10 bg-[#0f0f1a] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="w-20 h-20 bg-[#4361EE]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <UploadCloud className="w-10 h-10 text-[#4361EE]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{file ? file.name : 'Drop your CSV or Excel here'}</h3>
                  <p className="text-sm text-gray-500 mb-8 font-medium">Must contain: product id, product name, product L*W*H, box L*W*H, price</p>
                  
                  <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleBulkUpload(e.target.files[0])} />
                  <button onClick={() => fileInputRef.current?.click()} className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-8 py-3 rounded-xl font-bold text-sm transition-all">
                    Browse Files
                  </button>
                </div>

                {parsedData.length > 0 && (
                   <div className="bg-[#0f0f1a] rounded-[20px] border border-white/[0.06] p-6">
                      <h3 className="text-sm font-bold text-white mb-4">Preview ({parsedData.length} items)</h3>
                      <div className="bg-[#1a1a2e] rounded-xl border border-white/5 p-4 text-xs font-mono text-gray-400 overflow-x-auto">
                        {JSON.stringify(parsedData[0], null, 2)}
                      </div>
                   </div>
                )}

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
        <div className="lg:col-span-5 h-full relative">
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

             {/* Loading State */}
             {isOptimizing && (
               <div className="flex-1 flex flex-col items-center justify-center p-10 relative">
                 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(67,97,238,0.15),transparent_70%)]" />
                 <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-24 h-24 bg-[#4361EE]/10 rounded-full flex items-center justify-center border border-[#4361EE]/30 mb-8 relative z-10">
                    <Zap className="w-10 h-10 text-[#4361EE] fill-[#4361EE]/20" />
                 </motion.div>
                 
                 <div className="w-full max-w-xs space-y-4 relative z-10">
                    {[
                      { step: 1, text: 'Parsing dimensions & weights...' },
                      { step: 2, text: 'Calculating spatial combinations...' },
                      { step: 3, text: 'Applying carrier rate logic...' },
                      { step: 4, text: 'Generating optimal solution...' }
                    ].map((s) => (
                      <div key={s.step} className="flex items-center gap-3">
                         {engineStep > s.step ? (
                           <CheckCircle2 className="w-5 h-5 text-green-500" />
                         ) : engineStep === s.step ? (
                           <span className="w-5 h-5 border-2 border-[#4361EE]/30 border-t-[#4361EE] rounded-full animate-spin shrink-0" />
                         ) : (
                           <div className="w-5 h-5 rounded-full border border-gray-700 shrink-0" />
                         )}
                         <span className={`text-sm ${engineStep >= s.step ? 'text-white' : 'text-gray-600'} transition-colors`}>{s.text}</span>
                      </div>
                    ))}
                 </div>
               </div>
             )}

             {/* Results State */}
             {results && !isOptimizing && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                 <div className="p-6 border-b border-white/5 bg-green-500/[0.02]">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                       <CheckCircle2 className="w-6 h-6 text-green-500" /> Optimization Complete ✦
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#1a1a2e] p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">Estimated Cost</p>
                        <p className="text-xl font-black text-green-400">${(results.items[0]?.cost_after || 0).toFixed(2)}</p>
                      </div>
                      <div className="bg-[#1a1a2e] p-3 rounded-xl border border-white/5">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">Void Space</p>
                        <p className="text-xl font-black text-white">12.4%</p>
                      </div>
                    </div>
                 </div>

                 <div className="flex-1 p-6 flex flex-col justify-center items-center relative min-h-[300px]">
                    <CSS3DBox outerDim={results.recommendedBox} innerItems={products.filter(p => p.name)} />
                    <div className="absolute bottom-6 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-xs text-white flex items-center gap-2">
                      <Box className="w-4 h-4" /> Recommended Box: <span className="font-bold text-[#00E5CC]">{results.recommendedBox}</span>
                    </div>
                 </div>

                 <div className="p-6 border-t border-white/5 bg-white/[0.01]">
                    <h4 className="text-sm font-bold text-white mb-4">Packing Sequence</h4>
                    <div className="space-y-3">
                      {products.filter(p => p.name).map((p, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-white/10 text-xs font-bold flex items-center justify-center shrink-0">{i+1}</span>
                          <span className="text-sm text-gray-400 flex-1">Place <strong className="text-white">{p.name}</strong> at base {p.fragile && '(add padding)'}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-3 mt-8">
                       <button className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                         <Bookmark className="w-4 h-4" /> Save
                       </button>
                       <button className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                         <Download className="w-4 h-4" /> PDF Report
                       </button>
                    </div>
                 </div>
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
  )
}

export default memo(OptimizationPage)
