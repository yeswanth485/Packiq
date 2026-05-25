'use client'

import { motion } from 'framer-motion'
import { Upload, Cpu, View, Ship } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    title: 'Upload CSV',
    description: 'Drag & drop your entire product catalog for batch processing.',
    icon: Upload
  },
  {
    number: '02',
    title: 'AI Optimization',
    description: 'Our engine runs FFD algorithms to find the perfect fit.',
    icon: Cpu
  },
  {
    number: '03',
    title: 'Review in 3D',
    description: 'Visually inspect your results and compare box sizes.',
    icon: View
  },
  {
    number: '04',
    title: 'Ship & Save',
    description: 'Export optimized data and start saving on every parcel.',
    icon: Ship
  }
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-32 px-6 bg-[#0D1427]/30">
      <div className="max-w-7xl mx-auto space-y-20">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold font-space-grotesk text-white">How It Works</h2>
          <p className="text-zinc-500">Go from unoptimized to intelligent in minutes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-1/4 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/5 to-transparent -z-10" />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="space-y-6 text-center group"
            >
              <div className="relative mx-auto w-24 h-24 bg-[#0A0F1E] border border-white/10 rounded-full flex items-center justify-center group-hover:border-blue-500/50 transition-all duration-500">
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                  {step.number}
                </div>
                <step.icon className="w-10 h-10 text-zinc-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-white font-space-grotesk">{step.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed px-4">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
