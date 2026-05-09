'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const PLANS = [
  {
    name: 'Starter',
    subtitle: 'For small businesses getting started',
    price: '$0',
    period: '/mo',
    color: '#ffffff',
    features: [
      'Up to 100 optimizations/mo',
      '5 box catalog entries',
      'Basic analytics',
      'Email support',
    ],
    cta: 'Get Started Free',
    href: '/auth/signup',
    popular: false,
  },
  {
    name: 'Pro',
    subtitle: 'For growing e-commerce brands',
    price: '$49',
    period: '/mo',
    color: '#00FFD1',
    features: [
      'Unlimited optimizations',
      'Full box catalog',
      'Advanced analytics & reports',
      '3D box visualization',
      'Priority support',
      'CSV bulk upload',
    ],
    cta: 'Start Pro Trial',
    href: '/auth/signup',
    popular: true,
  },
  {
    name: 'Enterprise',
    subtitle: 'For large-scale operations',
    price: '$149',
    period: '/mo',
    color: '#4361EE',
    features: [
      'Everything in Pro',
      'Custom AI model training',
      'Dedicated account manager',
      'API access with SLA',
      'Multi-brand management',
      'On-premise deployment',
    ],
    cta: 'Contact Sales',
    href: '/auth/signup',
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-32 px-6 bg-[#0A0A0F] relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-[#185FA5]/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto relative z-10">
        <div className="text-center mb-20">
          <div className="text-[10px] font-black text-[#00FFD1] uppercase tracking-[0.4em] mb-4">Pricing</div>
          <h2 className="text-4xl md:text-7xl font-bold font-syne tracking-tighter leading-tight mb-6">
            Simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFD1] to-[#185FA5]">transparent</span> pricing
          </h2>
          <p className="text-xl text-gray-400 max-w-xl mx-auto leading-relaxed">
            Start free, scale as you grow. No hidden fees.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className={`relative flex flex-col p-10 rounded-[40px] border transition-all duration-500 group
                ${plan.popular
                  ? 'bg-white/[0.04] border-[#00FFD1]/30 shadow-[0_0_60px_rgba(0,255,209,0.08)]'
                  : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-[#00FFD1] text-[#0A0A0F] px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-white font-syne mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-500">{plan.subtitle}</p>
              </div>

              <div className="mb-10">
                <div className="flex items-end gap-1">
                  <span
                    className="text-5xl font-black font-syne"
                    style={{ color: plan.color }}
                  >
                    {plan.price}
                  </span>
                  <span className="text-gray-500 text-lg mb-1.5">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${plan.color}20` }}
                    >
                      <Check className="w-3 h-3" style={{ color: plan.color }} />
                    </div>
                    <span className="text-sm text-gray-400">{feat}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest text-center transition-all duration-300
                  ${plan.popular
                    ? 'bg-[#00FFD1] text-[#0A0A0F] hover:scale-105 shadow-[0_0_30px_rgba(0,255,209,0.25)]'
                    : 'bg-white/[0.05] border border-white/10 text-white hover:bg-white/[0.08]'
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
