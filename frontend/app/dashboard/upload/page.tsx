'use client'

import { useState, useRef, useCallback } from 'react'
import { UploadCloud, FileText, FileSpreadsheet, AlertCircle, CheckCircle2, Play, RefreshCw, XCircle, Zap } from 'lucide-react'
import { toast } from 'sonner'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { motion } from 'framer-motion'
import Link from 'next/link'

const REQUIRED_COLUMNS = [
  'product_id', 'name', 'width_cm', 'height_cm', 'breadth_cm', 
  'weight_kg', 'current_box_size', 'current_cost_usd'
]

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [isValidated, setIsValidated] = useState(false)
  
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{ success: number; failed: any[] } | null>(null)
  const [activeTab, setActiveTab] = useState<'success' | 'failed'>('success')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const validateColumns = (headers: string[]) => {
    const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col))
    if (missing.length > 0) {
      toast.error(`Missing required columns: ${missing.join(', ')}`)
      return false
    }
    return true
  }

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile)
    setParsedData([])
    setIsValidated(false)
    setResults(null)

    const fileType = selectedFile.name.split('.').pop()?.toLowerCase()

    if (fileType === 'csv') {
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.meta.fields && validateColumns(results.meta.fields)) {
            setParsedData(results.data)
            setIsValidated(true)
            toast.success('CSV parsed successfully!')
          } else {
            setFile(null)
          }
        },
        error: (error: any) => {
          toast.error(`Error parsing CSV: ${error.message}`)
          setFile(null)
        }
      })
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json(worksheet)
        
        if (json.length > 0) {
          const headers = Object.keys(json[0] as object)
          if (validateColumns(headers)) {
            setParsedData(json)
            setIsValidated(true)
            toast.success('Excel parsed successfully!')
          } else {
            setFile(null)
          }
        } else {
          toast.error('Excel file is empty.')
          setFile(null)
        }
      }
      reader.readAsBinaryString(selectedFile)
    } else {
      toast.error('Unsupported file format. Please upload CSV or XLSX.')
      setFile(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const runOptimization = async () => {
    if (!parsedData.length) return
    setIsOptimizing(true)
    setProgress(0)
    
    // Send data to backend in batches of 10 or just send all and let backend stream progress (polling or just simple fetch)
    // To simulate progress UI since we are just making a single POST request in reality
    // We will do a single POST request but we can mock a progress bar going up while waiting
    
    let simulatedProgress = 0
    const progressInterval = setInterval(() => {
      simulatedProgress += Math.random() * 5
      if (simulatedProgress > 90) simulatedProgress = 90
      setProgress(Math.round(simulatedProgress))
    }, 500)

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: parsedData }),
      })
      
      const data = await response.json()
      clearInterval(progressInterval)
      setProgress(100)
      
      if (!response.ok) throw new Error(data.error || 'Optimization failed')
      
      setResults({ success: data.successCount || 0, failed: data.failedProducts || [] })
      toast.success('Optimization completed!')
    } catch (error: any) {
      clearInterval(progressInterval)
      toast.error(`Error: ${error.message}`)
      setProgress(0)
    } finally {
      setIsOptimizing(false)
    }
  }

  return (
    <div className="fade-in space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Upload & Optimize</h1>
        <p className="text-gray-400 text-sm">Upload your product packaging data to run AI-powered size and cost optimization.</p>
      </div>

      {!results && (
        <>
          {/* Upload Zone */}
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200 ${
              isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:border-indigo-500/50 hover:bg-white/[0.07]'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex justify-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-600/20 text-green-400 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Drag & drop your file here</h3>
            <p className="text-sm text-gray-400 mb-6">Supports CSV and XLSX files</p>
            <input
              type="file"
              accept=".csv, .xlsx, .xls"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => e.target.files && processFile(e.target.files[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
            >
              Browse Files
            </button>
          </div>

          <div className="glass rounded-xl p-4 border border-indigo-500/20 bg-indigo-500/5 flex gap-3">
            <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-indigo-300">Required Column Format</p>
              <p className="text-xs text-indigo-200/70 mt-1 font-mono tracking-tight">
                {REQUIRED_COLUMNS.join(', ')}
              </p>
            </div>
          </div>

          {/* Preview & Action */}
          {isValidated && parsedData.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                  <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Preview ({parsedData.length} products found)
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm whitespace-nowrap">
                    <thead>
                      <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.01]">
                        {REQUIRED_COLUMNS.map(col => (
                          <th key={col} className="px-6 py-3 text-left">{col.replace(/_/g, ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parsedData.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          {REQUIRED_COLUMNS.map(col => (
                            <td key={col} className="px-6 py-3 text-gray-300">{row[col] ?? '—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedData.length > 5 && (
                    <div className="p-3 text-center text-xs text-gray-500 bg-white/[0.01]">
                      ... and {parsedData.length - 5} more rows
                    </div>
                  )}
                </div>
              </div>

              {isOptimizing ? (
                <div className="glass rounded-2xl p-6 border border-white/5 text-center">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Optimizing {parsedData.length} products...</h3>
                  <div className="w-full bg-white/5 rounded-full h-2 mb-2 max-w-md mx-auto overflow-hidden">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                  <p className="text-sm text-gray-400">{progress}% completed</p>
                </div>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={runOptimization}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white px-8 py-3 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
                  >
                    <Play className="w-4 h-4" />
                    Run AI Optimization
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </>
      )}

      {/* Results View */}
      {results && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="glass p-6 rounded-2xl border border-green-500/20 bg-green-500/5 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-white">{results.success}</h3>
              <p className="text-green-400 text-sm">Successfully Optimized</p>
            </div>
            <div className="glass p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-center">
              <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-white">{results.failed.length}</h3>
              <p className="text-red-400 text-sm">Failed to Process</p>
            </div>
          </div>

          {results.failed.length > 0 && (
            <div className="glass rounded-2xl border border-white/5 overflow-hidden">
              <div className="flex border-b border-white/5 bg-white/[0.02]">
                <button 
                  onClick={() => setActiveTab('failed')}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'failed' ? 'text-red-400 border-b-2 border-red-400' : 'text-gray-400 hover:text-gray-300'}`}
                >
                  Failed Products ({results.failed.length})
                </button>
              </div>
              
              <div className="p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5">
                      <th className="px-4 py-2 text-left">Product</th>
                      <th className="px-4 py-2 text-left">Error Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.failed.map((f, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="px-4 py-3 text-gray-300">{f.name || f.product_id || 'Unknown'}</td>
                        <td className="px-4 py-3 text-red-400">{f.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => {
                setResults(null)
                setFile(null)
                setParsedData([])
                setIsValidated(false)
              }}
              className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors border border-white/10"
            >
              Upload Another File
            </button>
            <Link
              href="/dashboard/results"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              View Detailed Results
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  )
}
