'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, X, FileImage, Check } from 'lucide-react'
import Image from 'next/image'

interface Step3Props {
  data: any
  updateData: (updates: any) => void
}

export default function Step3LogoUpload({ data, updateData }: Step3Props) {
  const [preview, setPreview] = useState<string | null>(data.logoPreview || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit')
        return
      }
      const url = URL.createObjectURL(file)
      setPreview(url)
      updateData({ logoFile: file, logoPreview: url })
    }
  }

  const clearLogo = () => {
    setPreview(null)
    updateData({ logoFile: null, logoPreview: null })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold font-space-grotesk text-white">Company Logo</h2>
          <span className="text-sm text-zinc-500 font-medium">(Optional)</span>
        </div>
        <p className="text-zinc-400">Upload your logo to personalize your dashboard and reports.</p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-3xl p-8 transition-all flex flex-col items-center justify-center space-y-4 cursor-pointer ${
          preview ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 hover:border-white/20 bg-white/5'
        }`}
        onClick={() => !preview && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
        />

        {preview ? (
          <div className="relative group">
            <div className="relative w-40 h-40 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <Image src={preview} alt="Logo Preview" fill className="object-contain p-4" />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                clearLogo()
              }}
              className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="mt-4 text-center">
              <p className="text-sm font-medium text-white">{data.logoFile?.name}</p>
              <p className="text-xs text-zinc-500">{(data.logoFile?.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center">
              <Upload className="w-8 h-8 text-blue-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Click to upload or drag and drop</p>
              <p className="text-sm text-zinc-500 mt-1">PNG, JPG or WebP (Max 5MB)</p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Check className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-sm text-zinc-300">Dashboard branding</span>
        </div>
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Check className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="text-sm text-zinc-300">Sustainability reports</span>
        </div>
      </div>
    </motion.div>
  )
}
