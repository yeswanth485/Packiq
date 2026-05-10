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
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-32 overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[#0A0A0F] pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#185FA5]/15 via-transparent to-[#0A0A0F] pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,209,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,209,0.3) 1px, transparent 1px)`,
          backgroundSize: '100px 100px',
        }}
      />

      {/* Floating boxes */}
      <FloatingBox x="5%" y="15%" size={80} delay={0} />
      <FloatingBox x="88%" y="10%" size={120} delay={2} />
      <FloatingBox x="82%" y="75%" size={70} delay={4} />
      <FloatingBox x="10%" y="80%" size={90} delay={6} />
      <FloatingBox x="45%" y="5%" size={45} delay={3} />

      {/* Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-[#00FFD1]/5 rounded-full blur-[200px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-[#185FA5]/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-10 relative z-10 w-full">
        <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">

          {/* Left — Text */}
          <div className="text-left">
            <StaggerItem>
              <div className="inline-flex items-center gap-3 bg-[#00FFD1]/5 border border-[#00FFD1]/20 px-5 py-2.5 rounded-full mb-10 backdrop-blur-md">
                <div className="w-2.5 h-2.5 rounded-full bg-[#00FFD1] shadow-[0_0_10px_#00FFD1] animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00FFD1]">
                  Next-Gen Logistics Engine
                </span>
              </div>
            </StaggerItem>

            <StaggerItem>
              <h1 className="text-7xl md:text-[110px] font-bold font-syne tracking-tighter mb-8 leading-[0.85]">
                AI-<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFD1] via-[#00d4b0] to-[#185FA5] animate-gradient-x">
                  Driven
                </span>
                <br />
                Packaging
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="text-2xl text-gray-500 max-w-xl mb-14 font-medium leading-relaxed">
                Stop shipping air. PackIQ uses advanced spatial AI to minimize DIM weight and automate selection.
              </p>
            </StaggerItem>

            <StaggerItem>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Link
                  href="/auth/signup"
                  className="w-full sm:w-auto bg-[#00FFD1] text-[#0A0A0F] px-12 py-6 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-[0_0_50px_rgba(0,255,209,0.3)] group"
                >
                  Start Optimizing <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button 
                  onClick={() => setShowVideo(true)}
                  className="w-full sm:w-auto bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] text-white px-12 py-6 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all backdrop-blur-xl group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#00FFD1]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 text-[#00FFD1] fill-[#00FFD1]" />
                  </div>
                  Watch Demo
                </button>
              </div>
            </StaggerItem>
          </div>

          {/* Right — 3D Box */}
          <div className="relative flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[640px] aspect-square"
            >
              <div className="absolute inset-0 bg-[#00FFD1]/8 rounded-[80px] blur-[100px] animate-pulse" />
              <div className="relative z-10 w-full h-full border border-white/10 bg-white/[0.01] backdrop-blur-3xl rounded-[80px] p-6 flex items-center justify-center shadow-2xl">
                <BoxPreview width={580} height={580} />
              </div>

              {/* Badges */}
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-10 -left-10 bg-[#0A0A0F]/80 backdrop-blur-2xl border border-white/10 p-7 rounded-[32px] z-20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              >
                <div className="text-3xl font-bold text-[#00FFD1] tracking-tighter">-32%</div>
                <div className="text-[10px] text-gray-600 uppercase font-black tracking-widest mt-1">DIM Waste Reduced</div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-6 -right-6 bg-[#0A0A0F]/80 backdrop-blur-2xl border border-white/10 p-7 rounded-[32px] z-20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
              >
                <div className="text-3xl font-bold text-[#185FA5] tracking-tighter">99.4%</div>
                <div className="text-[10px] text-gray-600 uppercase font-black tracking-widest mt-1">Spatial Accuracy</div>
              </motion.div>
            </motion.div>
          </div>

        </StaggerContainer>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0A0F]/95 backdrop-blur-2xl p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-6xl aspect-video bg-black rounded-[40px] overflow-hidden border border-white/10 shadow-[0_0_150px_rgba(0,255,209,0.2)]"
            >
              <button 
                onClick={() => setShowVideo(false)} 
                className="absolute top-8 right-8 z-20 w-14 h-14 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all backdrop-blur-xl border border-white/10 group"
              >
                <div className="w-6 h-6 group-hover:scale-110 transition-transform flex items-center justify-center">✕</div>
              </button>
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/v9X2V9S-F1E?autoplay=1" 
                title="PackIQ AI Workflow Demo" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="opacity-90"
              ></iframe>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
