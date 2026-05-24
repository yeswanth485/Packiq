'use client'

import { motion } from 'framer-motion'
import CountUp from 'react-countup'

const STATS = [
  { label: 'SKUs Optimized', value: 50000, suffix: '+' },
  { label: 'Savings Generated', value: 24, prefix: '₹', suffix: 'Cr' },
  { label: 'Avg Cost Reduction', value: 34, suffix: '%' },
  { label: 'Engine Uptime', value: 99.9, suffix: '%' },
]

export default function StatsBar() {
  return (
    <section className="px-6 py-20 relative z-10">
      <div className="max-w-7xl mx-auto bg-white/[0.02] border border-white/5 backdrop-blur-2xl rounded-[40px] p-10 md:p-16 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center space-y-4"
            >
              <div className="text-4xl md:text-5xl font-bold font-space-grotesk text-white">
                {stat.prefix}
                <CountUp end={stat.value} duration={2.5} decimals={stat.value % 1 !== 0 ? 1 : 0} enableScrollSpy scrollSpyOnce />
                {stat.suffix}
              </div>
              <div className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
