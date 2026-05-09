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

export function HeroSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const headline = "Your Packaging Line. Zero Defects. Zero Compromise."
  const words = headline.split(" ")

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden grid-overlay">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0F]/50 to-[#0A0A0F] pointer-events-none" />
      
      {/* Floating Elements */}
      <FloatingBox x="10%" y="20%" size={60} delay={0} />
      <FloatingBox x="80%" y="15%" size={80} delay={2} />
      <FloatingBox x="75%" y="70%" size={50} delay={4} />
      <FloatingBox x="15%" y="75%" size={70} delay={6} />
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00FFD1]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-6 relative z-10 text-center">
        <StaggerContainer>
          <h1 className="text-5xl md:text-7xl font-bold font-syne tracking-tight mb-6 flex flex-wrap justify-center gap-x-4">
            {words.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="inline-block"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <StaggerItem>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 font-sans">
              AI-powered visual inspection at 1,200 units/min — built for manufacturers competing globally.
            </p>
          </StaggerItem>

          <StaggerItem className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link 
              href="/auth/signup" 
              className="bg-[#00FFD1] text-[#0A0A0F] px-8 py-4 rounded-lg font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,255,209,0.3)]"
            >
              Book a Demo <ArrowRight className="w-5 h-5" />
            </Link>
            <button className="border border-[#00FFD1]/30 hover:bg-[#00FFD1]/10 text-white px-8 py-4 rounded-lg font-bold flex items-center gap-2 transition-all">
              <Play className="w-5 h-5" /> See It Live
            </button>
          </StaggerItem>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 w-full max-w-4xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold font-mono text-[#00FFD1] mb-2">
                <CountUpNumber value={99.3} suffix="%" decimals={1} />
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Detection Accuracy</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold font-mono text-[#00FFD1] mb-2">
                <CountUpNumber value={1200} />
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Units / Min</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold font-mono text-[#00FFD1] mb-2">
                <CountUpNumber value={18} suffix="ms" />
              </div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Inference Time</p>
            </div>
          </div>
        </StaggerContainer>
      </div>

      {/* Marquee Ticker */}
      <div className="absolute bottom-10 left-0 w-full border-y border-white/5 py-4 bg-white/[0.02] overflow-hidden whitespace-nowrap">
        <div className="flex animate-marquee">
          {[...INDUSTRIES, ...INDUSTRIES].map((industry, i) => (
            <span key={i} className="mx-8 text-[12px] font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FFD1]" /> {industry}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
