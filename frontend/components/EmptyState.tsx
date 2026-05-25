import React from 'react'

export default function EmptyState({ title, description, action }: { title?: string; description?: string; action?: React.ReactNode }) {
  return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
      <div style={{ fontSize: 42, marginBottom: 8 }}>🗂️</div>
      <h3 style={{ fontSize: 18, marginBottom: 6 }}>{title || 'No items to show'}</h3>
      <div style={{ maxWidth: 560, margin: '6px auto 12px' }}>{description || 'There is nothing here yet. Try running an optimization or adjust your filters.'}</div>
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  )
}
