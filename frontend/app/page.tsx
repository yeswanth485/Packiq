'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import dynamic from 'next/dynamic'
import { 
  Zap, Package, UploadCloud, BarChart3, 
  MapPin, Cpu, CheckCircle2, ArrowRight, Play, Box
} from 'lucide-react'

// Dynamic import for 3D component to prevent SSR issues
const Hero3DBox = dynamic(() => import('@/components/landing/Hero3DBox'), { ssr: false })

export default function LandingPage() {
  const { scrollYProgress } = useScroll()
  const yPos = useTransform(scrollYProgress, [0, 1], [0, 200])

  // Variants for scroll animations
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } as any }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-hidden font-sans selection:bg-[#00E5CC]/30">
      
      {/* ─────────────────────────────────────────────────────────
          HEADER / NAVBAR
          ───────────────────────────────────────────────────────── */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" } as any}
        className="fixed top-0 left-0 right-0 z-50 glass-nav"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00E5CC] to-[#3B82F6] flex items-center justify-center p-[1px]">
              <div className="w-full h-full bg-[#0A0A0F] rounded-xl flex items-center justify-center transition-colors group-hover:bg-transparent">
                <Box className="w-5 h-5 text-[#00E5CC] group-hover:text-white transition-all duration-500 group-hover:rotate-180" />
              </div>
            </div>
            <span className="font-bold text-xl tracking-tight">PackIQ</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#how-it-works" className="hover:text-[#00E5CC] transition-colors">How It Works</a>
            <a href="#features" className="hover:text-[#00E5CC] transition-colors">Features</a>
            <a href="#pricing" className="hover:text-[#00E5CC] transition-colors">Pricing</a>
            <a href="#partners" className="hover:text-[#00E5CC] transition-colors">Partners</a>
            <a href="#contact" className="hover:text-[#00E5CC] transition-colors">Contact</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="hidden sm:block text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Log in
            </Link>
            <Link 
              href="/auth/login" 
              className="text-sm bg-[#00E5CC] hover:bg-[#00c2ad] text-[#0A0A0F] px-5 py-2.5 rounded-xl font-bold transition-all glow-teal hover:scale-105"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ─────────────────────────────────────────────────────────
          HERO SECTION
          ───────────────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-32 px-6 min-h-[90vh] flex items-center">
        {/* Background 3D Box Container */}
        <div className="absolute inset-0 z-0 opacity-50 md:opacity-100 right-0 md:left-1/3 overflow-hidden pointer-events-none">
           <Hero3DBox />
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 } as any}
          >
            <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6">
              Pack Smarter.<br />
              Ship Faster.<br />
              <span className="gradient-teal">Save More.</span>
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed mb-10 max-w-lg">
              AI-powered packaging decisions for warehouses, e-commerce, and logistics at scale.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <Link 
                href="/auth/login" 
                className="bg-[#00E5CC] hover:bg-[#00c2ad] text-[#0A0A0F] px-8 py-4 rounded-xl font-bold text-base transition-all glow-teal flex items-center gap-2 hover:scale-105"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="glass hover:bg-white/5 text-white px-8 py-4 rounded-xl font-bold text-base transition-all flex items-center gap-2 border border-white/10 hover:border-[#00E5CC]/50">
                <Play className="w-5 h-5 fill-current" />
                Watch Demo
              </button>
            </div>
          </motion.div>

          {/* Floating Stats Badges */}
          <div className="relative h-full hidden md:block">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute top-10 right-10 glass p-4 rounded-2xl border border-[#00E5CC]/20 backdrop-blur-md shadow-2xl flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-[#00E5CC]/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#00E5CC]" />
              </div>
              <div>
                <div className="text-2xl font-bold">32%</div>
                <div className="text-xs text-gray-400">Avg Cost Reduction</div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
              className="absolute top-1/2 -left-10 glass p-4 rounded-2xl border border-[#00E5CC]/20 backdrop-blur-md shadow-2xl flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">10x</div>
                <div className="text-xs text-gray-400">Faster Decisions</div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="absolute bottom-10 right-20 glass p-4 rounded-2xl border border-[#00E5CC]/20 backdrop-blur-md shadow-2xl flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Package className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold">Zero</div>
                <div className="text-xs text-gray-400">Wasted Space</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          HOW IT WORKS SECTION
          ───────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How PackIQ Works</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">From data ingestion to automated packing instructions in 4 simple steps.</p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            className="relative"
          >
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-[#00E5CC]/50 to-transparent" />

            <div className="grid md:grid-cols-4 gap-12 relative z-10">
              {[
                { icon: UploadCloud, title: "1. Upload Data", desc: "Easily import your product catalog via CSV or Excel." },
                { icon: Cpu, title: "2. AI Analysis", desc: "Claude analyzes dimensions, weight, and fragility rules." },
                { icon: Box, title: "3. Get Match", desc: "Receive instantly optimized box recommendations." },
                { icon: BarChart3, title: "4. Track Savings", desc: "Monitor cost reductions and automate future decisions." }
              ].map((step, i) => (
                <motion.div key={i} variants={fadeInUp} className="text-center group">
                  <div className="w-24 h-24 mx-auto glass rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-[#00E5CC]/50 transition-all duration-300 relative z-10 bg-[#0A0A0F]">
                    <step.icon className="w-10 h-10 text-[#00E5CC]" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-[200px] mx-auto">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          FEATURES SECTION
          ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-32 px-6 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Enterprise-Grade Features</h2>
            <p className="text-xl text-gray-400 max-w-2xl">Everything you need to modernize your fulfillment operations.</p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { icon: Cpu, title: "AI Optimization Engine", desc: "Powered by Claude 3.5 Sonnet via OpenRouter for unmatched reasoning capabilities on complex product shapes." },
              { icon: UploadCloud, title: "Bulk Upload", desc: "Process thousands of SKUs simultaneously via CSV or Excel with instant data validation and error handling." },
              { icon: Box, title: "3D Box Preview", desc: "Visualize every recommended box interactively before packing to ensure perfect fit and orientation." },
              { icon: BarChart3, title: "Real-Time Analytics", desc: "Comprehensive charts tracking KPIs, void space reduction, and exact dollar savings per shipment." },
              { icon: MapPin, title: "Order & Shipment Tracking", desc: "End-to-end visibility from the moment a box is selected to the moment it reaches the customer." },
              { icon: Zap, title: "Hardware-Ready API", desc: "Headless architecture ready to connect directly to automated packing machines and conveyor systems." }
            ].map((f, i) => (
              <motion.div key={i} variants={fadeInUp} className="glass rounded-2xl p-8 card-hover border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-4 -translate-y-4">
                  <f.icon className="w-32 h-32 text-white" />
                </div>
                <div className="w-12 h-12 bg-[#00E5CC]/10 rounded-xl flex items-center justify-center mb-6 relative z-10">
                  <f.icon className="w-6 h-6 text-[#00E5CC]" />
                </div>
                <h3 className="text-xl font-bold mb-3 relative z-10">{f.title}</h3>
                <p className="text-gray-400 leading-relaxed relative z-10">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          PRICING SECTION
          ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Transparent Pricing</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">Start optimizing today. Scale as your volume grows.</p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }}
            className="grid lg:grid-cols-3 gap-8 items-center"
          >
            {/* Free Plan */}
            <motion.div variants={fadeInUp} className="glass rounded-3xl p-8 border border-white/10 relative">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-5xl font-extrabold">$0</span>
                <span className="text-gray-400 mb-1">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['100 products/month', 'Basic AI Optimization', 'CSV upload only', 'Standard email support'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-[#00E5CC] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/login" className="block w-full py-4 text-center rounded-xl glass border border-white/20 hover:bg-white/10 font-bold transition-all">
                Get Started Free
              </Link>
            </motion.div>

            {/* Pro Plan */}
            <motion.div variants={fadeInUp} className="glass rounded-3xl p-10 border-2 border-[#00E5CC]/50 glow-teal relative transform lg:-translate-y-4 bg-gradient-to-b from-[#00E5CC]/5 to-transparent">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00E5CC] text-[#0A0A0F] font-bold px-4 py-1 rounded-full text-sm">
                Most Popular
              </div>
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-5xl font-extrabold">$49</span>
                <span className="text-gray-400 mb-1">/month</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Unlimited products', 'Claude 3.5 Sonnet AI', 'Excel + CSV support', 'Interactive 3D Viewer', 'Advanced Analytics Dashboard'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-white">
                    <CheckCircle2 className="w-5 h-5 text-[#00E5CC] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/login" className="block w-full py-4 text-center rounded-xl bg-[#00E5CC] hover:bg-[#00c2ad] text-[#0A0A0F] font-bold transition-all shadow-lg shadow-[#00E5CC]/20">
                Start Pro Trial
              </Link>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div variants={fadeInUp} className="glass rounded-3xl p-8 border border-white/10 relative">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-5xl font-extrabold">Custom</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Everything in Pro', 'Hardware-Ready API Access', 'Dedicated Account Manager', 'White-labeling options', 'Custom SLA & Onboarding'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-300">
                    <CheckCircle2 className="w-5 h-5 text-gray-500 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button className="block w-full py-4 text-center rounded-xl glass border border-white/20 hover:bg-white/10 font-bold transition-all">
                Contact Sales
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          PARTNERS SECTION
          ───────────────────────────────────────────────────────── */}
      <section id="partners" className="py-24 px-6 border-y border-white/5 bg-[#0A0A0F]">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
            <h2 className="text-2xl font-bold mb-12 text-gray-400">Trusted by Teams Across Industries</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center opacity-60">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-12 flex items-center justify-center grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer">
                  <div className="text-xl font-black tracking-widest text-white">LOGO {i}</div>
                </div>
              ))}
            </div>
            
            <p className="mt-12 text-xs text-gray-600 italic">
              * Partner logos shown for illustration; replace with actual brand assets.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          FOOTER
          ───────────────────────────────────────────────────────── */}
      <footer className="py-12 px-6 border-t border-white/5 bg-[#0A0A0F]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00E5CC] flex items-center justify-center">
              <Box className="w-4 h-4 text-[#0A0A0F]" />
            </div>
            <span className="font-bold text-xl">PackIQ</span>
          </div>
          
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 text-center md:text-left text-sm text-gray-600">
          © {new Date().getFullYear()} PackIQ. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
