'use client'

import { motion } from 'framer-motion'
import { Rocket } from 'lucide-react'
import Image from 'next/image'

interface Step1Props {
  onNext: () => void
}

export default function Step1Welcome({ onNext }: Step1Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center text-center space-y-8"
    >
      <div className="relative w-32 h-32 mb-4">
        <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full" />
        <div className="relative bg-[#0D1427] p-6 rounded-3xl border border-white/10 shadow-2xl">
          <Image
            src="/shipzi-logo.png"
            alt="Shipzi Logo"
            width={80}
            height={80}
            className="animate-float"
            priority
          />
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold font-space-grotesk text-white">
          Welcome to Shipzi
        </h1>
        <p className="text-xl text-zinc-400 max-w-md mx-auto">
          Let's set up your company profile and start optimizing your packaging intelligence.
        </p>
      </div>

      <button
        onClick={onNext}
        className="group relative px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden"
      >
        <span className="relative z-10 flex items-center gap-2">
          Get Started
          <Rocket className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </span>
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      </button>
    </motion.div>
  )
}
