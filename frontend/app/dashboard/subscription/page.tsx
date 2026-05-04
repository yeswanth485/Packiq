'use client'

import { useState, useEffect } from 'react'
import { 
  Check, Zap, Shield, Globe, Users, 
  ArrowRight, CreditCard, Sparkles, Box,
  Package, LayoutDashboard, TrendingUp,
  Download, Calendar, AlertCircle, Clock,
  ChevronRight, ArrowUpRight, HelpCircle, CheckCircle2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// --- MOCK DATA ---

const BILLING_HISTORY = [
  { id: 'INV-001', date: 'Oct 01, 2026', plan: 'Growth Plan', amount: '$49.00', status: 'Paid' },
  { id: 'INV-002', date: 'Sep 01, 2026', plan: 'Growth Plan', amount: '$49.00', status: 'Paid' },
  { id: 'INV-003', date: 'Aug 01, 2026', plan: 'Starter Plan', amount: '$19.00', status: 'Paid' },
  { id: 'INV-004', date: 'Jul 01, 2026', plan: 'Starter Plan', amount: '$19.00', status: 'Paid' }
]

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 19,
    annualPrice: 15,
    desc: 'For individual sellers & hobbyists',
    features: [
      '50 Optimizations / month',
      'Standard Box Catalog',
      'Basic Email Support',
      'Public Tracking API',
      '1 Admin User'
    ]
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyPrice: 49,
    annualPrice: 39,
    desc: 'For growing e-commerce brands',
    features: [
      '500 Optimizations / month',
      'Custom Box Dimensions',
      'Priority AI (Claude 4)',
      'CO2 Savings Analytics',
      'Direct API Access',
      '5 Admin Users'
    ],
    popular: true,
    current: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 'Custom',
    annualPrice: 'Custom',
    desc: 'For large scale logistics & warehouses',
    features: [
      'Unlimited Optimizations',
      'Dedicated Fallback AI',
      'Multi-warehouse Sync',
      'White-label Reports',
      '24/7 Account Manager',
      'Unlimited Users'
    ]
  }
]

