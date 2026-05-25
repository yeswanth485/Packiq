'use client'

import { motion } from 'framer-motion'
import { Building2, Globe, MapPin, Phone, Briefcase } from 'lucide-react'

interface Step2Props {
  data: any
  updateData: (updates: any) => void
}

const INDUSTRIES = [
  'E-commerce',
  'Retail',
  'Manufacturing',
  'Logistics',
  'Pharma',
  'Electronics',
  'Other'
]

export default function Step2CompanyDetails({ data, updateData }: Step2Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <h2 className="text-2xl font-bold font-space-grotesk text-white">Company Details</h2>
        <p className="text-zinc-400">Tell us a bit about your business.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Company Name *
          </label>
          <input
            type="text"
            required
            value={data.companyName}
            onChange={(e) => updateData({ companyName: e.target.value })}
            placeholder="Acme Corp"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Industry *
          </label>
          <select
            required
            value={data.industry}
            onChange={(e) => updateData({ industry: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          >
            <option value="" disabled className="bg-[#0A0F1E]">Select Industry</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind} className="bg-[#0A0F1E]">
                {ind}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Company Address *
          </label>
          <textarea
            required
            value={data.address}
            onChange={(e) => updateData({ address: e.target.value })}
            placeholder="123 Smart Way, Logistics Park..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all h-24 resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number (Optional)
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => updateData({ phone: e.target.value })}
            placeholder="+91 98765 43210"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Website URL (Optional)
          </label>
          <input
            type="url"
            value={data.website}
            onChange={(e) => updateData({ website: e.target.value })}
            placeholder="https://acme.com"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>
    </motion.div>
  )
}
