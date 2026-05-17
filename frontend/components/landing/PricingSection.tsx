'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const PLANS = [
  {
    name: 'Starter',
    subtitle: 'For small businesses getting started',
    priceUSD: '$12',
    priceINR: '₹999',
    period: '/mo',
    color: '#ffffff',
    features: [
      '500 optimizations/mo',
      'Box catalog manager',
      'CSV bulk upload',
      'Basic analytics',
      'Standard support',
    ],
    cta: 'Get Started Free',
    href: '/auth/signup',
    popular: false,
  },
  {
    name: 'Growth',
    subtitle: 'For growing e-commerce brands',
    priceUSD: '$59',
    priceINR: '₹4,999',
    period: '/mo',
    color: '#00FFD1',
    features: [
      'Unlimited optimizations',
      'PackVision AI analysis',
      '3D Box visualization',
      'Sustainability & waste reports',
      'Priority email support',
    ],
    cta: 'Start Growth Trial',
    href: '/auth/signup',
    popular: true,
  },
  {
    name: 'Enterprise',
    subtitle: 'For large-scale operations',
    priceUSD: 'Custom',
    priceINR: 'Custom',
    period: '',
    color: '#4361EE',
    features: [
      'Everything in Growth',
      'Custom AI model training',
      'Warehouse intelligence',
      'API access & integrations',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    href: '/auth/signup',
    popular: false,
  },
]

export function PricingSection() {
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD')

  return (
    <section id="pricing" className="py-40 px-6 bg-[#0A0A0F] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[#185FA5]/5 rounded-full blur-[200px] pointer-events-none" />

      <div className="max-w-[1300px] mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="text-[10px] font-black text-[#00FFD1] uppercase tracking-[0.5em] mb-6">Subscription Plans</div>
          <h2 className="text-5xl md:text-[100px] font-bold font-syne tracking-tighter leading-[0.85] mb-10">
            Engineered for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFD1] to-[#185FA5]">
              Exponential Scale
            </span>
          </h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-medium mb-10">
            Choose the right infrastructure for your logistics volume.
          </p>
          
          {/* Currency Toggle */}
          <div className="inline-flex items-center p-1 bg-white/[0.03] border border-white/10 rounded-2xl mx-auto">
            {(['USD', 'INR'] as const).map(c => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  currency === c 
                    ? 'bg-[#00FFD1] text-[#0A0A0F] shadow-[0_0_20px_rgba(0,255,209,0.3)]' 
                    : 'text-gray-500 hover:text-white'
                }`}
              >
                {c === 'USD' ? '$ USD' : '₹ INR'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className={`relative flex flex-col p-12 rounded-[48px] border transition-all duration-700 group
                ${plan.popular
                  ? 'bg-white/[0.05] border-[#00FFD1]/30 shadow-[0_0_80px_rgba(0,255,209,0.12)] scale-105 z-10'
                  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <div className="bg-[#00FFD1] text-[#0A0A0F] px-8 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_0_20px_#00FFD1]">
                    Recommended
                  </div>
                </div>
              )}

              <div className="mb-10">
                <h3 className="text-3xl font-bold text-white font-syne mb-3 tracking-tighter">{plan.name}</h3>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">{plan.subtitle}</p>
              </div>

              <div className="mb-12">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-black font-syne tracking-tighter ${plan.priceUSD === 'Custom' ? 'text-4xl' : 'text-6xl'}`}
                    style={{ color: plan.color }}
                  >
                    {currency === 'USD' ? plan.priceUSD : plan.priceINR}
                  </span>
                  <span className="text-gray-600 text-xl font-bold">{plan.period}</span>
                </div>
              </div>

              <div className="h-px w-full bg-white/5 mb-12" />

              <ul className="space-y-6 mb-12 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-4">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: `${plan.color}15` }}
                    >
                      <Check className="w-3.5 h-3.5" style={{ color: plan.color }} />
                    </div>
                    <span className="text-[13px] text-gray-500 font-medium leading-tight">{feat}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`w-full py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] text-center transition-all duration-500
                  ${plan.popular
                    ? 'bg-[#00FFD1] text-[#0A0A0F] hover:scale-105 shadow-[0_0_40px_rgba(0,255,209,0.3)]'
                    : 'bg-white/[0.04] border border-white/10 text-white hover:bg-white/[0.08] hover:border-[#00FFD1]/30'
                  }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
