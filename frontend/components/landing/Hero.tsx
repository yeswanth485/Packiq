'use client'

import { motion } from 'framer-motion'
import { Rocket, ChevronRight, Play, Shield, Zap, Globe } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative pt-40 pb-20 px-6 overflow-hidden min-h-screen flex items-center">
      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-400/10 rounded-full blur-[120px] -z-10 animate-pulse delay-1000" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-md"
          >
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
              🚀 AI-Powered Packaging Intelligence
            </span>
          </motion.div>

          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-6xl md:text-8xl font-bold font-space-grotesk text-white leading-[0.9] tracking-tighter"
            >
              Ship Smarter.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                Pack Lighter.
              </span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-4"
            >
              <p className="text-xl text-zinc-400 max-w-xl leading-relaxed font-medium">
                AI-powered packaging intelligence that saves cost and the planet. Find the perfect box for every product — automatically.
              </p>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-600 italic">
                by Terybi
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap gap-6"
          >
            <Link
              href="/auth/signup"
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-10 py-5 rounded-2xl font-bold shadow-[0_0_40px_rgba(37,99,235,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
              Start Free Trial
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              href="#how-it-works"
              className="px-10 py-5 rounded-2xl font-bold border border-white/10 text-white hover:bg-white/5 transition-all flex items-center gap-3"
            >
              See How It Works
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              No Credit Card
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Instant Setup
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Cancel Anytime
            </div>
          </motion.div>
        </div>

        <div className="relative flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative w-full max-w-md aspect-square"
          >
            {/* 3D Animated Box Placeholder */}
            <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-full animate-pulse" />
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotateY: [0, 360],
              }}
              transition={{
                y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                rotateY: { duration: 20, repeat: Infinity, ease: "linear" }
              }}
              className="relative w-full h-full perspective-1000 flex items-center justify-center"
            >
              <div className="w-64 h-64 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-3xl shadow-[0_0_60px_rgba(37,99,235,0.5)] flex items-center justify-center transform-style-3d">
                <Image
                  src="/shipzi-logo.png"
                  alt="Shipzi Logo"
                  width={120}
                  height={120}
                  className="drop-shadow-2xl"
                />
              </div>
              <div className="absolute bottom-[-40px] w-48 h-8 bg-blue-600/20 blur-xl rounded-full scale-x-150" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
