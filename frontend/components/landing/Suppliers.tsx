'use client'

import { motion } from 'framer-motion'

const PARTNERS = ['FedEx', 'Blue Dart', 'UPS', 'DHL', 'Amazon', 'Shiprocket', 'Delhivery', 'Ecomm']

export default function Suppliers() {
  return (
    <section id="suppliers" className="py-20 bg-black/20 overflow-hidden">
      <div className="space-y-12">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Global Partners & Integrations</p>
        </div>

        <div className="flex flex-col gap-8">
          {/* Row 1 */}
          <div className="flex overflow-hidden group">
            <motion.div
              className="flex gap-12 items-center whitespace-nowrap animate-scroll-left"
              animate={{ x: [0, -1000] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              {[...PARTNERS, ...PARTNERS, ...PARTNERS].map((partner, i) => (
                <span key={i} className="text-2xl md:text-4xl font-black font-space-grotesk text-white/5 uppercase tracking-widest hover:text-blue-500/20 transition-colors cursor-default">
                  {partner}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Row 2 */}
          <div className="flex overflow-hidden group">
            <motion.div
              className="flex gap-12 items-center whitespace-nowrap"
              animate={{ x: [-1000, 0] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              {[...PARTNERS, ...PARTNERS, ...PARTNERS].reverse().map((partner, i) => (
                <span key={i} className="text-2xl md:text-4xl font-black font-space-grotesk text-white/5 uppercase tracking-widest hover:text-cyan-500/20 transition-colors cursor-default">
                  {partner}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
