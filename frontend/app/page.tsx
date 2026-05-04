'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';
import {
  Box, ArrowRight, Play, Menu, X, Check, Brain, ShieldCheck, BarChart2,
  Database, Truck, Zap
} from 'lucide-react';

const Hero3DBox = dynamic(() => import('@/components/landing/Hero3DBox'), { ssr: false });

const inter = Inter({ subsets: ['latin'] });

// --- Particles Component ---
const Particles = () => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#4361EE] opacity-[0.03]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: ['0%', '-1000%'],
            opacity: [0, 0.2, 0]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  );
};

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(false);
  
  // Parallax for hero
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`${inter.className} min-h-screen text-slate-800 selection:bg-[#4361EE]/20 overflow-x-hidden bg-white`}>
      
      {/* --- NAVBAR --- */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/80 backdrop-blur-[12px] border-b border-slate-200 py-3 shadow-sm' 
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group z-50">
            <div className="w-8 h-8 rounded-[10px] bg-[#4361EE]/10 border border-[#4361EE]/20 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(67,97,238,0.2)] transition-shadow">
              <Box className="w-5 h-5 text-[#4361EE]" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">PackIQ</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-[15px] font-semibold text-slate-600">
            {['What We Do', 'How It Works', 'Partners', 'Pricing'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase().replace(/ /g, '-')}`} 
                className="relative group hover:text-[#4361EE] transition-colors py-2"
              >
                {item}
                <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-[#4361EE] group-hover:w-full group-hover:left-0 transition-all duration-300 rounded-full"></span>
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/auth/login" 
              className="text-[15px] font-semibold text-slate-600 hover:text-[#4361EE] transition-colors px-4 py-2 rounded-[10px] hover:bg-slate-50 border border-transparent"
            >
              Sign In
            </Link>
            <Link 
              href="/auth/signup" 
              className="group flex items-center gap-2 bg-[#4361EE] hover:bg-[#344FDA] text-white px-5 py-2.5 rounded-[10px] font-medium transition-all shadow-[0_4px_14px_rgba(67,97,238,0.3)] hover:shadow-[0_6px_20px_rgba(67,97,238,0.4)] border border-[#4361EE]"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden z-50 text-slate-900 p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 p-6 flex flex-col gap-6 md:hidden shadow-2xl"
            >
              {['What We Do', 'How It Works', 'Partners', 'Pricing'].map((item) => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase().replace(/ /g, '-')}`} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-semibold text-slate-800"
                >
                  {item}
                </a>
              ))}
              <hr className="border-slate-200" />
              <Link href="/auth/login" className="text-lg font-semibold text-slate-800" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link 
                href="/auth/signup" 
                className="flex items-center justify-center gap-2 bg-[#4361EE] text-white p-3 rounded-[10px] font-medium shadow-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex flex-col items-center justify-start pt-32 md:pt-40 pb-0 overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 z-0 opacity-40 bg-slate-50">
          <motion.div 
            style={{ y: y1 }}
            className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-[#4361EE]/10 rounded-full blur-[100px] mix-blend-multiply"
            animate={{ scale: [1, 1.1, 1], x: [0, 30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div 
            style={{ y: y2 }}
            className="absolute bottom-[20%] right-[20%] w-[600px] h-[600px] bg-[#06b6d4]/10 rounded-full blur-[120px] mix-blend-multiply"
            animate={{ scale: [1, 1.2, 1], x: [0, -30, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <Particles />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4361EE]/10 border border-[#4361EE]/20 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-[#4361EE] shadow-[0_0_8px_#4361EE] animate-pulse" />
            <span className="text-[13px] font-bold text-[#4361EE]">Next-Gen Logistics AI ✦</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-5xl md:text-[80px] font-black leading-[1.05] tracking-tight mb-8 text-slate-900 max-w-4xl"
          >
            Optimization <br className="hidden md:block" />
            <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#4361EE] via-[#3B82F6] to-[#06b6d4]">
              Redefined.
              <motion.span 
                className="absolute bottom-2 left-0 h-1.5 w-full bg-gradient-to-r from-[#4361EE] to-[#06b6d4] rounded-full opacity-30"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
              />
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="text-lg md:text-[20px] text-slate-600 font-medium max-w-2xl leading-relaxed mb-10"
          >
            Automate your packaging logic with real-time AI spatial reasoning. Reduce waste, cut costs, and ship faster with PackIQ.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          >
            <Link 
              href="/auth/signup" 
              className="w-full sm:w-auto group flex items-center justify-center gap-2 bg-[#4361EE] hover:bg-[#344FDA] text-white px-8 py-4 rounded-[10px] font-bold text-lg transition-all shadow-[0_8px_25px_rgba(67,97,238,0.3)] border border-[#4361EE]"
            >
              Launch Platform
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full sm:w-auto group flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 px-8 py-4 rounded-[10px] font-bold text-lg transition-all shadow-sm">
              <Play className="w-5 h-5 text-[#4361EE] group-hover:scale-110 transition-transform" />
              Visual Demo
            </button>
          </motion.div>
        </div>

        {/* 3D Element Centered below buttons before ticker */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="relative z-10 w-full h-[300px] md:h-[400px] flex items-center justify-center mt-12 -mb-10 pointer-events-auto"
        >
          <Hero3DBox />
        </motion.div>

        {/* Scrolling Ticker */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="w-full mt-auto border-y border-slate-100 bg-white/60 backdrop-blur-md py-6 flex flex-col items-center overflow-hidden z-20 shadow-sm"
        >
          <p className="text-[11px] font-black tracking-[0.2em] uppercase text-slate-400 mb-6">Powering Global Supply Chains</p>
          <div className="flex w-full overflow-hidden relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
            <motion.div 
              className="flex items-center gap-16 whitespace-nowrap px-8"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 25, ease: 'linear', repeat: Infinity }}
            >
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex items-center gap-16 opacity-40 grayscale">
                  <span className="text-xl font-black italic text-slate-800">FEDEX</span>
                  <span className="text-xl font-black tracking-tighter text-slate-800">DHL</span>
                  <span className="text-xl font-black text-slate-800">AMAZON</span>
                  <span className="text-xl font-black italic text-slate-800">UPS</span>
                  <span className="text-xl font-black tracking-widest text-slate-800">MAERSK</span>
                  <span className="text-xl font-bold text-slate-800">SHOPIFY</span>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="what-we-do" className="py-24 px-6 relative z-10 bg-slate-50">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col items-center text-center mb-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="w-8 h-[2px] bg-[#4361EE]" />
              <h2 className="text-sm font-black tracking-[0.15em] text-[#4361EE] uppercase">What We Do</h2>
              <div className="w-8 h-[2px] bg-[#4361EE]" />
            </motion.div>
            <motion.h3 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-black tracking-tight max-w-3xl text-slate-900"
            >
              Intelligent packaging built for modern fulfillment.
            </motion.h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Brain, title: "Spatial AI Engine", desc: "Our proprietary algorithms calculate the absolute minimum volume required for any combination of products.", color: "#4361EE" },
              { icon: ShieldCheck, title: "Real-Time Verification", desc: "Enterprise-grade security with real-time API integrations. Instantly verify dimensions seamlessly.", color: "#06b6d4" },
              { icon: BarChart2, title: "Savings Analytics", desc: "Visualize every cent saved. Track void-space reduction, weight optimization, and carrier cost drops.", color: "#22c55e" }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
                className="relative group bg-white border border-slate-200 rounded-[20px] p-8 overflow-hidden transition-all hover:border-[#4361EE]/50 shadow-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-[12px] flex items-center justify-center mb-6 shadow-sm`} style={{ backgroundColor: `${item.color}15`, border: `1px solid ${item.color}30` }}>
                    <item.icon className="w-7 h-7" style={{ color: item.color }} />
                  </div>
                  <h4 className="text-2xl font-bold mb-3 text-slate-900">{item.title}</h4>
                  <p className="text-slate-600 font-medium leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section id="how-it-works" className="py-24 px-6 bg-white border-y border-slate-100 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto relative z-10">
          <div className="text-center mb-24">
             <h2 className="text-sm font-black tracking-[0.15em] text-[#06b6d4] uppercase mb-4">The Process</h2>
             <h3 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">How it works</h3>
          </div>

          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-12 md:gap-4">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-10 left-[10%] right-[10%] h-[2px] border-t-2 border-dashed border-slate-300 z-0">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#4361EE] to-[#06b6d4]"
                initial={{ width: "0%" }}
                whileInView={{ width: "100%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            </div>

            {[
              { num: "01", icon: Database, title: "Sync Data", desc: "Connect your inventory. We instantly pull product dimensions and weights." },
              { num: "02", icon: Zap, title: "AI Optimization", desc: "Our engine processes orders in milliseconds, finding the optimal box size." },
              { num: "03", icon: Truck, title: "Pack & Ship", desc: "Warehouse staff follow visual 3D guides, reducing errors and shipping costs." }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.3 }}
                className="relative z-10 flex flex-row md:flex-col items-center md:text-center gap-6 md:gap-8 w-full md:w-1/3"
              >
                <div className="flex-shrink-0 w-20 h-20 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center relative shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
                  <span className="text-2xl font-black text-slate-900">{step.num}</span>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#4361EE] flex items-center justify-center shadow-lg shadow-[#4361EE]/30 border-2 border-white">
                     <step.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h4>
                  <p className="text-slate-600 font-medium max-w-xs">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section id="pricing" className="py-24 px-6 bg-slate-50">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-8 text-slate-900">Transparent pricing for every scale</h2>
            
            {/* Toggle */}
            <div className="inline-flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button 
                onClick={() => setAnnualBilling(false)}
                className={`px-6 py-2 rounded-[8px] text-sm font-bold transition-all ${!annualBilling ? 'bg-[#4361EE] text-white shadow-md shadow-[#4361EE]/20' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setAnnualBilling(true)}
                className={`px-6 py-2 rounded-[8px] text-sm font-bold transition-all ${annualBilling ? 'bg-[#4361EE] text-white shadow-md shadow-[#4361EE]/20' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Annually <span className="text-[#06b6d4] ml-1 bg-[#06b6d4]/10 px-2 py-0.5 rounded-full text-xs">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-center">
            {/* Starter */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white border border-slate-200 rounded-[20px] p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <h4 className="text-xl font-bold text-slate-900 mb-2">Starter</h4>
              <p className="text-slate-500 font-medium text-sm mb-6">For growing e-commerce brands.</p>
              <div className="mb-8">
                <span className="text-4xl font-black text-slate-900">${annualBilling ? '49' : '59'}</span>
                <span className="text-slate-500 font-medium">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Up to 1,000 orders/mo', 'Standard 3D Algorithm', 'Email Support', 'Basic Analytics'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                    <Check className="w-5 h-5 text-[#22c55e]" />
                    <span className="text-sm">{feat}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-[10px] bg-white border border-slate-300 hover:bg-slate-50 hover:border-[#4361EE]/50 text-slate-800 font-bold transition-all">
                Start Free Trial
              </button>
            </motion.div>

            {/* Growth (Middle) */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative bg-white border-2 border-[#4361EE] rounded-[24px] p-8 shadow-[0_20px_50px_rgba(67,97,238,0.15)] md:-mt-6 md:mb-6"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#4361EE] text-white text-[11px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg">
                Most Popular
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Growth</h4>
              <p className="text-slate-500 font-medium text-sm mb-6">For high-volume fulfillment centers.</p>
              <div className="mb-8">
                <span className="text-5xl font-black text-slate-900">${annualBilling ? '199' : '249'}</span>
                <span className="text-slate-500 font-medium">/mo</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Up to 10,000 orders/mo', 'Advanced Spatial Engine', 'Priority Support', 'Custom Box Sizes', 'API Access'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-800 font-bold">
                    <Check className="w-5 h-5 text-[#4361EE]" />
                    <span className="text-sm">{feat}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-3.5 rounded-[10px] bg-[#4361EE] hover:bg-[#344FDA] text-white font-bold transition-all shadow-[0_8px_20px_rgba(67,97,238,0.25)] border border-[#4361EE]">
                Get Started
              </button>
            </motion.div>

            {/* Enterprise */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-slate-200 rounded-[20px] p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <h4 className="text-xl font-bold text-slate-900 mb-2">Enterprise</h4>
              <p className="text-slate-500 font-medium text-sm mb-6">For global supply chain operations.</p>
              <div className="mb-8">
                <span className="text-4xl font-black text-slate-900">Custom</span>
              </div>
              <ul className="space-y-4 mb-8">
                {['Unlimited orders', 'Dedicated Infrastructure', '24/7 Phone Support', 'WMS/ERP Integration', 'SLA Guarantee'].map((feat, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                    <Check className="w-5 h-5 text-slate-400" />
                    <span className="text-sm">{feat}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-3 rounded-[10px] bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 text-slate-800 font-bold transition-all">
                Contact Sales
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="relative bg-white pt-20 pb-10 border-t border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-24 mb-16">
            <div className="col-span-1 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-[10px] bg-[#4361EE] flex items-center justify-center border border-[#4361EE] shadow-md">
                  <Box className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-slate-900">PackIQ</span>
              </Link>
              <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                Next-generation spatial AI engine optimizing global logistics and supply chains.
              </p>
            </div>
            
            <div>
              <h5 className="text-slate-900 font-bold mb-4">Product</h5>
              <ul className="space-y-3">
                {['Features', 'Integrations', 'Pricing', 'Changelog', 'Docs'].map(link => (
                  <li key={link}><a href="#" className="text-slate-500 hover:text-[#4361EE] font-medium text-sm transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="text-slate-900 font-bold mb-4">Company</h5>
              <ul className="space-y-3">
                {['About Us', 'Careers', 'Blog', 'Contact', 'Partners'].map(link => (
                  <li key={link}><a href="#" className="text-slate-500 hover:text-[#4361EE] font-medium text-sm transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-slate-900 font-bold mb-4">Connect</h5>
              <div className="flex items-center gap-4">
                <a href="#" className="text-slate-500 hover:text-[#4361EE] font-medium transition-all text-sm">
                  Contact Us
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 font-medium text-sm">© 2026 PackIQ Technologies Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-slate-500 hover:text-slate-900 font-medium text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-slate-500 hover:text-slate-900 font-medium text-sm transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
