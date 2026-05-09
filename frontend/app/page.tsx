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
import { Box, Menu, X, Boxes } from 'lucide-react'
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
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? 'bg-[#0A0A0F]/80 backdrop-blur-2xl border-b border-white/5 py-5' : 'bg-transparent py-10'
      }`}>
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 z-50 group">
            <div className="w-10 h-10 rounded-xl bg-[#00FFD1] flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[0_0_20px_rgba(0,255,209,0.4)]">
              <Boxes className="w-6 h-6 text-[#0A0A0F]" />
            </div>
            <span className="font-bold text-3xl font-syne text-white tracking-tighter">PackAI</span>
          </Link>

          <div className="hidden md:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <a href="#features" className="hover:text-[#00FFD1] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#00FFD1] transition-colors">How it works</a>
            <a href="#suppliers" className="hover:text-[#00FFD1] transition-colors">Suppliers</a>
            <a href="#pricing" className="hover:text-[#00FFD1] transition-colors">Pricing</a>
            <Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link 
              href="/auth/signup" 
              className="bg-[#00FFD1] text-[#0A0A0F] px-8 py-4 rounded-xl hover:scale-105 transition-all font-black"
            >
              Get Started
            </Link>
          </div>

          <button 
            className="md:hidden z-50 p-3 bg-white/5 rounded-xl border border-white/10 text-white"
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
        <MetricsShowcase />
        <ProblemSection />
        <HowItWorksSection />
        
        {/* Trusted Suppliers Section */}
        <section id="suppliers" className="py-32 px-6 bg-[#0A0A0F] relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto text-center">
            <div className="text-[10px] font-black text-[#00FFD1] uppercase tracking-[0.4em] mb-4">Suppliers</div>
            <h2 className="text-4xl md:text-7xl font-bold font-syne mb-8 tracking-tighter leading-tight">
              Trusted <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">packaging suppliers</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-16 leading-relaxed">
              Connect directly with top packaging suppliers. Tap to call instantly.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-40">
              {["FEDEX", "BLUE DART", "UPS", "DHL", "AMAZON", "ECOMM", "SHIPROCKET", "DELHIVERY"].map(name => (
                <div key={name} className="h-24 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center font-syne font-black text-white/20 tracking-widest uppercase text-xs">
                  {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        <FinalCTASection />
      </main>

      <Footer />
    </div>
  )
}
