'use client'

import { motion } from 'framer-motion'
import { Box, Zap, Eye, Boxes } from 'lucide-react'

const FEATURES = [
  {
    icon: Boxes,
    title: 'AI Smart Sizing',
    desc: 'FFD bin-packing engine finds the smallest box that fits, reducing DIM weight and shipping costs automatically.',
    color: '#00FFD1',
    num: '01',
  },
  {
    icon: Zap,
    title: 'Bulk Optimization',
    desc: 'Upload CSV with thousands of SKUs and get optimized results in seconds with Claude AI powering every decision.',
    color: '#4361EE',
    num: '02',
  },
  {
    icon: Eye,
    title: '3D Visualization',
    desc: 'Interactive 3D box viewer lets you inspect the optimized packaging from every angle before shipping.',
    color: '#F59E0B',
    num: '03',
  },
]

export function ProblemSection() {
  return (
    <section id="features" className="py-32 px-6 bg-[#0A0A0F] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[#185FA5]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-[10px] font-black text-[#00FFD1] uppercase tracking-[0.4em] mb-4">Features</div>
            <h2 className="text-4xl md:text-7xl font-bold font-syne mb-8 leading-tight tracking-tighter">
              Everything you need to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFD1] to-[#185FA5]">
                optimize packaging
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              From AI-powered box sizing to real-time shipment tracking — PackIQ covers your entire packaging workflow.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="group p-10 bg-white/[0.02] border border-white/5 rounded-[40px] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 h-full flex flex-col items-start text-left relative overflow-hidden"
            >
              {/* Number watermark */}
              <div
                className="absolute top-6 right-8 text-7xl font-black opacity-5 font-syne"
                style={{ color: feature.color }}
              >
                {feature.num}
              </div>

              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border border-white/5 group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundColor: `${feature.color}18` }}
              >
                <feature.icon className="w-8 h-8" style={{ color: feature.color }} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[#00FFD1] transition-colors">
                {feature.title}
              </h3>
              <p className="text-base text-gray-400 leading-relaxed">{feature.desc}</p>

              {/* Bottom accent line */}
              <div
                className="absolute bottom-0 left-0 w-0 h-[2px] group-hover:w-full transition-all duration-700 rounded-full"
                style={{ backgroundColor: feature.color }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
