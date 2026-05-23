import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SubscriptionState {
  plan: string
  used: number
  limit: number
  remaining: number
  percentage: number
  loading: boolean

  fetchBalance: (token: string) => Promise<void>
  deductTokens: (token: string, amount: number, action: string) => Promise<boolean>
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      plan: 'starter',
      used: 0,
      limit: 1000,
      remaining: 1000,
      percentage: 0,
      loading: false,

      fetchBalance: async (token) => {
        set({ loading: true })
        try {
          const res = await fetch('/api/tokens/balance', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          const data = await res.json()
          if (!data.error) {
            set({
              plan: data.plan,
              used: data.used,
              limit: data.limit,
              remaining: data.remaining,
              percentage: data.percentage,
              loading: false
            })
          }
        } catch (err) {
          set({ loading: false })
        }
      },

      deductTokens: async (token, amount, action) => {
        try {
          const res = await fetch('/api/tokens/deduct', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount, action })
          })
          const data = await res.json()
          if (data.success) {
            set({
              used: data.used,
              remaining: data.remaining,
              percentage: Math.min(100, Math.round((data.used / data.limit) * 100))
            })
            return true
          }
          return false
        } catch (err) {
          return false
        }
      }
    }),
    {
      name: 'subscription-storage'
    }
  )
)
