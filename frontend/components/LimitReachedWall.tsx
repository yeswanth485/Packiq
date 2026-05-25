import React from 'react'
import { useSubscription } from '@/hooks/useSubscription'

export function LimitGuard({ children }: { children: React.ReactNode }) {
  const sub = useSubscription()
  if (sub.loading) return <>{children}</>

  const NearLimitBanner = sub.isNearLimit && !sub.isLimitReached ? (
    <div style={{ marginBottom: 16, padding: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <strong style={{ color: '#f59e0b' }}>⚠ You've used {sub.usagePercentage}% of your monthly limit</strong>
        <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{sub.usedThisMonth} / {sub.monthlyLimit} items · resets {new Date(sub.billingPeriodEnd).toLocaleDateString()}</div>
      </div>
      <a href="/dashboard/settings?tab=billing" style={{ padding: '7px 12px', background: '#f59e0b', borderRadius: 6, color: '#000', fontWeight: 700, textDecoration: 'none' }}>Upgrade Plan →</a>
    </div>
  ) : null

  if (sub.isLimitReached) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 60 }}>🚫</div>
        <h2 style={{ fontSize: 28, fontWeight: 800 }}>Monthly Limit Reached</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16 }}>You've used all <strong style={{ color: 'var(--text-primary)' }}>{sub.monthlyLimit}</strong> optimizations included in your <strong style={{ color: '#14b8a6' }}>{sub.plan}</strong> plan this month.</p>
        <div style={{ width: 400, margin: '24px auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><span>{sub.usedThisMonth} used</span><span>{sub.monthlyLimit} limit</span></div>
          <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)' }}>
            <div style={{ height: '100%', borderRadius: 4, background: '#ef4444', width: '100%' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <a href="/dashboard/settings?tab=billing" style={{ padding: '10px 18px', background: '#14b8a6', color: '#fff', borderRadius: 8, fontWeight: 700, textDecoration: 'none' }}>Upgrade Plan</a>
        </div>
      </div>
    )
  }

  return <>{NearLimitBanner}{children}</>
}
