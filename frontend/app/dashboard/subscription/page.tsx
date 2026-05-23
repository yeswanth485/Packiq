'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Shield, Zap, Info, CreditCard, Sparkles, AlertTriangle, ArrowRight, LayoutDashboard } from 'lucide-react'
import { useDashboardData } from '@/lib/hooks/useDashboardData'
import * as Tabs from '@radix-ui/react-tabs'

const PLANS = [
  {
    id: 'normal',
    name: 'Normal',
    price: '$0',
    period: '/month',
    tokens: 1000,
    features: [
      '1,000 AI Tokens/month',
      'Basic Box Optimization',
      'Standard Catalog',
      'Email Support',
      'Community Access'
    ],
    color: '#185FA5'
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: '/month',
    tokens: 10000,
    features: [
      '10,000 AI Tokens/month',
      'Advanced Claude AI Engine',
      'Custom Box Dimensions',
      'Priority Support',
      'API Access',
      'Analytics Dashboard'
    ],
    color: '#00FFD1',
    popular: true
  },
  {
    id: 'max',
    name: 'Max',
    price: '$99',
    period: '/month',
    tokens: 1000000,
    features: [
      '1,000,000 AI Tokens/month',
      'Dedicated Claude Instance',
      'Unlimited Warehouses',
      'White-label Reports',
      '24/7 Account Manager',
      'Custom Integrations',
      'SLA Guarantee'
    ],
    color: '#A855F7'
  }
]

import { useSubscriptionStore } from '@/lib/store/subscriptionStore'
import { toast } from 'sonner'

