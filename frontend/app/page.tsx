'use client'

import { HeroSection } from '@/components/landing/HeroSection'
import { ProblemSection } from '@/components/landing/ProblemSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { MetricsShowcase } from '@/components/landing/MetricsShowcase'
import { PricingSection } from '@/components/landing/PricingSection'
import { FinalCTASection, Footer } from '@/components/landing/FinalCTASection'
import { InteractiveSimulator } from '@/components/landing/InteractiveSimulator'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Rocket } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Suppliers', href: '#suppliers' },
  { label: 'Pricing', href: '#pricing' },
]

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showAbout, setShowAbout] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white selection:bg-[#00FFD1]/30 overflow-x-hidden">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        isScrolled
          ? 'bg-[#0A0A0F]/80 backdrop-blur-2xl border-b border-white/5 py-4'
          : 'bg-transparent py-10'
      }`}>
        <div className="max-w-[1400px] mx-auto px-10 flex items-center justify-between">
          {/* Logo - Clickable for Explanation */}
          <button 
            onClick={() => setShowAbout(true)}
            className="flex items-center gap-4 z-50 group perspective-1000"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#00FFD1] to-[#185FA5] flex items-center justify-center group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-[0_0_30px_rgba(0,255,209,0.4)] transform-style-3d">
              <Rocket className="w-6 h-6 text-white drop-shadow-md" />
            </div>
            <div className="flex flex-col">
              <span className="shipzi-logo text-3xl leading-none">Shipzi</span>
              <span className="text-[10px] font-black text-[#00FFD1] uppercase tracking-[0.3em] mt-0.5">Terybi</span>
            </div>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-[#00FFD1] transition-all duration-300 hover:tracking-[0.3em]"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/auth/login"
              className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 hover:text-white transition-all duration-300"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="bg-[#00FFD1] text-[#0A0A0F] px-10 py-4 rounded-2xl hover:scale-105 active:scale-95 transition-all duration-500 font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(0,255,209,0.2)]"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden z-50 p-3 bg-white/5 rounded-2xl border border-white/10 text-white hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 w-full h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-10 md:hidden"
            >
              {NAV_LINKS.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-4xl font-bold font-syne hover:text-[#00FFD1] transition-all tracking-tighter"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col items-center gap-6 mt-8">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xl font-bold font-syne text-gray-500 hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-[#00FFD1] text-[#0A0A0F] px-16 py-6 rounded-3xl font-black text-lg uppercase tracking-widest"
                >
                  Join Shipzi
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Shipzi About Modal */}
      <AnimatePresence>
        {showAbout && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0A0A0F]/90 backdrop-blur-3xl"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateX: -20 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
              className="relative max-w-2xl w-full bg-white/[0.02] border border-white/10 p-10 md:p-14 rounded-[40px] shadow-[0_0_100px_rgba(0,255,209,0.15)] transform-style-3d card-3d"
            >
              <button 
                onClick={() => setShowAbout(false)}
                className="absolute top-6 right-6 w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>

              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#00FFD1] to-[#185FA5] flex items-center justify-center mb-8 shadow-2xl animate-float3d">
                <Rocket className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold font-syne text-white mb-6">
                What is <span className="shipzi-logo">Shipzi?</span>
              </h2>
              
              <div className="space-y-6 text-gray-400 text-lg leading-relaxed">
                <p>
                  <strong className="text-white">Shipzi</strong> — Where &apos;Ship&apos; meets &apos;Zi&apos; (meaning &apos;intelligence&apos; in the digital age). We are the smart shipping brain.
                </p>
                <p>
                  Shipzi is an AI-powered packaging & shipping intelligence platform that uses advanced XGBoost intelligence to optimize every box, reduce DIM weight waste, and cut shipping costs by up to 32%.
                </p>
                <p>
                  In collaboration with <strong className="text-[#00FFD1]">Terybi</strong>, the world's most powerful logistics network, we ensure your goods travel smarter, faster, and cheaper.
                </p>
                <p>
                  Built for modern e-commerce brands who refuse to overpay for air.
                </p>
              </div>

              <div className="mt-10 pt-8 border-t border-white/5 flex flex-wrap gap-4">
                <span className="px-4 py-2 bg-white/5 rounded-full text-xs font-bold text-[#00FFD1] uppercase tracking-widest border border-white/5">Spatial Intelligence</span>
                <span className="px-4 py-2 bg-white/5 rounded-full text-xs font-bold text-[#185FA5] uppercase tracking-widest border border-white/5">Claude AI Powered</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* Hero — AI-Powered Packaging Automation */}
        <HeroSection />

        {/* Metrics Bar — 10K+ brands, 50M+ labels, 99.9% uptime */}
        <MetricsShowcase />

        {/* Features — Everything you need to optimize packaging */}
        <ProblemSection />

        {/* How It Works — 4 steps */}
        <HowItWorksSection />

        {/* AI-Powered Interactive Simulator */}
        <InteractiveSimulator />

        {/* Trusted Suppliers Section */}
        <section id="suppliers" className="py-40 px-6 bg-[#0A0A0F] relative overflow-hidden">
          <div className="absolute top-1/2 left-1/4 w-[800px] h-[800px] bg-[#185FA5]/5 rounded-full blur-[160px] pointer-events-none" />
          <div className="max-w-[1200px] mx-auto text-center relative z-10">
            <div className="text-[10px] font-black text-[#00FFD1] uppercase tracking-[0.5em] mb-6">Partnerships</div>
            <h2 className="text-5xl md:text-8xl font-bold font-syne mb-10 tracking-tighter leading-[0.9]">
              Connected to the<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-600">
                Logistics Grid
              </span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-20 leading-relaxed font-medium">
              Seamlessly integrate with the world's leading carriers. Real-time API sync for every shipment.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {['FEDEX', 'BLUE DART', 'UPS', 'DHL', 'AMAZON', 'ECOMM', 'SHIPROCKET', 'DELHIVERY'].map(name => (
                <motion.div
                  key={name}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)', rotateX: 5, rotateY: 5 }}
                  className="h-32 bg-white/[0.02] border border-white/5 rounded-[32px] flex items-center justify-center font-syne font-black text-white/10 tracking-[0.3em] uppercase text-[10px] hover:border-[#00FFD1]/20 hover:text-[#00FFD1] transition-all duration-500 cursor-pointer transform-style-3d perspective-1000"
                >
                  {name}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing — Starter / Pro / Enterprise */}
        <PricingSection />

        {/* Final CTA */}
        <FinalCTASection />
      </main>

      <Footer />
    </div>
  )
}
