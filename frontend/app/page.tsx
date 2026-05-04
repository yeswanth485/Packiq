'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, AnimatePresence, useInView, animate } from 'framer-motion';
import { Inter } from 'next/font/google';
import {
  Box, ArrowRight, Play, Menu, X, Check, Brain, ShieldCheck, BarChart2,
  Database, Zap, Truck, Plus, Minus, TrendingUp, Clock, DollarSign
} from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

// --- ANIMATED COUNTER COMPONENT ---
function Counter({ value, suffix = '', prefix = '', isDecimal = false }: { value: number, suffix?: string, prefix?: string, isDecimal?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration: 2,
        onUpdate(v) {
          setDisplayValue(v);
        },
        ease: "easeOut"
      });
      return () => controls.stop();
    }
  }, [value, isInView]);

  const formatted = isDecimal ? displayValue.toFixed(1) : Math.floor(displayValue).toLocaleString();

  return <span ref={ref}>{prefix}{formatted}{suffix}</span>;
}

// --- ACCORDION COMPONENT ---
function FAQAccordion({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-white/10 py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left focus:outline-none"
      >
        <span className="text-[15px] font-medium text-white">{question}</span>
        {isOpen ? <Minus className="w-4 h-4 text-gray-400" /> : <Plus className="w-4 h-4 text-gray-400" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pt-3 text-[14px] text-gray-400 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- MAIN PAGE ---
export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: 'smooth'
      });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className={`${inter.className} min-h-screen text-gray-400 bg-[#0A0A0F] selection:bg-[#185FA5]/30 overflow-x-hidden touch-manipulation`}>
      
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 1 — STICKY NAV BAR
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-[#0A0A0F]/80 backdrop-blur-[12px] border-b border-white/10 py-4' 
            : 'bg-transparent py-6 border-b border-transparent'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group z-50">
            <div className="w-6 h-6 rounded bg-[#185FA5] flex items-center justify-center p-1">
              <Box className="w-full h-full text-white" strokeWidth={2.5} />
            </div>
            <span className="font-medium text-[16px] text-white tracking-tight">PackIQ</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-[13px] text-gray-400">
            {['What we do', 'How it works', 'Partners', 'Pricing'].map((item) => (
              <a 
                key={item} 
                href={`#${item.toLowerCase().replace(/ /g, '-')}`} 
                onClick={(e) => scrollToSection(e, item.toLowerCase().replace(/ /g, '-'))}
                className="hover:text-white transition-colors py-2"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/auth/login" 
              className="text-[13px] font-medium text-gray-300 hover:text-white px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5 transition-all"
            >
              Sign in
            </Link>
            <Link 
              href="/auth/signup" 
              className="text-[13px] font-medium text-white bg-[#185FA5] hover:bg-[#144D86] px-5 py-2 rounded-lg transition-all"
            >
              Get started
            </Link>
          </div>

          <button 
            className="md:hidden z-50 text-white p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 w-full bg-[#0A0A0F]/95 backdrop-blur-xl border-b border-white/10 p-6 flex flex-col gap-4 md:hidden"
            >
              {['What we do', 'How it works', 'Partners', 'Pricing'].map((item) => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase().replace(/ /g, '-')}`} 
                  onClick={(e) => scrollToSection(e, item.toLowerCase().replace(/ /g, '-'))}
                  className="text-[15px] font-medium text-white py-2"
                >
                  {item}
                </a>
              ))}
              <div className="h-[1px] bg-white/10 my-2" />
              <Link href="/auth/login" className="text-[15px] font-medium text-gray-300 py-2" onClick={() => setMobileMenuOpen(false)}>Sign in</Link>
              <Link 
                href="/auth/signup" 
                className="text-[15px] font-medium text-white bg-[#185FA5] py-3 rounded-lg text-center mt-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get started
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 2 — HERO
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative pt-[160px] pb-12 px-6 flex flex-col items-center text-center">
        {/* Subtle Background Glow to avoid pure black dullness */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-[#185FA5]/10 rounded-full blur-[120px] pointer-events-none -z-10" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#185FA5]/20 border border-[#185FA5]/30 mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#185FA5] animate-pulse" />
          <span className="text-[11px] font-medium text-blue-200 uppercase tracking-wide">Next-gen logistics AI</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[36px] font-medium leading-[1.2] tracking-tight mb-6 text-white max-w-[560px]"
        >
          Packaging intelligence that pays for itself.
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-[15px] text-gray-400 max-w-[480px] leading-relaxed mb-8"
        >
          Reduce void space by 40%, cut carrier costs, and ship faster — all powered by real-time AI spatial reasoning.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link 
            href="/auth/signup" 
            className="w-full sm:w-auto flex items-center justify-center bg-[#185FA5] hover:bg-[#144D86] text-white px-6 py-3 rounded-lg font-medium text-[14px] transition-all"
          >
            Launch platform
          </Link>
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-transparent hover:bg-white/5 border border-white/20 text-white px-6 py-3 rounded-lg font-medium text-[14px] transition-all">
            <Play className="w-4 h-4" /> Watch 2-min demo
          </button>
        </motion.div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 3 — PARTNER LOGO MARQUEE
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="partners" className="py-12 border-y border-white/5 bg-white/[0.01] overflow-hidden">
        <div className="max-w-[1200px] mx-auto flex flex-col items-center">
          <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-gray-500 mb-8">Powering global supply chains</p>
          <div className="w-full relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}>
            <motion.div 
              className="flex items-center gap-6 whitespace-nowrap px-4"
              animate={{ x: ['0%', '-50%'] }}
              transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
            >
              {[...Array(2)].map((_, j) => (
                <div key={j} className="flex items-center gap-6">
                  {['FedEx', 'DHL', 'Amazon', 'UPS', 'Maersk', 'Shopify'].map((brand, i) => (
                    <div key={`${j}-${i}`} className="px-6 py-2 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center min-w-[120px]">
                      <span className="text-[14px] font-semibold tracking-wide text-gray-300 opacity-80">{brand}</span>
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 4 — STATS BAR
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-16 px-6 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden">
           <div className="p-8 text-center md:border-r md:border-b-0 border-b border-white/10 flex flex-col items-center justify-center">
              <span className="text-[32px] font-medium text-[#185FA5] mb-2">
                <Counter value={40} suffix="%" />
              </span>
              <span className="text-[13px] text-gray-400">Average void space reduction</span>
           </div>
           <div className="p-8 text-center md:border-r md:border-b-0 border-b border-white/10 flex flex-col items-center justify-center">
              <span className="text-[32px] font-medium text-[#185FA5] mb-2">
                <Counter value={2.4} prefix="$" suffix="M" isDecimal={true} />
              </span>
              <span className="text-[13px] text-gray-400">Saved by customers in 2025</span>
           </div>
           <div className="p-8 text-center flex flex-col items-center justify-center">
              <span className="text-[32px] font-medium text-[#185FA5] mb-2">
                <Counter value={12} suffix="ms" />
              </span>
              <span className="text-[13px] text-gray-400">Average optimization time</span>
           </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 5 — FEATURES (WHAT WE DO)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="what-we-do" className="py-16 px-6 max-w-[1200px] mx-auto">
        <div className="mb-12">
          <h2 className="text-[11px] font-medium tracking-[0.1em] uppercase text-gray-500 mb-3">What we do</h2>
          <h3 className="text-[28px] font-medium text-white tracking-tight">Intelligent packaging for modern fulfillment.</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "Spatial AI engine", desc: "Advanced 3D bin-packing algorithms instantly calculate the absolute minimum volume required for any combination of products." },
            { icon: ShieldCheck, title: "Real-time verification", desc: "Enterprise-grade security with real-time API integrations. Seamlessly connect your WMS and verify dimensions on the fly." },
            { icon: BarChart2, title: "Savings analytics", desc: "Visualize every cent saved. Track void-space reduction, weight optimization, and carrier cost drops across all orders." }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white/[0.02] border border-white/10 rounded-xl p-6 transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
            >
              <div className="w-10 h-10 rounded-lg bg-[#185FA5]/20 flex items-center justify-center mb-5 border border-[#185FA5]/30">
                <item.icon className="w-5 h-5 text-[#185FA5]" />
              </div>
              <h4 className="text-[16px] font-medium mb-2 text-white">{item.title}</h4>
              <p className="text-[14px] text-gray-400 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 6 — PRODUCT DEMO PREVIEW
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-16 px-6 max-w-[1200px] mx-auto flex flex-col items-center">
        <div className="text-center mb-12">
          <h2 className="text-[11px] font-medium tracking-[0.1em] uppercase text-gray-500 mb-3">Product preview</h2>
          <h3 className="text-[28px] font-medium text-white tracking-tight">See it in action.</h3>
        </div>

        <div className="w-full max-w-[900px] bg-[#12121A] border border-white/10 rounded-xl overflow-hidden shadow-2xl mb-8">
           {/* Browser Chrome */}
           <div className="bg-[#1A1A24] border-b border-white/10 px-4 py-3 flex items-center gap-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 flex justify-center">
                 <div className="bg-black/30 px-4 py-1.5 rounded-md text-[11px] text-gray-500 font-medium font-mono flex items-center gap-2">
                    app.packiq.com/dashboard
                 </div>
              </div>
           </div>
           
           {/* Dashboard Mock Content */}
           <div className="p-8 bg-[#0A0A0F]">
              <div className="flex items-center justify-between mb-8">
                 <h4 className="text-[18px] font-medium text-white">Analytics Overview</h4>
                 <div className="text-[12px] text-gray-500">Today, May 4, 2026</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 {[
                   { label: 'Orders optimized today', value: '1,247', sub: '+18% vs yesterday', icon: Box },
                   { label: 'Cost saved today', value: '$4,821', sub: '+22% vs yesterday', icon: DollarSign },
                   { label: 'Void space reduction', value: '38.4%', sub: '+4% vs yesterday', icon: TrendingUp },
                   { label: 'Avg optimization time', value: '11ms', sub: '-2ms vs yesterday', icon: Clock }
                 ].map((kpi, i) => (
                   <div key={i} className="bg-white/[0.03] border border-white/5 rounded-lg p-5">
                      <div className="flex items-center gap-2 mb-2 text-gray-400">
                         <kpi.icon className="w-4 h-4" />
                         <span className="text-[12px]">{kpi.label}</span>
                      </div>
                      <div className="text-[24px] font-medium text-white mb-2">{kpi.value}</div>
                      <div className="text-[11px] text-green-400">{kpi.sub}</div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <Link href="/auth/signup" className="text-[#185FA5] hover:text-[#2178D1] text-[14px] font-medium flex items-center gap-2 transition-colors">
          Try the live platform <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 7 — HOW IT WORKS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="how-it-works" className="py-16 px-6 max-w-[1200px] mx-auto border-t border-white/5 mt-8">
        <div className="text-center mb-16">
          <h2 className="text-[11px] font-medium tracking-[0.1em] uppercase text-gray-500 mb-3">How it works</h2>
          <h3 className="text-[28px] font-medium text-white tracking-tight">Three steps to smarter shipping.</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Desktop Dividers */}
          <div className="hidden md:block absolute top-0 bottom-0 left-[33%] w-[1px] bg-white/10" />
          <div className="hidden md:block absolute top-0 bottom-0 left-[66%] w-[1px] bg-white/10" />

          {[
            { num: "01", title: "Sync: Connect your inventory", desc: "Import via CSV, REST API, or direct WMS integrations instantly." },
            { num: "02", title: "Optimize: AI finds the perfect box", desc: "Millisecond processing tests thousands of configurations." },
            { num: "03", title: "Ship: Pack and go", desc: "Visual 3D packing guides reduce warehouse errors and speed up fulfillment." }
          ].map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col md:px-6"
            >
              <div className="text-[12px] font-medium text-[#185FA5] mb-4">Step {step.num}</div>
              <h4 className="text-[16px] font-medium text-white mb-3">{step.title}</h4>
              <p className="text-[14px] text-gray-400 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 8 — TESTIMONIALS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-16 px-6 max-w-[1200px] mx-auto bg-white/[0.01] rounded-2xl border border-white/5 mb-16">
        <div className="text-center mb-12">
          <h2 className="text-[11px] font-medium tracking-[0.1em] uppercase text-gray-500 mb-3">Customer stories</h2>
          <h3 className="text-[28px] font-medium text-white tracking-tight">Trusted by fulfillment leaders.</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6 px-4 md:px-12">
           <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 flex flex-col justify-between">
              <p className="text-[15px] text-gray-300 leading-relaxed mb-8 italic">
                "PackIQ cut our packaging waste by 43% in the first month. The visual packing guides completely eliminated our new-hire training time."
              </p>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-[#185FA5]/20 flex items-center justify-center text-[#185FA5] font-medium text-[13px]">
                   RK
                 </div>
                 <div>
                   <div className="text-[14px] font-medium text-white">Rahul Krishnan</div>
                   <div className="text-[12px] text-gray-500">VP Operations, NimbleCart</div>
                 </div>
              </div>
           </div>

           <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 flex flex-col justify-between">
              <p className="text-[15px] text-gray-300 leading-relaxed mb-8 italic">
                "We process 8,000 orders a day. PackIQ handles all of them in real time via API. The carrier cost savings alone paid for the software in three days."
              </p>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-medium text-[13px]">
                   SL
                 </div>
                 <div>
                   <div className="text-[14px] font-medium text-white">Sarah Lin</div>
                   <div className="text-[12px] text-gray-500">Head of Logistics, SwiftFulfilment</div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 9 — PRICING
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="pricing" className="py-16 px-6 max-w-[1200px] mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-[28px] font-medium text-white tracking-tight mb-8">Simple, transparent pricing.</h3>
          
          <div className="inline-flex items-center bg-[#12121A] p-1 rounded-lg border border-white/10">
            <button 
              onClick={() => setAnnualBilling(false)}
              className={`px-5 py-2 rounded-md text-[13px] font-medium transition-all ${!annualBilling ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setAnnualBilling(true)}
              className={`px-5 py-2 rounded-md text-[13px] font-medium transition-all flex items-center gap-2 ${annualBilling ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            >
              Annually <span className="text-blue-400 text-[10px] bg-blue-500/10 px-1.5 py-0.5 rounded">20% off</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-center">
          {/* Starter */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-8 hover:-translate-y-1 transition-transform">
            <h4 className="text-[16px] font-medium text-white mb-2">Starter</h4>
            <p className="text-[13px] text-gray-500 mb-6">For growing e-commerce brands.</p>
            <div className="mb-6">
              <span className="text-[32px] font-medium text-white">${annualBilling ? '49' : '59'}</span>
              <span className="text-[13px] text-gray-500">/mo</span>
            </div>
            <ul className="space-y-4 mb-8">
              {['Up to 1,000 orders/mo', 'Standard 3D Algorithm', 'Email Support', 'Basic Analytics'].map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-[13px] text-gray-300">
                  <Check className="w-4 h-4 text-gray-500" /> {feat}
                </li>
              ))}
            </ul>
            <button className="w-full py-2.5 rounded-lg border border-white/20 text-white hover:bg-white/5 text-[13px] font-medium transition-all">
              Start free trial
            </button>
          </div>

          {/* Growth */}
          <div className="relative bg-[#12121A] border-2 border-[#185FA5] rounded-xl p-8 hover:-translate-y-1 transition-transform md:-mt-4 md:mb-4 shadow-2xl">
            <div className="absolute -top-3 right-6 bg-[#185FA5] text-white text-[10px] font-medium uppercase tracking-wide py-1 px-3 rounded-full">
              Most popular
            </div>
            <h4 className="text-[16px] font-medium text-white mb-2">Growth</h4>
            <p className="text-[13px] text-gray-500 mb-6">For high-volume fulfillment centers.</p>
            <div className="mb-6">
              <span className="text-[32px] font-medium text-white">${annualBilling ? '199' : '249'}</span>
              <span className="text-[13px] text-gray-500">/mo</span>
            </div>
            <ul className="space-y-4 mb-8">
              {['Up to 10,000 orders/mo', 'Advanced Spatial Engine', 'Priority Support', 'Custom Box Sizes', 'API Access'].map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-[13px] text-white">
                  <Check className="w-4 h-4 text-[#185FA5]" /> {feat}
                </li>
              ))}
            </ul>
            <button className="w-full py-2.5 rounded-lg bg-[#185FA5] hover:bg-[#144D86] text-white text-[13px] font-medium transition-all">
              Get started
            </button>
          </div>

          {/* Enterprise */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-8 hover:-translate-y-1 transition-transform">
            <h4 className="text-[16px] font-medium text-white mb-2">Enterprise</h4>
            <p className="text-[13px] text-gray-500 mb-6">For global supply chain operations.</p>
            <div className="mb-6">
              <span className="text-[32px] font-medium text-white">Custom</span>
            </div>
            <ul className="space-y-4 mb-8">
              {['Unlimited orders', 'Dedicated Infrastructure', '24/7 Phone Support', 'WMS/ERP Integration', 'SLA Guarantee'].map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-[13px] text-gray-300">
                  <Check className="w-4 h-4 text-gray-500" /> {feat}
                </li>
              ))}
            </ul>
            <button className="w-full py-2.5 rounded-lg border border-white/20 text-white hover:bg-white/5 text-[13px] font-medium transition-all">
              Talk to sales
            </button>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 10 — FAQ
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-16 px-6 max-w-[800px] mx-auto">
        <div className="mb-10 text-center">
          <h2 className="text-[11px] font-medium tracking-[0.1em] uppercase text-gray-500 mb-3">FAQ</h2>
          <h3 className="text-[28px] font-medium text-white tracking-tight">Common questions answered.</h3>
        </div>
        
        <div className="border-t border-white/10">
          <FAQAccordion 
            question="Do I need to sign a long-term contract?" 
            answer="No, all plans are month-to-month. You can cancel at any time without penalty. We also offer annual billing with a 20% discount if you choose to commit." 
          />
          <FAQAccordion 
            question="How does the free trial work?" 
            answer="You get 14 days of unrestricted access to the platform. No credit card is required to sign up. You can test imports, run optimizations, and view savings analytics." 
          />
          <FAQAccordion 
            question="Can I import from my existing WMS?" 
            answer="Yes — we support bulk CSV imports, a robust REST API, and direct integrations with popular WMS platforms like ShipBob and Shopify." 
          />
          <FAQAccordion 
            question="How accurate is the AI optimization?" 
            answer="Our 3D spatial reasoning engine operates at 94–98% void-space efficiency, thoroughly verified against thousands of real-world fulfillment shipments." 
          />
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 11 — FINAL CTA BANNER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-16 px-6 max-w-[1200px] mx-auto mb-16">
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-12 text-center relative overflow-hidden">
           <div className="absolute inset-0 bg-[#185FA5]/5" />
           <div className="relative z-10">
              <h2 className="text-[32px] font-medium text-white tracking-tight mb-4">Ready to cut shipping costs?</h2>
              <p className="text-[15px] text-gray-400 mb-8 max-w-md mx-auto">
                Join 500+ fulfillment teams. Free 14-day trial, no credit card needed.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/auth/signup" className="bg-[#185FA5] hover:bg-[#144D86] text-white px-8 py-3 rounded-lg font-medium text-[15px] transition-all">
                  Start free trial
                </Link>
                <button className="bg-transparent hover:bg-white/5 border border-white/20 text-white px-8 py-3 rounded-lg font-medium text-[15px] transition-all">
                  Talk to sales
                </button>
              </div>
           </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 12 — FOOTER
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="pt-16 pb-8 px-6 border-t border-white/10 bg-[#0A0A0F]">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <div className="w-5 h-5 rounded-[4px] bg-[#185FA5] flex items-center justify-center p-0.5">
                  <Box className="w-full h-full text-white" strokeWidth={2.5} />
                </div>
                <span className="font-medium text-[15px] text-white tracking-tight">PackIQ</span>
              </Link>
              <p className="text-[13px] text-gray-500 max-w-[200px] leading-relaxed">
                Logistics intelligence designed to eliminate waste and accelerate fulfillment.
              </p>
            </div>
            
            <div>
              <h5 className="text-white font-medium text-[13px] mb-4">Product</h5>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'Integrations', 'Changelog'].map(link => (
                  <li key={link}><Link href={`/${link.toLowerCase()}`} className="text-[13px] text-gray-500 hover:text-white transition-colors">{link}</Link></li>
                ))}
              </ul>
            </div>
            
            <div>
              <h5 className="text-white font-medium text-[13px] mb-4">Company</h5>
              <ul className="space-y-3">
                {['About Us', 'Careers', 'Blog', 'Contact'].map(link => (
                  <li key={link}><Link href={`/${link.toLowerCase().replace(' ', '-')}`} className="text-[13px] text-gray-500 hover:text-white transition-colors">{link}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-white font-medium text-[13px] mb-4">Legal</h5>
              <ul className="space-y-3">
                {['Privacy Policy', 'Terms of Service', 'Security'].map(link => (
                  <li key={link}><Link href={`/${link.toLowerCase().replace(/ /g, '-')}`} className="text-[13px] text-gray-500 hover:text-white transition-colors">{link}</Link></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5 gap-4">
            <p className="text-[12px] text-gray-500">© 2026 PackIQ Technologies Inc.</p>
            <p className="text-[12px] text-gray-500">Made with AI in India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
