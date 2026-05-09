'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Play, Box } from 'lucide-react'
import { StaggerContainer, StaggerItem, CountUpNumber } from '@/components/animations'

const INDUSTRIES = [
  "Food & Beverage", "Pharma", "FMCG", "Textiles", "Electronics", 
  "E-Commerce", "Auto Parts", "Logistics", "Manufacturing", 
  "Retail", "Healthcare", "Aerospace"
]

const FloatingBox = ({ delay = 0, x = '10%', y = '10%', size = 40 }) => (
  <motion.div
    initial={{ opacity: 0, y: 0 }}
    animate={{ 
      opacity: [0.1, 0.3, 0.1],
      y: [-20, 20, -20],
      rotateX: [0, 360],
      rotateY: [0, 360]
    }}
    transition={{ 
      duration: 10,
      repeat: Infinity,
      delay,
      ease: "easeInOut"
    }}
    style={{ left: x, top: y, perspective: 1000 }}
    className="absolute pointer-events-none"
  >
    <div 
      className="relative border border-[#00FFD1]/20 bg-[#00FFD1]/5 backdrop-blur-sm flex items-center justify-center rounded-lg"
      style={{ width: size, height: size }}
    >
      <Box className="w-1/2 h-1/2 text-[#00FFD1]/30" />
    </div>
  </motion.div>
)

import BoxPreview from '@/components/3d/BoxPreview'

export function HeroSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#185FA5]/10 via-[#0A0A0F] to-[#0A0A0F] pointer-events-none" />
      
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#00FFD1]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="text-left">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 bg-[#00FFD1]/10 border border-[#00FFD1]/20 px-4 py-2 rounded-full mb-8"
            >
              <div className="w-2 h-2 rounded-full bg-[#00FFD1] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00FFD1]">FFD-Powered Optimization Engine</span>
            </motion.div>

            <h1 className="text-5xl md:text-8xl font-bold font-syne tracking-tight mb-8 leading-[1.05] text-white">
              AI-<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFD1] to-[#185FA5]">POWERED</span><br />
              PACKAGING<br />
              AUTOMATION
            </h1>

            <p className="text-xl text-gray-400 max-w-xl mb-12 font-sans leading-relaxed">
              Design smarter. Ship faster. Scale effortlessly. PackAI eliminates dimensional weight waste with spatial intelligence.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Link 
                href="/auth/signup" 
                className="w-full sm:w-auto bg-[#00FFD1] text-[#0A0A0F] px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(0,255,209,0.2)]"
              >
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="w-full sm:w-auto bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all backdrop-blur-md">
                <Play className="w-5 h-5 text-[#00FFD1]" /> Watch Demo
              </button>
            </div>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative w-full max-w-[600px] aspect-square"
            >
              <div className="absolute inset-0 bg-[#00FFD1]/5 rounded-[60px] blur-[80px]" />
              <div className="relative z-10 w-full h-full border border-white/5 bg-white/[0.02] backdrop-blur-3xl rounded-[60px] p-4 flex items-center justify-center">
                <BoxPreview width={500} height={500} />
              </div>
              
              {/* Floating Stats */}
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-6 -left-6 bg-[#0A0A0F]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl z-20"
              >
                <div className="text-2xl font-bold text-[#00FFD1]">-32%</div>
                <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">DIM Waste</div>
              </motion.div>
            </motion.div>
          </div>

        </div>
      </div>

      {/* Marquee */}
      <div className="absolute bottom-0 left-0 w-full border-t border-white/5 py-8 bg-[#0A0A0F]">
        <div className="max-w-[1200px] mx-auto px-6 flex justify-between items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
           {/* Placeholder for logos */}
           {["FORBES", "TECHCRUNCH", "LOGISTICS", "WAREHOUSE", "FASTCO"].map(logo => (
             <span key={logo} className="text-xl font-black font-syne tracking-widest text-white/20">{logo}</span>
           ))}
        </div>
      </div>
    </section>
  )
}
