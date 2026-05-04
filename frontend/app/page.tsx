'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';
import {
  Box, ArrowRight, Play, Menu, X, Check, Brain, ShieldCheck, BarChart2,
  Database, Truck, Zap, Globe, Cpu, Infinity as InfinityIcon
} from 'lucide-react';

const Hero3DBox = dynamic(() => import('@/components/landing/Hero3DBox'), { ssr: false });

const inter = Inter({ subsets: ['latin'] });

// --- Advanced Particles Component ---
const Particles = () => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#4361EE] opacity-[0.2]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: ['0%', '-100%'],
            opacity: [0, 0.5, 0]
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
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`${inter.className} min-h-screen text-slate-300 selection:bg-[#4361EE]/40 overflow-x-hidden bg-[#020205]`}>
      
      {/* --- PREMIUM NAVBAR --- */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? 'bg-[#020205]/80 backdrop-blur-[20px] border-b border-white/5 py-4 shadow-2xl' 
            : 'bg-transparent py-8'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group z-50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4361EE] to-[#3B82F6] flex items-center justify-center shadow-[0_0_20px_rgba(67,97,238,0.4)] group-hover:scale-110 transition-transform">
              <Box className="w-6 h-6 text-white" />
            </div>
            <span className="font-black text-2xl tracking-tighter text-white">PackIQ</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-10 text-[14px] font-black uppercase tracking-widest text-slate-400">
            {['Technology', 'Platform', 'Network', 'Pricing'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase().replace(/ /g, '-')}`} 
                className="relative group hover:text-white transition-colors py-2"
              >
                {item}
                <motion.span 
                  className="absolute bottom-0 left-0 h-[2px] bg-[#4361EE] rounded-full"
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-6">
            <Link 
              href="/auth/login" 
              className="text-[14px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
            >
              Access
            </Link>
            <Link 
              href="/auth/signup" 
              className="group flex items-center gap-2 bg-white text-black px-7 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:bg-[#4361EE] hover:text-white shadow-[0_10px_20px_rgba(255,255,255,0.1)] hover:shadow-[0_10px_20px_rgba(67,97,238,0.3)]"
            >
              Initialize
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="lg:hidden z-50 text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              className="fixed inset-0 bg-[#020205] z-[40] flex flex-col items-center justify-center gap-8 lg:hidden"
            >
              {['Technology', 'Platform', 'Network', 'Pricing'].map((item) => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase().replace(/ /g, '-')}`} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-3xl font-black text-white uppercase tracking-tighter"
                >
                  {item}
                </a>
              ))}
              <div className="flex flex-col gap-4 w-full px-12 mt-8">
                <Link href="/auth/login" className="text-center py-4 rounded-xl border border-white/10 font-bold" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                <Link 
                  href="/auth/signup" 
                  className="text-center py-4 rounded-xl bg-[#4361EE] text-white font-bold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 overflow-hidden">
        {/* Deep Gradient Background */}
        <div className="absolute inset-0 z-0">
          <motion.div 
            style={{ y: y1 }}
            className="absolute top-[5%] left-[10%] w-[800px] h-[800px] bg-[#4361EE]/20 rounded-full blur-[150px] mix-blend-screen"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div 
            style={{ y: y2 }}
            className="absolute bottom-[10%] right-[10%] w-[900px] h-[900px] bg-[#06b6d4]/15 rounded-full blur-[180px] mix-blend-screen"
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <Particles />

        <div className="relative z-10 max-w-[1400px] mx-auto px-8 w-full grid lg:grid-cols-2 items-center gap-16">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 mb-10 backdrop-blur-md"
            >
              <div className="flex -space-x-2">
                {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-[#020205] bg-slate-700" />)}
              </div>
              <span className="text-[12px] font-black uppercase tracking-widest text-[#4361EE]">Version 4.0 Live Now</span>
            </motion.div>

            <h1 className="text-6xl md:text-[90px] font-black leading-[0.95] tracking-tighter mb-10 text-white">
              Spatially <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4361EE] via-[#3B82F6] to-[#06b6d4]">
                Aware AI.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 font-medium max-w-xl leading-relaxed mb-12">
              The world's first autonomous logistics engine powered by real-time neural spatial reasoning. Pack faster, ship cheaper, and eliminate waste at scale.
            </p>

            <div className="flex flex-wrap gap-6">
              <Link 
                href="/auth/signup" 
                className="group flex items-center gap-3 bg-white text-black px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-105 shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
              >
                Launch Intelligence
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all backdrop-blur-md">
                <Play className="w-5 h-5 text-[#4361EE] group-hover:scale-110 transition-transform" />
                View Demo
              </button>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-12 border-t border-white/10 pt-10">
              {[
                { val: "99.2%", label: "Accuracy" },
                { val: "40ms", label: "Latency" },
                { val: "24/7", label: "Uptime" }
              ].map((s, i) => (
                <div key={i}>
                  <p className="text-2xl font-black text-white">{s.val}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* 3D Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="relative h-[600px] w-full"
          >
             <div className="absolute inset-0 bg-[#4361EE]/5 rounded-full blur-[100px] animate-pulse" />
             <Hero3DBox />
             
             {/* Floating Labels */}
             <motion.div 
               animate={{ y: [0, -15, 0] }}
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="absolute top-1/4 -left-4 p-4 bg-[#0A0A0F]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-20"
             >
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-green-500" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase">Savings</p>
                      <p className="text-sm font-black text-white">+$12,450</p>
                   </div>
                </div>
             </motion.div>

             <motion.div 
               animate={{ y: [0, 20, 0] }}
               transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
               className="absolute bottom-1/4 -right-4 p-4 bg-[#0A0A0F]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-20"
             >
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-[#4361EE]/20 flex items-center justify-center">
                      <BarChart2 className="w-4 h-4 text-[#4361EE]" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase">Efficiency</p>
                      <p className="text-sm font-black text-white">98.4%</p>
                   </div>
                </div>
             </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- TECH TAPE --- */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02] backdrop-blur-md overflow-hidden relative z-20">
        <div className="flex w-full overflow-hidden relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
          <motion.div 
            className="flex items-center gap-24 whitespace-nowrap px-8"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
          >
            {[...Array(2)].map((_, j) => (
              <div key={j} className="flex items-center gap-24 opacity-30 grayscale invert">
                {['FEDEX', 'DHL', 'AMAZON', 'UPS', 'MAERSK', 'SHOPIFY', 'WALMART', 'APPLE'].map(brand => (
                  <span key={brand} className="text-3xl font-black tracking-tighter text-white italic">{brand}</span>
                ))}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="technology" className="py-32 px-8 relative z-10">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-12 gap-16 items-end mb-24">
             <div className="lg:col-span-7">
               <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex items-center gap-4 mb-6">
                 <div className="h-[2px] w-12 bg-[#4361EE]" />
                 <span className="text-xs font-black uppercase tracking-widest text-[#4361EE]">Technical Core</span>
               </motion.div>
               <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-[0.95]">
                 Engineered for <br />
                 Extreme Performance.
               </h2>
             </div>
             <div className="lg:col-span-5">
               <p className="text-xl text-slate-400 font-medium leading-relaxed">
                 We've stripped away the complexity. PackIQ leverages raw spatial compute to solve three-dimensional bin packing problems in milliseconds.
               </p>
             </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Brain, title: "Neural Spatial engine", desc: "Our 4th-gen neural net understands volume, weight distribution, and fragility constraints like a human expert.", color: "#4361EE" },
              { icon: Globe, title: "Global Logistics API", desc: "Instantly connect to every major carrier worldwide. Real-time rate calculations and verification.", color: "#06b6d4" },
              { icon: InfinityIcon, title: "Continuous Learning", desc: "Every package processed makes the engine smarter. Self-optimizing feedback loops ensure 100% precision.", color: "#8B5CF6" }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="group p-10 bg-white/[0.02] border border-white/5 rounded-[40px] hover:bg-white/[0.05] transition-all hover:border-[#4361EE]/50 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                   <item.icon className="w-32 h-32 text-white" />
                </div>
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 transition-transform">
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">{item.title}</h4>
                  <p className="text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-32 px-8">
        <div className="max-w-[1400px] mx-auto bg-gradient-to-br from-[#4361EE] to-[#3B82F6] rounded-[60px] p-20 relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 left-0 w-full h-full opacity-10">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:40px_40px]" />
           </div>
           <div className="relative z-10 flex flex-col items-center text-center">
              <h2 className="text-5xl md:text-[80px] font-black text-white tracking-tighter leading-[0.9] mb-12">
                Ready to optimize <br /> your operations?
              </h2>
              <div className="flex flex-wrap justify-center gap-6">
                <Link href="/auth/signup" className="bg-white text-black px-12 py-6 rounded-3xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl">
                  Get Started Now
                </Link>
                <button className="bg-black/20 backdrop-blur-md text-white border border-white/20 px-12 py-6 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-black/30 transition-all">
                  Schedule Demo
                </button>
              </div>
           </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="pt-32 pb-16 px-8 border-t border-white/5">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-24">
            <div className="col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                  <Box className="w-6 h-6 text-black" />
                </div>
                <span className="font-black text-2xl tracking-tighter text-white">PackIQ</span>
              </Link>
              <p className="text-slate-500 font-medium leading-relaxed">
                Autonomous logistics intelligence for the modern supply chain. Powered by advanced spatial reasoning.
              </p>
            </div>
            
            {['Product', 'Company', 'Legal', 'Social'].map((title, i) => (
              <div key={i}>
                <h5 className="text-white font-black uppercase tracking-widest text-xs mb-8">{title}</h5>
                <ul className="space-y-4">
                  {['Features', 'API', 'Docs', 'Network'].map(link => (
                    <li key={link}><a href="#" className="text-slate-500 hover:text-white transition-colors font-medium">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-12 border-t border-white/5">
            <p className="text-slate-600 font-bold text-xs uppercase tracking-widest">© 2026 PackIQ Technologies. Designed for excellence.</p>
            <div className="flex gap-10">
              {['Twitter', 'LinkedIn', 'Github'].map(s => <a key={s} href="#" className="text-slate-600 hover:text-white transition-colors text-xs font-black uppercase tracking-widest">{s}</a>)}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
