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
    <section id="how-it-works" className="py-32 px-6 relative bg-[#0A0A0F] overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-[#00FFD1]/3 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-[10px] font-black text-[#00FFD1] uppercase tracking-[0.4em] mb-4">How It Works</div>
            <h2 className="text-4xl md:text-7xl font-bold font-syne tracking-tighter leading-tight mb-6">
              Four steps to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFD1] to-[#185FA5]">
                smarter packaging
              </span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Our FFD engine and Claude AI work together to find the perfect box for every product.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-[60px] left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />

          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="group relative z-10"
            >
              <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[32px] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 h-full flex flex-col items-center text-center">
                {/* Step icon */}
                <div
                  className="w-[72px] h-[72px] rounded-2xl border border-white/5 flex items-center justify-center mb-6 relative group-hover:scale-110 transition-transform duration-500 overflow-hidden"
                  style={{ backgroundColor: `${step.color}12` }}
                >
                  {/* Step number overlay */}
                  <div
                    className="absolute top-1 right-1 text-[9px] font-black opacity-70 font-syne"
                    style={{ color: step.color }}
                  >
                    0{i + 1}
                  </div>
                  <step.icon className="w-9 h-9" style={{ color: step.color }} />
                </div>

                <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3">
                  Step 0{i + 1}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#00FFD1] transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
