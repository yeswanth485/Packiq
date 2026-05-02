'use client'

import { useState } from 'react'
import { 
  Check, Zap, Shield, Globe, Users, 
  ArrowRight, CreditCard, Sparkles, Box,
  Package, LayoutDashboard, TrendingUp
} from 'lucide-react'
import { motion } from 'framer-motion'

const PLANS = [
  {
    name: 'Basic',
    price: '$0',
    desc: 'For individual sellers & hobbyists',
    features: [
      '10 Optimizations / month',
      'Standard Box Catalog',
      'Basic Email Support',
      'Public Tracking API'
    ],
    color: 'bg-white/5 text-gray-400',
    current: true
  },
  {
    name: 'Pro',
    price: '$49',
    desc: 'For growing e-commerce brands',
    features: [
      '500 Optimizations / month',
      'Custom Box Dimensions',
      'Priority AI (Claude 3.5)',
      'CO2 Savings Analytics',
      'Direct API Access'
    ],
    color: 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20',
    popular: true
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    desc: 'For large scale logistics & warehouses',
    features: [
      'Unlimited Optimizations',
      'Dedicated Fallback AI',
      'Multi-warehouse Sync',
      'White-label Reports',
      '24/7 Account Manager'
    ],
    color: 'bg-[#00E5CC] text-[#0A0A0F] shadow-xl shadow-[#00E5CC]/20'
  }
]

export default function SubscriptionPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-20 pt-10">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-white tracking-tight">Scale your spatial efficiency</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto">
          Choose the plan that fits your logistics volume. Upgrade anytime to unlock advanced AI models and custom box logic.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {PLANS.map((plan, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative glass p-10 rounded-[40px] border-white/5 flex flex-col ${plan.popular ? 'border-[#00E5CC]/20' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00E5CC] text-[#0A0A0F] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                Most Popular
              </div>
            )}

            <div className="mb-10">
              <h3 className="text-xl font-black text-white mb-2">{plan.name}</h3>
              <p className="text-xs text-gray-500 font-medium">{plan.desc}</p>
            </div>

            <div className="mb-10">
              <span className="text-5xl font-black text-white">{plan.price}</span>
              {plan.price !== 'Custom' && <span className="text-gray-500 text-sm font-bold ml-2">/ month</span>}
            </div>

            <ul className="space-y-5 mb-12 flex-1">
              {plan.features.map((feature, j) => (
                <li key={j} className="flex gap-4 items-start">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${plan.name === 'Enterprise' ? 'bg-[#0A0A0F] text-[#00E5CC]' : 'bg-white/10 text-white'}`}>
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-sm text-gray-400 font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <button className={`w-full py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] ${plan.color}`}>
              {plan.current ? 'Current Plan' : 'Get Started'}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="glass p-12 rounded-[50px] border-white/5 bg-white/[0.01] flex flex-col lg:flex-row items-center gap-12">
         <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-[#00E5CC] to-blue-600 flex items-center justify-center shrink-0 shadow-2xl shadow-[#00E5CC]/20">
            <Sparkles className="w-10 h-10 text-white" />
         </div>
         <div className="flex-1 text-center lg:text-left space-y-2">
            <h4 className="text-2xl font-black text-white">Need a custom logistics solution?</h4>
            <p className="text-gray-500 font-medium">Contact our spatial engineering team for personalized warehouse integration and API support.</p>
         </div>
         <button className="bg-white/5 hover:bg-white/10 text-white px-10 py-5 rounded-3xl font-black text-sm uppercase tracking-widest border border-white/10 transition-all flex items-center gap-3">
            Contact Sales <ArrowRight className="w-4 h-4" />
         </button>
      </div>
    </div>
  )
}
