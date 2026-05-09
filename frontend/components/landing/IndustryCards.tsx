'use client'

import { motion } from 'framer-motion'
import { Utensils, Pill, Shirt, ShoppingBag, Laptop, Truck } from 'lucide-react'

const INDUSTRIES = [
  {
    icon: Utensils,
    name: "Food & Beverage",
    desc: "Detect seal breaches, label misalignments, and foreign objects at high speed.",
    example: "Leaking tetra pak detected"
  },
  {
    icon: Pill,
    name: "Pharma",
    desc: "Verify blister pack completeness and serial code legibility (100% accuracy).",
    example: "Missing capsule in blister"
  },
  {
    icon: Shirt,
    name: "Textiles",
    desc: "Identify fabric defects, stitching errors, and barcode verification on hangtags.",
    example: "Color bleed on garment"
  },
  {
    icon: ShoppingBag,
    name: "FMCG",
    desc: "Monitor case packing and shrink wrap integrity across diverse product lines.",
    example: "Dented aerosol can"
  },
  {
    icon: Laptop,
    name: "Electronics",
    desc: "Inspection of anti-static packaging and component placement verification.",
    example: "Bent pin on PCB"
  },
  {
    icon: Truck,
    name: "E-Commerce",
    desc: "Verify shipment contents and box dimensions to eliminate shipping errors.",
    example: "Incorrect item for shipment"
  }
]

export function IndustryCards() {
  return (
    <section className="py-32 px-6 bg-[#0A0A0F] overflow-hidden relative">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#00FFD1]/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-[1200px] mx-auto mb-20 text-center md:text-left">
        <h2 className="text-4xl md:text-6xl font-bold font-syne mb-6 leading-tight">Industry <br className="hidden md:block" /><span className="text-[#00FFD1]">Use Cases</span></h2>
        <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">Tailored AI models trained on millions of units for your specific manufacturing and packaging challenges.</p>
      </div>

      <div className="flex gap-8 overflow-x-auto pb-12 px-4 md:px-0 no-scrollbar perspective-1000">
        {INDUSTRIES.map((industry, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -12, scale: 1.02 }}
            className="min-w-[320px] md:min-w-[420px] bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[40px] p-10 group transition-all duration-500 hover:bg-white/[0.04] hover:border-[#00FFD1]/20"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#00FFD1]/10 flex items-center justify-center mb-8 border border-[#00FFD1]/20 group-hover:scale-110 transition-transform duration-500">
              <industry.icon className="w-8 h-8 text-[#00FFD1]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[#00FFD1] transition-colors">{industry.name}</h3>
            <p className="text-base text-gray-400 leading-relaxed mb-10 h-16">{industry.desc}</p>
            
            <div className="pt-8 border-t border-white/5 relative overflow-hidden">
              <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-3">Real-time Defect Analysis</div>
              <div className="text-lg font-bold text-white/90 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {industry.example}
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-0 group-hover:opacity-10 transition-opacity">
                <industry.icon className="w-24 h-24 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
