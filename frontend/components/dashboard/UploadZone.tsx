'use client'

import { useRef, useState } from 'react'
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, FileCode } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface UploadZoneProps {
  onSuccess?: (count: number) => void
}

export default function UploadZone({ onSuccess }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState('')

  async function handleFile(file: File) {
    setFileName(file.name)
    setStatus('uploading')
    setMessage('')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setStatus('success')
      setMessage(`${data.inserted} products imported & optimizing...`)
      onSuccess?.(data.inserted)
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  return (
    <div
      className={`relative group overflow-hidden border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-500 cursor-pointer
        ${dragging ? 'border-blue-500 bg-blue-500/5' : 'border-white/10 hover:border-blue-500/30 hover:bg-white/[0.01]'}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault(); setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
    >
      <input ref={inputRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
      }} />

      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
              <Upload className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Upload Inventory</h3>
            <p className="text-zinc-500 max-w-xs mx-auto text-sm leading-relaxed">
              Drag and drop your <span className="text-blue-400 font-medium">CSV or Excel</span> file to start the AI optimization engine.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-zinc-400 uppercase tracking-widest">
                <FileText size={12} /> CSV
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-zinc-400 uppercase tracking-widest">
                <FileCode size={12} /> XLSX
              </div>
            </div>
          </motion.div>
        )}

        {status === 'uploading' && (
          <motion.div 
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-4"
          >
            <div className="relative w-16 h-16 mx-auto mb-6">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin absolute inset-0" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full blur-xl animate-pulse" />
              </div>
            </div>
            <p className="text-white font-medium mb-2">Analyzing {fileName}...</p>
            <p className="text-zinc-500 text-sm">Claude 3.5 Sonnet is optimizing your packaging.</p>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-white font-bold text-lg mb-2">{message}</p>
            <button 
              onClick={(e) => { e.stopPropagation(); setStatus('idle') }} 
              className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all text-sm mt-4"
            >
              Upload another
            </button>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div 
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-red-400 font-medium mb-2">{message}</p>
            <button 
              onClick={(e) => { e.stopPropagation(); setStatus('idle') }} 
              className="px-6 py-2 bg-red-400/10 hover:bg-red-400/20 rounded-xl text-red-400 transition-all text-sm mt-4"
            >
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
