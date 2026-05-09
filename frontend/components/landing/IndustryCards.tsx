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
    <section className="py-24 px-6 bg-white/[0.01] overflow-hidden">
      <div className="max-w-[1200px] mx-auto mb-16 text-center md:text-left">
        <h2 className="text-3xl md:text-5xl font-bold font-syne mb-4">Industry Use Cases</h2>
        <p className="text-gray-500">Tailored AI models for your specific manufacturing challenges.</p>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-10 px-4 md:px-0 no-scrollbar">
        {INDUSTRIES.map((industry, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -8 }}
            className="min-w-[300px] md:min-w-[380px] bg-white/[0.03] border border-white/5 rounded-3xl p-8 group transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-[#00FFD1]/10 flex items-center justify-center mb-6 border border-[#00FFD1]/20">
              <industry.icon className="w-6 h-6 text-[#00FFD1]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{industry.name}</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6 h-12">{industry.desc}</p>
            
            <div className="pt-6 border-t border-white/5">
              <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Defect caught example</div>
              <div className="text-sm font-bold text-[#00FFD1]/80">{industry.example}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
