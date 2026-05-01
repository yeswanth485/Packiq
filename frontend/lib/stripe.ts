import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
})

export const PLANS = {
  pro: {
    name: 'Pro',
    price_id: 'price_pro_monthly',   // replace with real Stripe price ID
    optimizations: 500,
  },
  enterprise: {
    name: 'Enterprise',
    price_id: 'price_enterprise_monthly',
    optimizations: -1, // unlimited
  },
} as const

export type PlanKey = keyof typeof PLANS