// --- COMPONENTS ---

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'Paid': 'bg-green-500/10 text-green-400',
    'Failed': 'bg-red-500/10 text-red-400',
    'Pending': 'bg-amber-500/10 text-amber-400'
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${colors[status]}`}>
      {status}
    </span>
  )
}

// --- MAIN PAGE ---

export default function SubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [usage, setUsage] = useState(0)

  useEffect(() => {
    // Animate usage bar on load
    const timer = setTimeout(() => setUsage(82), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="max-w-[1200px] mx-auto space-y-10 pb-24 px-4 md:px-0">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Subscriptions</h1>
        <p className="text-gray-400 text-sm">Manage your plan, billing, and usage.</p>
      </div>

      {/* Current Plan Hero Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0f0f1a] border border-white/[0.06] border-l-[#4361EE] border-l-4 rounded-[32px] p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Background Sparkle */}
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Zap className="w-48 h-48 text-[#4361EE]" />
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <span className="bg-[#4361EE]/20 text-[#4361EE] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-[#4361EE]/30 shadow-[0_0_15px_rgba(67,97,238,0.2)]">
                Growth Plan
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Active</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-8">
               <div>
                 <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Renewal Date</p>
                 <p className="text-sm font-bold text-white">November 01, 2026</p>
               </div>
               <div>
                 <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Billing Cycle</p>
                 <p className="text-sm font-bold text-white">Monthly</p>
               </div>
               <div>
                 <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Seats Used</p>
                 <p className="text-sm font-bold text-white">3 of 5</p>
               </div>
            </div>
          </div>

          <div className="w-full lg:w-1/3 space-y-3">
             <div className="flex justify-between items-end">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Monthly Shipment Usage</p>
                <p className="text-xs font-black text-white">410 / 500</p>
             </div>
             <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${usage}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-[#4361EE] to-[#4895EF] rounded-full shadow-[0_0_10px_rgba(67,97,238,0.5)]"
                />
             </div>
             <p className="text-[10px] text-gray-600 italic">82% of your monthly quota used. Resets in 9 days.</p>
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
             <button className="flex-1 lg:flex-none bg-[#4361EE] hover:bg-[#344FDA] text-white px-8 py-3 rounded-xl font-bold text-sm shadow-xl shadow-[#4361EE]/20 transition-all">
               Upgrade Plan
             </button>
             <button className="flex-1 lg:flex-none bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 px-6 py-3 rounded-xl font-bold text-sm border border-white/5 transition-all">
               Cancel Plan
             </button>
          </div>
        </div>
      </motion.div>

      {/* Plan Comparison Grid */}
      <div className="space-y-8">
        <div className="flex flex-col items-center gap-6">
           <h2 className="text-xl font-bold text-white">Change your plan</h2>
           <div className="flex items-center bg-[#0f0f1a] p-1 rounded-xl border border-white/[0.06] relative">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all relative z-10 ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all relative z-10 ${billingCycle === 'annual' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Annual <span className="ml-1 text-[9px] text-[#00E5CC]">Save 20%</span>
              </button>
              <motion.div 
                animate={{ x: billingCycle === 'monthly' ? 0 : '100%' }}
                className="absolute top-1 bottom-1 left-1 w-1/2 bg-white/10 rounded-lg pointer-events-none"
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              />
           </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
           {PLANS.map((plan, i) => (
             <motion.div 
               key={plan.id}
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.1 }}
               className={`bg-[#0f0f1a] border rounded-[40px] p-10 flex flex-col relative transition-all ${plan.current ? 'border-[#4361EE] shadow-2xl shadow-[#4361EE]/10' : 'border-white/[0.06] hover:border-white/10'}`}
             >
                {plan.current && (
                  <div className="absolute top-0 right-10 -translate-y-1/2 bg-[#4361EE] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                    Current Plan
                  </div>
                )}
                {plan.popular && !plan.current && (
                   <div className="absolute top-0 right-10 -translate-y-1/2 bg-white/10 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                    Recommended
                  </div>
                )}

                <div className="mb-8">
                   <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                   <p className="text-xs text-gray-500">{plan.desc}</p>
                </div>

                <div className="mb-10">
                   <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-white">
                        {typeof plan.monthlyPrice === 'number' 
                          ? (billingCycle === 'monthly' ? `$${plan.monthlyPrice}` : `$${plan.annualPrice}`)
                          : plan.monthlyPrice}
                      </span>
                      {typeof plan.monthlyPrice === 'number' && (
                        <span className="text-gray-500 text-sm font-bold">/ month</span>
                      )}
                   </div>
                   {billingCycle === 'annual' && typeof plan.monthlyPrice === 'number' && (
                      <p className="text-[10px] text-green-400 font-bold mt-2">Billed annually (${(plan.annualPrice as any) * 12}/yr)</p>
                   )}
                </div>

                <ul className="space-y-4 mb-12 flex-1">
                   {plan.features.map((f, j) => (
                     <li key={j} className="flex gap-3 items-start">
                        <Check className="w-4 h-4 text-[#4361EE] shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-400 font-medium">{f}</span>
                     </li>
                   ))}
                </ul>

                <button 
                  disabled={plan.current}
                  className={`w-full py-4 rounded-2xl font-bold text-sm transition-all ${
                    plan.current 
                    ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed' 
                    : plan.popular 
                      ? 'bg-[#4361EE] hover:bg-[#344FDA] text-white shadow-xl shadow-[#4361EE]/20' 
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/5'
                  }`}
                >
                  {plan.current ? 'Your Active Plan' : plan.id === 'enterprise' ? 'Contact Sales' : 'Switch to Plan'}
                </button>
             </motion.div>
           ))}
        </div>
      </div>

      {/* Payment & History */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Payment Method */}
        <div className="lg:col-span-4 space-y-6">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
             <CreditCard className="w-5 h-5 text-gray-500" /> Payment Method
           </h2>
           <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-[32px] p-8 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-white italic font-serif text-xl border border-white/10">
                      VISA
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">•••• 4242</p>
                      <p className="text-xs text-gray-500">Expires 12/28</p>
                    </div>
                 </div>
                 <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                 </div>
              </div>
              <div className="space-y-3">
                 <button className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold border border-white/5 transition-all">
                   Update Payment Method
                 </button>
                 <button className="w-full py-3 text-gray-500 hover:text-white rounded-xl text-xs font-bold transition-all">
                   Remove Card
                 </button>
              </div>
           </div>

           <div className="bg-gradient-to-br from-[#4361EE]/10 to-transparent border border-[#4361EE]/20 rounded-[32px] p-6">
              <div className="flex gap-4 items-start">
                 <HelpCircle className="w-5 h-5 text-[#4361EE] shrink-0 mt-0.5" />
                 <div>
                    <h4 className="text-sm font-bold text-white mb-1">Billing Questions?</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">Our support team is here to help with any billing or invoice inquiries.</p>
                    <button className="mt-4 text-[#4361EE] text-xs font-bold hover:underline">Contact Support</button>
                 </div>
              </div>
           </div>
        </div>

        {/* Billing History */}
        <div className="lg:col-span-8 space-y-6">
           <div className="flex justify-between items-center">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <Clock className="w-5 h-5 text-gray-500" /> Billing History
             </h2>
             <button className="text-xs font-bold text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
               See All <ChevronRight className="w-4 h-4" />
             </button>
           </div>

           <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-[32px] overflow-hidden shadow-xl">
              <table className="w-full text-left text-sm">
                 <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5">
                       <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-gray-500">Invoice Date</th>
                       <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-gray-500">Plan</th>
                       <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-gray-500">Amount</th>
                       <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-gray-500">Status</th>
                       <th className="px-6 py-4 text-right font-black uppercase tracking-widest text-[10px] text-gray-500">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {BILLING_HISTORY.map((inv) => (
                      <tr key={inv.id} className="hover:bg-white/[0.01] transition-colors">
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                               <Calendar className="w-3.5 h-3.5 text-gray-600" />
                               <span className="font-bold text-gray-300">{inv.date}</span>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-gray-400">{inv.plan}</td>
                         <td className="px-6 py-4 font-black text-white">{inv.amount}</td>
                         <td className="px-6 py-4">
                            <StatusBadge status={inv.status} />
                         </td>
                         <td className="px-6 py-4 text-right">
                            <button className="p-2 bg-white/5 hover:bg-[#4361EE]/20 rounded-lg text-gray-500 hover:text-[#4361EE] transition-all">
                               <Download className="w-4 h-4" />
                            </button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
              <div className="p-4 bg-white/[0.01] border-t border-white/5 flex justify-center">
                 <button className="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors">Load More Invoices</button>
              </div>
           </div>
        </div>

      </div>

    </div>
  )
}
