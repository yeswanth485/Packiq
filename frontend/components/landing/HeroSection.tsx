'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Play, Box } from 'lucide-react'
import { StaggerContainer, StaggerItem } from '@/components/animations'
import BoxPreview from '@/components/3d/BoxPreview'

const FloatingBox = ({ delay = 0, x = '10%', y = '10%', size = 40 }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{
      opacity: [0.08, 0.25, 0.08],
      y: [-20, 20, -20],
      rotateX: [0, 360],
      rotateY: [0, 360],
    }}
    transition={{
      duration: 12,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
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
  const [showVideo, setShowVideo] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <section className="relative min-h-[95vh] flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[#0A0A0F] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#185FA5]/12 via-transparent to-[#0A0A0F] pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,209,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,209,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating boxes */}
      <FloatingBox x="8%" y="20%" size={60} delay={0} />
      <FloatingBox x="85%" y="15%" size={80} delay={2} />
      <FloatingBox x="78%" y="68%" size={50} delay={4} />
      <FloatingBox x="12%" y="72%" size={70} delay={6} />
      <FloatingBox x="50%" y="10%" size={35} delay={3} />

      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-[#00FFD1]/4 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 relative z-10 w-full">
        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — Text */}
          <div className="text-left">
            <StaggerItem>
              <div className="inline-flex items-center gap-2 bg-[#00FFD1]/10 border border-[#00FFD1]/25 px-4 py-2 rounded-full mb-8">
                <div className="w-2 h-2 rounded-full bg-[#00FFD1] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#00FFD1]">
                  FFD-Powered Optimization Engine
                </span>
              </div>
            </StaggerItem>

            <StaggerItem>
              <h1 className="text-6xl md:text-8xl font-bold font-syne tracking-tight mb-6 leading-[1.0]">
                AI-<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFD1] via-[#00d4b0] to-[#185FA5]">
                  Powered
                </span>
                <br />
                Packaging<br />
                Automation
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="text-xl text-gray-400 max-w-xl mb-12 font-sans leading-relaxed">
                Design smarter. Ship faster. Scale effortlessly. PackIQ eliminates dimensional weight waste with spatial intelligence.
              </p>
            </StaggerItem>

            <StaggerItem>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <Link
                  href="/auth/signup"
                  className="w-full sm:w-auto bg-[#00FFD1] text-[#0A0A0F] px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(0,255,209,0.25)]"
                >
                  Get Started Free <ArrowRight className="w-5 h-5" />
                </Link>
                <button 
                  onClick={() => setShowVideo(true)}
                  className="w-full sm:w-auto bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all backdrop-blur-md"
                >
                  <Play className="w-5 h-5 text-[#00FFD1]" /> Watch Demo
                </button>
              </div>
            </StaggerItem>
          </div>

          {/* Right — 3D Box */}
          <div className="relative flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-[560px] aspect-square"
            >
              <div className="absolute inset-0 bg-[#00FFD1]/6 rounded-[60px] blur-[80px]" />
              <div className="relative z-10 w-full h-full border border-white/5 bg-white/[0.02] backdrop-blur-3xl rounded-[60px] p-4 flex items-center justify-center">
                <BoxPreview width={500} height={500} />
              </div>

              {/* Floating stat badge */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-6 -left-6 bg-[#0A0A0F]/90 backdrop-blur-xl border border-white/10 p-5 rounded-3xl z-20 shadow-2xl"
              >
                <div className="text-2xl font-bold text-[#00FFD1]">-32%</div>
                <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">DIM Waste</div>
              </motion.div>

              {/* Second badge */}
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-4 -right-4 bg-[#0A0A0F]/90 backdrop-blur-xl border border-white/10 p-5 rounded-3xl z-20 shadow-2xl"
              >
                <div className="text-2xl font-bold text-[#00FFD1]">99.4%</div>
                <div className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Accuracy</div>
              </motion.div>
            </motion.div>
          </div>

        </StaggerContainer>
      </div>

      {/* Logo marquee */}
      <div className="absolute bottom-0 left-0 w-full border-t border-white/5 py-6 bg-[#0A0A0F]">
        <div className="max-w-[1200px] mx-auto px-6 flex justify-between items-center opacity-40 hover:opacity-70 transition-opacity duration-700">
          {['FORBES', 'TECHCRUNCH', 'LOGISTICS', 'WAREHOUSE', 'FASTCO'].map(logo => (
            <span key={logo} className="text-lg font-black font-syne tracking-widest text-white/30">
              {logo}
            </span>
          ))}
        </div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          >
            <div className="relative w-full max-w-5xl aspect-video bg-[#0A0A0F] rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,255,209,0.15)]">
              <button 
                onClick={() => setShowVideo(false)} 
                className="absolute top-6 right-6 z-10 w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-md border border-white/10"
              >
                ✕
              </button>
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/lJIrF4YjHfQ?autoplay=1" 
                title="PackIQ Demo" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
