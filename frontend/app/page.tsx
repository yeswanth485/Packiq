'use client'

import { HeroSection } from '@/components/landing/HeroSection'
import { ProblemSection } from '@/components/landing/ProblemSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { MetricsShowcase } from '@/components/landing/MetricsShowcase'
import { MarketChart } from '@/components/landing/MarketChart'
import { ROICalculator } from '@/components/landing/ROICalculator'
import { IndustryCards } from '@/components/landing/IndustryCards'
import { TechStackSection } from '@/components/landing/TechStackSection'
import { TestimonialsSection } from '@/components/landing/TestimonialsSection'
import { FinalCTASection, Footer } from '@/components/landing/FinalCTASection'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Box, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white selection:bg-[#00FFD1]/30">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-8'
      }`}>
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 z-50">
            <div className="w-8 h-8 rounded-lg bg-[#00FFD1] flex items-center justify-center">
              <Box className="w-5 h-5 text-[#0A0A0F]" />
            </div>
            <span className="font-bold text-2xl font-syne text-white">PackIQ</span>
          </Link>

          <div className="hidden md:flex items-center gap-10 text-xs font-black uppercase tracking-widest text-gray-400">
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#roi" className="hover:text-white transition-colors">ROI Calculator</a>
            <a href="#tech" className="hover:text-white transition-colors">Technology</a>
            <Link href="/auth/login" className="hover:text-white transition-colors">Login</Link>
            <Link 
              href="/auth/signup" 
              className="bg-[#00FFD1] text-[#0A0A0F] px-6 py-3 rounded-xl hover:scale-105 transition-transform"
            >
              Start Pilot
            </Link>
          </div>

          <button 
            className="md:hidden z-50 p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 w-full h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-8 md:hidden"
            >
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-bold font-syne">How it works</a>
              <a href="#roi" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-bold font-syne">ROI Calculator</a>
              <a href="#tech" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-bold font-syne">Technology</a>
              <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-bold font-syne">Login</Link>
              <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)} className="bg-[#00FFD1] text-[#0A0A0F] px-10 py-5 rounded-2xl font-bold text-xl">Start Pilot</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <MetricsShowcase />
        <MarketChart />
        <div id="roi">
          <ROICalculator />
        </div>
        <IndustryCards />
        <div id="tech">
          <TechStackSection />
        </div>
        <TestimonialsSection />
        <FinalCTASection />
      </main>

      <Footer />
    </div>
  )
}
