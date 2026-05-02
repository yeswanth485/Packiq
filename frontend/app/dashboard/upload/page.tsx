'use client'

import { useState, useRef } from 'react'
import { 
  UploadCloud, FileText, FileSpreadsheet, AlertCircle, 
  CheckCircle2, Play, RefreshCw, XCircle, Zap, Box, 
  ArrowRight, DollarSign, TrendingDown 
} from 'lucide-react'
import { toast } from 'sonner'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { validateUploadSchema, parseDimensions } from '@/lib/utils/parser'
import { useDashboard } from '@/lib/context/DashboardContext'

const OptimizedBoxViewer = dynamic(() => import('@/components/dashboard/OptimizedBoxViewer'), { ssr: false })

const REQUIRED_HEADERS = [
  'product id', 
  'product name', 
  'product L*W*H', 
  'current used box L*W*H', 
  'box price'
]

export default function UploadPage() {
  const { refreshStats } = useDashboard()
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [isValidated, setIsValidated] = useState(false)
  
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<any[] | null>(null)
  const [failedItems, setFailedItems] = useState<any[]>([])
  const [selectedResult, setSelectedResult] = useState<any | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile)
    setParsedData([])
    setIsValidated(false)
    setResults(null)

    const fileType = selectedFile.name.split('.').pop()?.toLowerCase()

    const handleData = (data: any[]) => {
      const firstRow = data[0]
      const validation = validateUploadSchema(firstRow)
      
      if (validation.valid) {
        setParsedData(data)
        setIsValidated(true)
        toast.success('File parsed and validated!')
      } else {
        toast.error(validation.error || `Missing columns: ${validation.missing?.join(', ')}`)
        setFile(null)
      }
    }

    if (fileType === 'csv') {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => handleData(results.data),
        error: (err) => toast.error(err.message)
      })
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const workbook = XLSX.read(e.target?.result, { type: 'binary' })
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
        if (json.length > 0) handleData(json)
        else toast.error('File is empty')
      }
      reader.readAsBinaryString(selectedFile)
    }
  }

  const runOptimization = async () => {
    setIsOptimizing(true)
    setProgress(10)
    
    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: parsedData }),
      })
      
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Optimization failed')
      
      setResults(data.results)
      setFailedItems(data.failed)
      setProgress(100)
      toast.success(`Optimized ${data.count} products!`)
      refreshStats()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsOptimizing(false)
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Smart Optimization</h1>
          <p className="text-gray-400 text-sm">Upload your shipment data using the standard L*W*H format for instant AI recommendations.</p>
        </div>
        <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest border border-white/5 px-3 py-1 rounded-full">
          Schema: {REQUIRED_HEADERS.length} Fields
        </div>
      </div>

      {!results && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]) }}
              className={`border-2 border-dashed rounded-3xl p-16 text-center transition-all ${
                isDragging ? 'border-[#00E5CC] bg-[#00E5CC]/5' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              <div className="w-20 h-20 bg-[#00E5CC]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <UploadCloud className="w-10 h-10 text-[#00E5CC]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Drop your CSV or Excel here</h3>
              <p className="text-sm text-gray-500 mb-8 font-medium">Standard packaging logs with L*W*H dimensions</p>
              
              <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#00E5CC] hover:bg-[#00c2ad] text-[#0A0A0F] px-8 py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-[#00E5CC]/20"
              >
                Choose File
              </button>
            </div>

            {/* Preview */}
            <AnimatePresence>
              {isValidated && parsedData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl border-white/5 overflow-hidden">
                   <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                      <span className="text-xs font-black uppercase tracking-widest text-gray-500">Data Preview ({parsedData.length} Items)</span>
                      {isOptimizing ? (
                        <div className="flex items-center gap-3 text-[#00E5CC]">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span className="text-xs font-bold">Optimizing... {progress}%</span>
                        </div>
                      ) : (
                        <button onClick={runOptimization} className="flex items-center gap-2 text-[#00E5CC] hover:text-white text-xs font-black uppercase transition-colors">
                          <Play className="w-3 h-3" /> Start AI Batch
                        </button>
                      )}
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead>
                          <tr className="bg-white/[0.02] text-gray-500 border-b border-white/5">
                            {REQUIRED_HEADERS.map(h => <th key={h} className="px-6 py-4 font-bold">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {parsedData.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-b border-white/5 text-gray-300">
                              {REQUIRED_HEADERS.map(h => <td key={h} className="px-6 py-4">{row[h]}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Guidelines */}
          <div className="space-y-6">
            <div className="glass rounded-3xl p-8 border-white/5 bg-white/[0.01]">
              <h4 className="text-sm font-black uppercase tracking-widest text-[#00E5CC] mb-6">Format Guide</h4>
              <ul className="space-y-6">
                {[
                  { label: 'Combined Dimensions', desc: 'Use L*W*H format (e.g., 10*15*5) for both product and box.' },
                  { label: 'Real-Time Verification', desc: 'Our AI cross-verifies box price vs spatial volume saved.' },
                  { label: 'Strict Schema', desc: 'Column headers must match exactly as shown in the preview.' }
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-lg bg-[#00E5CC]/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00E5CC]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white mb-1">{item.label}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-2xl">
               <Zap className="w-8 h-8 mb-4" />
               <h4 className="text-xl font-black mb-2">Dual-Layer AI</h4>
               <p className="text-sm text-blue-100 leading-relaxed opacity-80">Our platform uses Claude 3.5 Sonnet and GPT-4o for 100% reliability and maximum savings.</p>
            </div>
          </div>
        </div>
      )}

      {/* Results View */}
      {results && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
           <div className="grid md:grid-cols-3 gap-6">
              <div className="glass p-8 rounded-3xl border-white/5 bg-[#00E5CC]/5">
                 <div className="flex items-center gap-3 mb-2 text-[#00E5CC]">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Total Savings</span>
                 </div>
                 <div className="text-4xl font-black text-white">${results.reduce((acc, r) => acc + r.savings, 0).toFixed(2)}</div>
              </div>
              <div className="glass p-8 rounded-3xl border-white/5 bg-blue-500/5">
                 <div className="flex items-center gap-3 mb-2 text-blue-400">
                    <TrendingDown className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Efficiency Boost</span>
                 </div>
                 <div className="text-4xl font-black text-white">+{Math.round((results.reduce((acc, r) => acc + (r.cost_after/r.cost_before), 0) / results.length) * 100)}%</div>
              </div>
              <div className="glass p-8 rounded-3xl border-white/5 bg-purple-500/5">
                 <div className="flex items-center gap-3 mb-2 text-purple-400">
                    <Box className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Items Processed</span>
                 </div>
                 <div className="text-4xl font-black text-white">{results.length}</div>
              </div>
           </div>

           <div className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3 glass rounded-3xl border-white/5 overflow-hidden">
                 <div className="px-6 py-4 bg-white/[0.01] border-b border-white/5 font-black uppercase tracking-widest text-xs text-gray-500">Detailed Breakdown</div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                       <thead>
                          <tr className="bg-white/[0.02] text-gray-500 border-b border-white/5">
                             <th className="px-6 py-4">ID</th>
                             <th className="px-6 py-4">Original Box</th>
                             <th className="px-6 py-4">Optimized Box</th>
                             <th className="px-6 py-4">Savings</th>
                             <th className="px-6 py-4"></th>
                          </tr>
                       </thead>
                       <tbody>
                          {results.map((r, i) => (
                             <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => setSelectedResult(r)}>
                                <td className="px-6 py-4 text-gray-400 font-mono">{r.product_id}</td>
                                <td className="px-6 py-4 text-gray-500">{r.original_box}</td>
                                <td className="px-6 py-4 text-[#00E5CC] font-bold">{r.optimized_box}</td>
                                <td className="px-6 py-4 text-green-400 font-black">${r.savings.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right"><ArrowRight className="w-4 h-4 text-gray-700" /></td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                 {selectedResult ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass p-8 rounded-3xl border-[#00E5CC]/20 bg-[#00E5CC]/5 sticky top-24">
                       <h4 className="text-xl font-black text-white mb-6">3D Solution Preview</h4>
                       <OptimizedBoxViewer dimensions={selectedResult.optimized_box} />
                       <div className="mt-8 space-y-4">
                          <div className="flex justify-between text-sm">
                             <span className="text-gray-500">Optimized Box</span>
                             <span className="text-white font-bold">{selectedResult.optimized_box}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                             <span className="text-gray-500">Cost Reduction</span>
                             <span className="text-green-400 font-black">-{Math.round((1 - selectedResult.cost_after/selectedResult.cost_before) * 100)}%</span>
                          </div>
                          <p className="text-xs text-gray-400 italic leading-relaxed pt-4 border-t border-white/5">{selectedResult.reasoning}</p>
                       </div>
                    </motion.div>
                 ) : (
                    <div className="glass p-12 rounded-3xl border-dashed border-white/10 flex flex-col items-center justify-center text-center">
                       <Box className="w-12 h-12 text-gray-800 mb-4" />
                       <p className="text-sm text-gray-600 font-medium">Select a row to visualize the <br />optimized 3D solution</p>
                    </div>
                 )}
              </div>
           </div>

           <div className="flex justify-center pt-8">
              <button 
                onClick={() => { setResults(null); setFile(null); setSelectedResult(null); }}
                className="bg-white/5 hover:bg-white/10 text-white px-10 py-4 rounded-2xl font-black text-sm transition-all border border-white/10"
              >
                 Optimize New Batch
              </button>
           </div>
        </motion.div>
      )}
    </div>
  )
}
