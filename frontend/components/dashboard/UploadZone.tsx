'use client'

import { useRef, useState } from 'react'
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface UploadZoneProps {
  onSuccess?: (count: number) => void
}

export default function UploadZone({ onSuccess }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [dragging, setDragging] = useState(false)

  async function handleFile(file: File) {
    setStatus('uploading')
    setMessage('')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setStatus('success')
      setMessage(`${data.inserted} products imported successfully`)
      onSuccess?.(data.inserted)
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer
        ${dragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-indigo-500/50 hover:bg-white/[0.02]'}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault(); setDragging(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
    >
      <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
      }} />

      {status === 'idle' && (
        <>
          <Upload className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
          <p className="text-white font-medium">Drop a CSV file here or click to browse</p>
          <p className="text-gray-500 text-sm mt-1">Columns: name, sku, weight_kg, length_cm, width_cm, height_cm, fragile, category</p>
        </>
      )}
      {status === 'uploading' && (
        <>
          <Loader2 className="w-10 h-10 text-indigo-400 mx-auto mb-3 animate-spin" />
          <p className="text-white font-medium">Importing products…</p>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-green-400 font-medium">{message}</p>
          <button onClick={(e) => { e.stopPropagation(); setStatus('idle') }} className="text-gray-500 text-sm mt-2 hover:text-white">Upload another</button>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 font-medium">{message}</p>
          <button onClick={(e) => { e.stopPropagation(); setStatus('idle') }} className="text-gray-500 text-sm mt-2 hover:text-white">Try again</button>
        </>
      )}

      {status === 'idle' && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <FileText className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-500">CSV format</span>
        </div>
      )}
    </div>
  )
}