export default function SubscriptionPage() {
  const { profileData, isLoading } = useDashboardData()
  const { plan: storePlan, used: tokensUsed, limit: tokensLimit, fetchBalance } = useSubscriptionStore()
  const [activePlan, setActivePlan] = useState('normal')
  const [isSwitching, setIsSwitching] = useState(false)
  const [activeTab, setActiveTab] = useState('plans')

  const supabase = createClient()

  useEffect(() => {
    if (storePlan) {
      setActivePlan(storePlan.toLowerCase())
    }
  }, [storePlan])

  const handleSwitchPlan = async (planId: string) => {
    if (planId === activePlan) return

    const confirmUpgrade = window.confirm(`Confirm upgrade to ${planId.toUpperCase()} plan? Your token limit will be updated immediately.`)
    if (!confirmUpgrade) return

    setIsSwitching(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      // Update plan in profiles table
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ plan: planId })
        .eq('id', (await supabase.auth.getUser()).data.user?.id)

      if (error) throw error

      // Update tokens in subscriptions table (reset/upgrade)
      const newLimit = planId === 'pro' ? 10000 : planId === 'max' ? 1000000 : 1000
      await (supabase as any)
        .from('subscriptions')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          plan: planId,
          monthly_limit: newLimit,
          used_this_month: 0
        })

      toast.success(`Successfully upgraded to ${planId} plan!`)
      if (session) await fetchBalance(session.access_token)
      setActivePlan(planId)
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setIsSwitching(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#00FFD1] border-t-transparent animate-spin" />
      </div>
    )
  }

  const tokenResetDate = profileData?.tokenResetDate 
    ? new Date(profileData.tokenResetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  const usagePercent = Math.min(100, Math.round((tokensUsed / tokensLimit) * 100))
  const isNearLimit = usagePercent > 80
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (usagePercent / 100) * circumference

  return (
    <div className="max-w-[1200px] mx-auto space-y-12 pb-24 font-inter">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-bold font-syne text-white mb-2 tracking-tight">Subscription & Tokens</h1>
          <p className="text-gray-400">Manage your Shipzi plan, tokens, and billing.</p>
        </div>
      </div>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="w-full">
        <Tabs.List className="flex gap-4 border-b border-white/10 mb-8 pb-4 overflow-x-auto">
          <Tabs.Trigger 
            value="plans"
            className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'plans' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Upgrade Plan
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="usage"
            className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${activeTab === 'usage' ? 'bg-white text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            Token Usage
          </Tabs.Trigger>
        </Tabs.List>

        <AnimatePresence mode="wait">
          {activeTab === 'plans' && (
            <Tabs.Content value="plans" asChild forceMount>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid md:grid-cols-3 gap-6">
                  {PLANS.map((plan) => {
                    const isActive = activePlan === plan.id
                    return (
                      <motion.div
                        key={plan.id}
                        whileHover={!isActive ? { y: -5, borderColor: plan.color + '40' } : {}}
                        className={`relative flex flex-col p-8 rounded-[32px] border transition-all duration-300 ${
                          isActive 
                            ? 'bg-white/[0.03] border-white/20 shadow-2xl' 
                            : 'bg-[#0A0A0F] border-white/[0.05] hover:bg-white/[0.02]'
                        }`}
                      >
                        {isActive && (
                          <motion.div 
                            layoutId="activePlanHighlight"
                            className="absolute inset-0 border-2 rounded-[32px] pointer-events-none"
                            style={{ borderColor: plan.color, boxShadow: `0 0 30px ${plan.color}20` }}
                          />
                        )}

                        {plan.popular && !isActive && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white/10 border border-white/20 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                            Recommended
                          </div>
                        )}
                        {isActive && (
                          <div 
                            className="absolute -top-3 left-1/2 -translate-x-1/2 text-[#0A0A0F] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg"
                            style={{ backgroundColor: plan.color }}
                          >
                            Current Plan
                          </div>
                        )}

                        <div className="mb-8 mt-4">
                          <h3 className="text-2xl font-bold font-syne text-white mb-2">{plan.name}</h3>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold font-syne" style={{ color: isActive ? plan.color : 'white' }}>{plan.price}</span>
                            <span className="text-sm text-gray-500 font-medium">{plan.period}</span>
                          </div>
                        </div>

                        <div className="h-px w-full bg-white/5 mb-8" />

                        <ul className="space-y-5 flex-1 mb-10">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-3">
                              <div className="mt-1 w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: plan.color + '20' }}>
                                <Check className="w-2.5 h-2.5" style={{ color: plan.color }} />
                              </div>
                              <span className={`text-sm ${i === 0 ? 'text-white font-bold' : 'text-gray-400'}`}>
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <button
                          onClick={() => handleSwitchPlan(plan.id)}
                          disabled={isActive || isSwitching}
                          className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                            isActive
                              ? 'bg-white/5 text-gray-500 cursor-default'
                              : 'bg-white/10 hover:bg-white/20 text-white border border-white/5 hover:border-white/20'
                          }`}
                        >
                          {isSwitching && !isActive ? 'Updating...' : isActive ? 'Active' : 'Select Plan'}
                          {!isActive && !isSwitching && <ArrowRight className="w-4 h-4" />}
                        </button>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            </Tabs.Content>
          )}

          {activeTab === 'usage' && (
            <Tabs.Content value="usage" asChild forceMount>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-[#0A0A0F] border border-white/10 rounded-[32px] p-8 shadow-2xl relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00FFD1]/5 to-transparent pointer-events-none rounded-[32px]" />
                  
                  <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                    <div>
                      <h3 className="text-xl font-bold font-syne text-white mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-[#00FFD1]" /> Token Usage Details
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed mb-6">
                        Each optimization request consumes tokens. Your limit resets monthly on your billing date. Note: Tokens are fully refreshed when upgrading or downgrading plans!
                      </p>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                          <span className="text-xs text-gray-400 font-medium">Current Cycle Reset Date</span>
                          <span className="text-sm font-bold text-white">{tokenResetDate}</span>
                        </div>
                        {isNearLimit && (
                          <div className="flex gap-3 items-start p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-bold text-red-400">Approaching Limit</p>
                              <p className="text-xs text-red-400/80 mt-1">Upgrade your plan to ensure uninterrupted optimization access.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white/[0.02] p-8 rounded-3xl border border-white/5">
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Usage Tracker</div>
                          <div className="text-3xl font-bold font-syne text-white">{usagePercent}%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400 mb-1">Tokens Used</div>
                          <div className="text-lg font-bold text-white">{tokensUsed.toLocaleString()} <span className="text-sm text-gray-500 font-normal">/ {tokensLimit.toLocaleString()}</span></div>
                        </div>
                      </div>
                      
                      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${usagePercent}%` }}
                          transition={{ duration: 1.5, ease: 'easeOut' }}
                          className={`h-full rounded-full ${isNearLimit ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-[#00FFD1] shadow-[0_0_15px_rgba(0,255,209,0.5)]'}`}
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-4">
                        Remaining tokens: <span className="font-bold text-[#00FFD1]">{(tokensLimit - tokensUsed).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </Tabs.Content>
          )}
        </AnimatePresence>
      </Tabs.Root>

      {/* Payment Information Area (Static representation) */}
      <div className="mt-16 bg-white/[0.01] border border-white/5 rounded-[32px] p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Payment Method</h3>
            <p className="text-sm text-gray-500">Visa ending in •••• 4242</p>
          </div>
        </div>
        <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all text-white">
          Update Billing details
        </button>
      </div>

    </div>
  )
}
