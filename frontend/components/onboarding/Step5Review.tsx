'use client'

import { motion } from 'framer-motion'
import { Edit2, Building2, MapPin, Globe, Phone, Briefcase } from 'lucide-react'
import Image from 'next/image'

interface Step4Props {
  data: any
  onEdit: (step: number) => void
}

export default function Step4Review({ data, onEdit }: Step4Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-bold font-space-grotesk text-white">Review & Confirm</h2>
        <p className="text-zinc-400">Make sure everything looks correct before we finish.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Info */}
        <div className="relative group bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <button
            onClick={() => onEdit(2)}
            className="absolute top-4 right-4 p-2 bg-white/5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 text-blue-400">
            <Building2 className="w-5 h-5" />
            <h3 className="font-bold">Company Profile</h3>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Name</span>
              <span className="text-white">{data.companyName}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Industry</span>
              <span className="text-white">{data.industry}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Address</span>
              <span className="text-white line-clamp-2">{data.address}</span>
            </div>
          </div>
        </div>

        {/* Contact & Logo */}
        <div className="relative group bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <button
            onClick={() => onEdit(3)}
            className="absolute top-4 right-4 p-2 bg-white/5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 text-cyan-400">
            <Globe className="w-5 h-5" />
            <h3 className="font-bold">Branding & Contact</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden">
                {data.logoPreview ? (
                  <Image src={data.logoPreview} alt="Logo" fill className="object-contain p-2" />
                ) : (
                  <span className="text-2xl font-bold text-white/10">{data.companyName?.[0]}</span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Logo</span>
                <span className="text-white text-sm">{data.logoFile ? 'Custom Logo Uploaded' : 'Default Avatar'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {data.website && (
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <Globe className="w-4 h-4 text-zinc-500" />
                  {data.website}
                </div>
              )}
              {data.phone && (
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <Phone className="w-4 h-4 text-zinc-500" />
                  {data.phone}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
