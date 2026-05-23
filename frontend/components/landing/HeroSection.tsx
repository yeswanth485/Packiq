'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Play, Box, Zap, Sparkles, Globe } from 'lucide-react'
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
      z: [-50, 50, -50]
    }}
    transition={{
      duration: 12,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    }}
    style={{ left: x, top: y, perspective: 1000, transformStyle: 'preserve-3d' }}
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

const TERMS = ['Optimization', 'Intelligence', 'Automation', 'Sustainability', 'Efficiency', 'Packaging']

export function HeroSection() {
  const [mounted, setMounted] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [termIndex, setTermIndex] = useState(0)

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setTermIndex((prev) => (prev + 1) % TERMS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-32 overflow-hidden bg-[#0A0A0F]">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#4f46e5]/10 via-transparent to-[#0A0A0F] pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(0,255,209,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,209,0.3) 1px, transparent 1px)`,
          backgroundSize: '100px 100px',
        }}
      />

      {/* Floating elements */}
      <FloatingBox x="5%" y="15%" size={80} delay={0} />
      <FloatingBox x="88%" y="10%" size={120} delay={2} />
      <FloatingBox x="82%" y="75%" size={70} delay={4} />
      <FloatingBox x="10%" y="80%" size={90} delay={6} />

      {/* Hero Content */}
      <div className="max-w-7xl mx-auto px-6 relative z-10 w-full text-center">
        <StaggerContainer>
          <StaggerItem>
              <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-2 rounded-full mb-12 backdrop-blur-2xl group cursor-pointer hover:border-[#00FFD1]/30 transition-all">
                <div className="relative">
                  <Sparkles className="w-4 h-4 text-[#00FFD1] animate-pulse" />
                  <div className="absolute inset-0 bg-[#00FFD1] blur-md opacity-20 group-hover:opacity-40" />
                </div>
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
                  AI-Powered by <span className="text-[#00FFD1]">Shipzi</span> × <span className="text-white">Terybi</span>
              </span>
            </div>
          </StaggerItem>

          <StaggerItem>
            <h1 className="text-5xl md:text-[100px] font-bold tracking-tighter mb-8 leading-none">
               <motion.span
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 1, delay: 0.2 }}
                 className="inline-block"
               >
                 The Future of
               </motion.span>
               <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#00FFD1] to-indigo-600 drop-shadow-[0_0_30px_rgba(0,255,209,0.2)]">
                 Packaging {TERMS[termIndex]}
               </span>
            </h1>
          </StaggerItem>

          <StaggerItem>
            <p className="text-lg md:text-3xl text-[#00FFD1] max-w-3xl mx-auto mb-8 font-black uppercase tracking-widest drop-shadow-2xl">
               Pack Smarter. Ship Leaner. Waste Nothing.
            </p>
            <p className="text-lg md:text-xl text-gray-500 max-w-3xl mx-auto mb-14 leading-relaxed font-medium">
               PackIQ leverages <span className="text-white font-bold">XGBoost-Terybi</span> intelligence to eliminate void space and cut logistics costs by up to 32% per shipment.
            </p>
          </StaggerItem>

          <StaggerItem>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/auth/signup"
                className="w-full sm:w-auto bg-indigo-600 text-white px-12 py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-indigo-500 hover:scale-105 transition-all shadow-2xl shadow-indigo-600/30 group"
              >
                Start Free Trial <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => setShowVideo(true)}
                className="w-full sm:w-auto bg-white/5 border border-white/10 text-white px-12 py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-white/10 transition-all backdrop-blur-xl"
              >
                <Play className="w-4 h-4 text-[#00FFD1] fill-[#00FFD1]" /> Watch Demo
              </button>
            </div>
          </StaggerItem>

          <StaggerItem>
             <div className="mt-20 pt-20 border-t border-white/5 flex flex-wrap justify-center gap-12 md:gap-24 opacity-40 grayscale">
                <div className="flex items-center gap-3">
                   <Globe className="w-6 h-6" />
                   <span className="font-black text-xl tracking-tighter italic">Global Logistics</span>
                </div>
                <div className="flex items-center gap-3">
                   <Zap className="w-6 h-6" />
                   <span className="font-black text-xl tracking-tighter italic">Instant Scans</span>
                </div>
                <div className="flex items-center gap-3">
                   <Box className="w-6 h-6" />
                   <span className="font-black text-xl tracking-tighter italic">Smart Boxes</span>
                </div>
             </div>
          </StaggerItem>
        </StaggerContainer>
      </div>

      {/* Decorative Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] -right-20 w-[400px] h-[400px] bg-[#00FFD1]/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Video Modal */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-6xl aspect-video bg-black rounded-[40px] overflow-hidden border border-white/10 shadow-2xl"
            >
              <button 
                onClick={() => setShowVideo(false)} 
                className="absolute top-8 right-8 z-20 w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all backdrop-blur-xl border border-white/10"
              >
                ✕
              </button>
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="Terybi — AI Packaging Demo"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
