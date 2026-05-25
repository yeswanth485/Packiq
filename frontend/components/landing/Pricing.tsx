'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import Link from 'next/link'

const PLANS = [
  {
    name: 'Starter',
    price: 0,
    features: ['100 SKUs/mo', 'Basic 3D View', 'Email Support', 'CSV Export']
  },
  {
    name: 'Pro',
    price: 2499,
    recommended: true,
    features: ['10,000 SKUs/mo', 'Full 3D Intelligence', 'Sustainability Tracking', 'Priority Support', 'API Access']
  },
  {
    name: 'Max',
    price: 9999,
    features: ['Unlimited SKUs', 'Custom Box Catalog', 'Dedicated Account Manager', 'Custom Integrations', 'SLA Guarantee']
  }
]

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <section id="pricing" className="py-32 px-6">
      <div className="max-w-7xl mx-auto space-y-20">
        <div className="text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold font-space-grotesk text-white">Simple, transparent pricing</h2>

          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-bold ${!isAnnual ? 'text-white' : 'text-zinc-500'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-14 h-7 bg-white/5 rounded-full p-1 relative"
            >
              <motion.div
                className="w-5 h-5 bg-blue-500 rounded-full"
                animate={{ x: isAnnual ? 28 : 0 }}
              />
            </button>
            <span className={`text-sm font-bold ${isAnnual ? 'text-white' : 'text-zinc-500'}`}>
              Annual <span className="text-emerald-400 ml-1">(-20%)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative p-10 rounded-[40px] border transition-all duration-500 ${
                plan.recommended
                  ? 'bg-blue-600 border-blue-400 scale-105 shadow-[0_0_60px_rgba(37,99,235,0.3)] z-10'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/10'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                  Recommended
                </div>
              )}

              <div className="space-y-8">
                <div className="space-y-2">
                  <h3 className={`text-xl font-bold font-space-grotesk ${plan.recommended ? 'text-white' : 'text-zinc-400'}`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-white">₹{isAnnual ? Math.round(plan.price * 0.8) : plan.price}</span>
                    <span className={`text-sm font-bold ${plan.recommended ? 'text-blue-200' : 'text-zinc-500'}`}>/mo</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {plan.features.map(feature => (
                    <div key={feature} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.recommended ? 'bg-white/20' : 'bg-emerald-500/10'}`}>
                        <Check className={`w-3 h-3 ${plan.recommended ? 'text-white' : 'text-emerald-500'}`} />
                      </div>
                      <span className={`text-sm font-medium ${plan.recommended ? 'text-blue-50' : 'text-zinc-400'}`}>{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/auth/signup"
                  className={`w-full py-4 rounded-2xl font-bold transition-all text-center block ${
                    plan.recommended
                      ? 'bg-white text-blue-600 hover:scale-[1.02]'
                      : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
