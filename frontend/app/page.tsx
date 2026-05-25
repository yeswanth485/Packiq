'use client'

import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import StatsBar from '@/components/landing/StatsBar'
import Features from '@/components/landing/Features'
import HowItWorks from '@/components/landing/HowItWorks'
import Suppliers from '@/components/landing/Suppliers'
import Pricing from '@/components/landing/Pricing'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0F1E] selection:bg-blue-500/30 overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <StatsBar />
        <Features />
        <HowItWorks />
        <Suppliers />
        <Pricing />
      </main>
      <Footer />
    </div>
  )
}
