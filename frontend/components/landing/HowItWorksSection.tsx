'use client'

import { motion } from 'framer-motion'
import { Upload, Cpu, CheckCircle, Truck } from 'lucide-react'

const STEPS = [
  {
    icon: Upload,
    title: 'Upload Product Data',
    desc: 'Import your product catalog via CSV/Excel with dimensions, weight, and SKU details.',
    color: '#00FFD1',
  },
  {
    icon: Cpu,
    title: 'AI FFD Optimization',
    desc: 'Our First Fit Decreasing engine powered by Claude AI finds the perfect box for every product.',
    color: '#4361EE',
  },
  {
    icon: CheckCircle,
    title: 'Review & Pack',
    desc: 'Compare results in 3D, follow step-by-step packing instructions for your team.',
    color: '#22c55e',
  },
  {
    icon: Truck,
    title: 'Ship & Track',
    desc: 'Ship orders with auto-generated tracking IDs and monitor delivery performance.',
    color: '#F59E0B',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-40 px-6 relative bg-[#0A0A0F] overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-[#00FFD1]/3 rounded-full blur-[200px] pointer-events-none" />

      <div className="max-w-[1300px] mx-auto">
        <div className="text-center mb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-[10px] font-black text-[#00FFD1] uppercase tracking-[0.5em] mb-6">Workflow Optimization</div>
            <h2 className="text-5xl md:text-8xl font-bold font-syne tracking-tighter leading-[0.9] mb-10">
              Four steps to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFD1] to-[#185FA5]">
                Seamless Logistics
              </span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium">
              From inventory sync to final dispatch—automated for efficiency.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-4 gap-8 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-[80px] left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />

          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="group relative z-10"
            >
              <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[48px] hover:bg-white/[0.05] hover:border-[#00FFD1]/20 transition-all duration-700 h-full flex flex-col items-center text-center shadow-2xl">
                {/* Step icon */}
                <div
                  className="w-[96px] h-[96px] rounded-3xl border border-white/10 flex items-center justify-center mb-8 relative group-hover:scale-110 transition-transform duration-700 overflow-hidden shadow-xl"
                  style={{ backgroundColor: `${step.color}15` }}
                >
                  <step.icon className="w-10 h-10" style={{ color: step.color }} />
                  <div
                    className="absolute -bottom-2 -right-2 text-[40px] font-black opacity-[0.05] font-syne pointer-events-none"
                    style={{ color: step.color }}
                  >
                    0{i + 1}
                  </div>
                </div>

                <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-4">
                  Phase 0{i + 1}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[#00FFD1] transition-colors tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
