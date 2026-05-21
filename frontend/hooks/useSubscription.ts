import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface SubscriptionState {
  plan: string
  usedThisMonth: number
  monthlyLimit: number
  usagePercentage: number
  isLimitReached: boolean
  isNearLimit: boolean
  billingPeriodEnd: string
  loading: boolean
}

export function useSubscription(): SubscriptionState {
  const supabase = createClient()
  const [state, setState] = useState<SubscriptionState>({
    plan: 'starter', usedThisMonth: 0, monthlyLimit: 500,
    usagePercentage: 0, isLimitReached: false, isNearLimit: false,
    billingPeriodEnd: '', loading: true,
  })

  useEffect(() => {
    let mounted = true
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setState(s => ({ ...s, loading: false }))

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!mounted) return
      if (!sub) return setState(s => ({ ...s, loading: false }))

      const monthly_limit = sub.monthly_limit ?? 500
      const used = sub.used_this_month ?? 0
      const pct = monthly_limit === -1 ? 0 : (used / Math.max(1, monthly_limit)) * 100

      setState({
        plan: sub.plan || 'starter',
        usedThisMonth: used,
        monthlyLimit: monthly_limit,
        usagePercentage: Math.min(100, Math.round(pct)),
        isLimitReached: monthly_limit !== -1 && used >= monthly_limit,
        isNearLimit: pct >= 80 && pct < 100,
        billingPeriodEnd: sub.billing_period_end || '',
        loading: false,
      })
    }
    load()
    return () => { mounted = false }
  }, [])

  return state
}
