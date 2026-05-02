'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { 
  Zap, Package, UploadCloud, BarChart3, 
  MapPin, Cpu, CheckCircle2, ArrowRight, Play, Box,
  ChevronRight, Star, Shield, Smartphone
} from 'lucide-react'

// Dynamic import for 3D component to prevent SSR issues
const Hero3DBox = dynamic(() => import('@/components/landing/Hero3DBox'), { ssr: false })

export default function LandingPage() {
  // Animation variants
  const fadeInUp: any = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] } 
    }
  }

  const stagger: any = {
    visible: { transition: { staggerChildren: 0.15 } }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white font-sans selection:bg-[#00E5CC]/30 overflow-x-hidden">
      
      {/* NAVIGATION */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-50 glass-nav"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00E5CC] to-[#3B82F6] p-[1px]">
              <div className="w-full h-full bg-[#0A0A0F] rounded-xl flex items-center justify-center">
                <Box className="w-5 h-5 text-[#00E5CC] group-hover:rotate-12 transition-transform" />
              </div>
            </div>
            <span className="font-bold text-xl tracking-tight">PackIQ</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-10 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">What We Do</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#partners" className="hover:text-white transition-colors">Partners</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/auth/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link 
              href="/auth/signup" 
              className="bg-[#00E5CC] hover:bg-[#00c2ad] text-[#0A0A0F] px-6 py-2.5 rounded-xl font-bold transition-all hover:scale-105 shadow-[0_0_20px_rgba(0,229,204,0.3)]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 px-6 min-h-screen flex items-center">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#00E5CC]/5 blur-[150px] -z-10 rounded-full translate-x-1/2 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 blur-[150px] -z-10 rounded-full -translate-x-1/2 translate-y-1/4" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial="hidden" animate="visible" variants={stagger}
            className="relative z-10"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#00E5CC] animate-pulse" />
              <span className="text-xs font-bold tracking-wider text-gray-300 uppercase">Next-Gen Logistics AI</span>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-6xl lg:text-8xl font-black leading-[1.05] tracking-tight mb-8">
              Optimization <br />
              <span className="gradient-teal">Redefined.</span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-xl text-gray-400 leading-relaxed mb-12 max-w-xl">
              Automate your packaging logic with real-time AI spatial reasoning. Reduce waste, cut costs, and ship faster with PackIQ.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap items-center gap-5">
              <Link 
                href="/auth/signup" 
                className="bg-[#00E5CC] hover:bg-[#00c2ad] text-[#0A0A0F] px-10 py-5 rounded-2xl font-black text-lg transition-all flex items-center gap-3 hover:scale-105 shadow-[0_10px_30px_rgba(0,229,204,0.2)]"
              >
                Launch Platform
                <ChevronRight className="w-5 h-5" />
              </Link>
              <button className="glass hover:bg-white/5 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all flex items-center gap-3 border border-white/10">
                <Play className="w-5 h-5 fill-current text-[#00E5CC]" />
                Visual Demo
              </button>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="relative h-[600px] lg:h-[700px] flex items-center justify-center"
          >
            <Hero3DBox />
          </motion.div>
        </div>
      </section>

      {/* PARTNERS MARQUEE */}
      <section id="partners" className="py-20 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-bold tracking-[0.3em] uppercase text-gray-500 mb-12">Powering Global Supply Chains</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all">
             <div className="text-2xl font-black italic">FEDEX</div>
             <div className="text-2xl font-black tracking-tighter">DHL</div>
             <div className="text-2xl font-black">AMAZON</div>
             <div className="text-2xl font-black italic">UPS</div>
             <div className="text-2xl font-black tracking-widest">MAERSK</div>
          </div>
        </div>
      </section>

      {/* WHAT WE DO (FEATURES) */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="text-center mb-24"
          >
            <h2 className="text-4xl md:text-6xl font-black mb-6">What We Do</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">We replace guesswork with AI-driven spatial intelligence to transform your fulfillment center.</p>
          </motion.div>

          <motion.div 
            variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { icon: Cpu, title: "Spatial AI Engine", desc: "Our proprietary algorithms calculate the absolute minimum volume required for any combination of products." },
              { icon: Smartphone, title: "Real-Time Verification", desc: "Secure multi-factor authentication with real-time SMS OTP ensures your enterprise data stays protected." },
              { icon: BarChart3, title: "Savings Analytics", desc: "Visualize every cent saved. Track void-space reduction, weight optimization, and carrier cost drops." }
            ].map((item, i) => (
              <motion.div key={i} variants={fadeInUp} className="glass p-10 rounded-3xl border-white/5 hover:border-[#00E5CC]/30 transition-all group">
                <div className="w-14 h-14 bg-[#00E5CC]/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7 text-[#00E5CC]" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 px-6 border-t border-white/5 bg-[#0A0A0F]">
        <div className="max-w-7xl mx-auto pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} PackIQ Technologies Inc. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
