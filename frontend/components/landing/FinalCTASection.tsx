'use client'

import Link from 'next/link'
import { ArrowRight, Boxes } from 'lucide-react'
import { motion } from 'framer-motion'

export function FinalCTASection() {
  return (
    <section className="py-32 px-6 bg-[#0A0A0F]">
      <div className="max-w-[1200px] mx-auto bg-gradient-to-br from-[#185FA5]/80 via-[#00FFD1]/80 to-[#185FA5]/80 p-[1px] rounded-[40px] relative overflow-hidden">
        <div className="absolute inset-0 bg-[#0A0A0F]/50 blur-3xl" />
        <div className="bg-[#0A0A0F] rounded-[39px] p-12 md:p-24 text-center relative z-10 overflow-hidden">
          {/* Background grid */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none" 
            style={{ 
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: '40px 40px' 
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-7xl font-bold font-syne mb-8 tracking-tight">
              Ready to eliminate <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFD1] to-[#185FA5]">shipping waste?</span>
            </h2>
            <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12">
              Join thousands of brands saving millions on dimensional weight and packaging materials with Shipzi's spatial intelligence.
            </p>
            
            <Link 
              href="/auth/signup" 
              className="inline-flex items-center gap-3 bg-[#00FFD1] text-[#0A0A0F] px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(0,255,209,0.25)]"
            >
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>

            <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/5 pt-12">
              {["No Credit Card Required", "Cancel Anytime", "Instant API Access", "24/7 Support"].map((badge, i) => (
                <div key={i} className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{badge}</div>
              ))}
            </div>
          </motion.div>
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
          <Link href="/" className="flex items-center gap-3 mb-6 group">
            <div className="w-8 h-8 rounded-lg bg-[#00FFD1] flex items-center justify-center group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(0,255,209,0.3)]">
              <Boxes className="w-4 h-4 text-[#0A0A0F]" />
            </div>
            <div className="flex flex-col">
              <span className="shipzi-logo text-3xl tracking-tight">Shipzi</span>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">PackIQ — Shipzi Co.</span>
            </div>
          </Link>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
            The intelligent FFD engine that optimizes packaging dimensions to reduce DIM weight and shipping costs globally.
          </p>
        </div>

        <div>
          <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-6">Product</h4>
          <ul className="space-y-4 text-sm text-gray-500">
            <li className="hover:text-[#00FFD1] transition-colors cursor-pointer">AI Optimization</li>
            <li className="hover:text-[#00FFD1] transition-colors cursor-pointer">Bulk Processing</li>
            <li className="hover:text-[#00FFD1] transition-colors cursor-pointer">3D Visualization</li>
            <li className="hover:text-[#00FFD1] transition-colors cursor-pointer">API Integration</li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-6">Company</h4>
          <ul className="space-y-4 text-sm text-gray-500">
            <li className="hover:text-[#00FFD1] transition-colors cursor-pointer">About Us</li>
            <li className="hover:text-[#00FFD1] transition-colors cursor-pointer">Case Studies</li>
            <li className="hover:text-[#00FFD1] transition-colors cursor-pointer">Careers</li>
            <li className="hover:text-[#00FFD1] transition-colors cursor-pointer">Contact</li>
          </ul>
        </div>

        <div>
          <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-6">Legal</h4>
          <ul className="space-y-4 text-sm text-gray-500">
            <li className="hover:text-[#00FFD1] transition-colors cursor-pointer">Privacy Policy</li>
            <li className="hover:text-[#00FFD1] transition-colors cursor-pointer">Terms of Service</li>
          </ul>
          <div className="mt-12 text-[10px] text-gray-600 font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} Shipzi Inc.<br />
            All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  )
}
