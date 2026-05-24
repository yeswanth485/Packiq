'use client'

import { motion } from 'framer-motion'
import { Cpu, UploadCloud, View, Banknote, Leaf, Puzzle } from 'lucide-react'

const FEATURES = [
  {
    title: 'AI Smart Sizing',
    description: 'FFD bin-packing finds the smallest perfect box for every product dimensions.',
    icon: Cpu,
    color: 'text-blue-400'
  },
  {
    title: 'Bulk Optimization',
    description: 'Upload thousands of SKUs via CSV and optimize your entire catalog in seconds.',
    icon: UploadCloud,
    color: 'text-cyan-400'
  },
  {
    title: '3D Visualization',
    description: 'Inspect packaging from every angle with our high-fidelity 3D box engine.',
    icon: View,
    color: 'text-purple-400'
  },
  {
    title: 'Cost Intelligence',
    description: 'Real-time DIM weight and carrier pricing calculations for instant ROI.',
    icon: Banknote,
    color: 'text-emerald-400'
  },
  {
    title: 'Sustainability',
    description: 'Track CO2 reduction, eco-scores, and material waste across your supply chain.',
    icon: Leaf,
    color: 'text-green-400'
  },
  {
    title: 'API Integration',
    description: 'Connect to FedEx, DHL, Shiprocket, and Delhivery with one unified API.',
    icon: Puzzle,
    color: 'text-blue-500'
  }
]

export default function Features() {
  return (
    <section id="features" className="py-32 px-6">
      <div className="max-w-7xl mx-auto space-y-20">
        <div className="text-center space-y-6">
          <h2 className="text-4xl md:text-6xl font-bold font-space-grotesk text-white tracking-tighter">
            Everything you need to<br /> optimize packaging
          </h2>
          <p className="text-zinc-500 max-w-2xl mx-auto font-medium">
            Powerful tools designed for modern logistics teams who refuse to overpay for air and waste.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              className="group p-10 bg-white/[0.02] border border-white/5 rounded-[40px] hover:border-blue-500/30 transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 space-y-6">
                <div className={`w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center ${feature.color}`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-white font-space-grotesk">{feature.title}</h3>
                  <p className="text-zinc-500 leading-relaxed">{feature.description}</p>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
