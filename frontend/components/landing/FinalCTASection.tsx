'use client'

import Link from 'next/link'
import { ArrowRight, Box } from 'lucide-react'

export function FinalCTASection() {
  return (
    <section className="py-24 px-6 bg-[#0A0A0F]">
      <div className="max-w-[1200px] mx-auto bg-gradient-to-br from-[#185FA5] to-[#00FFD1] p-[1px] rounded-[40px]">
        <div className="bg-[#0A0A0F] rounded-[39px] p-12 md:p-24 text-center">
          <h2 className="text-4xl md:text-7xl font-bold font-syne mb-8 tracking-tight">
            Your First Line. 48 Hours. <br />
            <span className="gradient-teal">Zero Risk.</span>
          </h2>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12">
            We install, train, and go live — or you pay nothing. The PackIQ guarantee.
          </p>
          
          <Link 
            href="/auth/signup" 
            className="inline-flex items-center gap-2 bg-[#00FFD1] text-[#0A0A0F] px-10 py-5 rounded-2xl font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(0,255,209,0.4)]"
          >
            Start Free Pilot <ArrowRight className="w-6 h-6" />
          </Link>

          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/5 pt-12">
            {["BIS Compliant Ready", "ISO 9001 Compatible", "GDPR + Data Sovereignty", "Made in India"].map((badge, i) => (
              <div key={i} className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{badge}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="py-20 px-6 border-t border-white/5 bg-[#0A0A0F]">
      <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-12">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#00FFD1] flex items-center justify-center">
              <Box className="w-5 h-5 text-[#0A0A0F]" />
            </div>
            <span className="font-bold text-2xl font-syne text-white">PackIQ</span>
          </Link>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
            Industrial-grade AI packaging inspection for high-volume manufacturers.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">Product</h4>
          <ul className="space-y-4 text-sm text-gray-500">
            <li className="hover:text-[#00FFD1] cursor-pointer">AI Inspection</li>
            <li className="hover:text-[#00FFD1] cursor-pointer">Live Dashboard</li>
            <li className="hover:text-[#00FFD1] cursor-pointer">ROI Calculator</li>
            <li className="hover:text-[#00FFD1] cursor-pointer">API Docs</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">Company</h4>
          <ul className="space-y-4 text-sm text-gray-500">
            <li className="hover:text-[#00FFD1] cursor-pointer">About Us</li>
            <li className="hover:text-[#00FFD1] cursor-pointer">Careers</li>
            <li className="hover:text-[#00FFD1] cursor-pointer">Sustainability</li>
            <li className="hover:text-[#00FFD1] cursor-pointer">Contact</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6">Social</h4>
          <div className="flex gap-4">
            {/* Social icons removed temporarily */}
          </div>
          <div className="mt-8 text-[10px] text-gray-600">
            © 2026 PackIQ Pvt. Ltd.<br />
            Tiruppur, Tamil Nadu, India
          </div>
        </div>
      </div>
    </footer>
  )
}
