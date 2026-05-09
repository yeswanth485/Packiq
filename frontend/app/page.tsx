'use client'

import { HeroSection } from '@/components/landing/HeroSection'
import { ProblemSection } from '@/components/landing/ProblemSection'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { MetricsShowcase } from '@/components/landing/MetricsShowcase'
import { PricingSection } from '@/components/landing/PricingSection'
import { FinalCTASection, Footer } from '@/components/landing/FinalCTASection'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, Boxes } from 'lucide-react'
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

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white selection:bg-[#00FFD1]/30">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-[#0A0A0F]/85 backdrop-blur-2xl border-b border-white/5 py-4'
          : 'bg-transparent py-8'
      }`}>
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 z-50 group">
            <div className="w-9 h-9 rounded-xl bg-[#00FFD1] flex items-center justify-center group-hover:rotate-12 transition-transform duration-300 shadow-[0_0_20px_rgba(0,255,209,0.35)]">
              <Boxes className="w-5 h-5 text-[#0A0A0F]" />
            </div>
            <span className="font-bold text-2xl font-syne text-white tracking-tight">PackIQ</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="hover:text-[#00FFD1] transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400 hover:text-white transition-colors duration-200 px-2 py-2 rounded-xl border border-transparent hover:border-white/10"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="bg-[#00FFD1] text-[#0A0A0F] px-7 py-3 rounded-xl hover:scale-105 active:scale-95 transition-all duration-200 font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,209,0.25)]"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden z-50 p-2.5 bg-white/5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-0 left-0 w-full h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-8 md:hidden"
            >
              {NAV_LINKS.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl font-bold font-syne hover:text-[#00FFD1] transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-2xl font-bold font-syne text-gray-400 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="bg-[#00FFD1] text-[#0A0A0F] px-10 py-5 rounded-2xl font-bold text-xl"
              >
                Get Started Free
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main>
        {/* Hero — AI-Powered Packaging Automation */}
        <HeroSection />

        {/* Metrics Bar — 10K+ brands, 50M+ labels, 99.9% uptime */}
        <MetricsShowcase />

        {/* Features — Everything you need to optimize packaging */}
        <ProblemSection />

        {/* How It Works — 4 steps */}
        <HowItWorksSection />

        {/* Trusted Suppliers Section */}
        <section id="suppliers" className="py-32 px-6 bg-[#0A0A0F] relative overflow-hidden">
          <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-[#185FA5]/5 rounded-full blur-[140px] pointer-events-none" />
          <div className="max-w-[1200px] mx-auto text-center relative z-10">
            <div className="text-[10px] font-black text-[#00FFD1] uppercase tracking-[0.4em] mb-4">Suppliers</div>
            <h2 className="text-4xl md:text-7xl font-bold font-syne mb-8 tracking-tighter leading-tight">
              Trusted{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                packaging partners
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-16 leading-relaxed">
              Connect directly with top logistics and packaging suppliers. Tap to call instantly.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['FEDEX', 'BLUE DART', 'UPS', 'DHL', 'AMAZON', 'ECOMM', 'SHIPROCKET', 'DELHIVERY'].map(name => (
                <motion.div
                  key={name}
                  whileHover={{ scale: 1.05 }}
                  className="h-24 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center font-syne font-black text-white/20 tracking-widest uppercase text-xs hover:border-white/10 hover:bg-white/[0.04] hover:text-white/40 transition-all duration-300 cursor-pointer"
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
