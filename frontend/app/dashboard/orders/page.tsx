 'use client';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import EmptyState from '@/components/EmptyState'

export default function OrdersPage() {
  const supabase = createClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Load user orders from orders table
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*, product_snapshot, box_snapshot, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        setOrders([]);
      } else {
        // normalize to expected shape for UI
        const normalized = (ordersData || []).map((o: any) => ({
          ...o,
          product_name: (o.product_snapshot && o.product_snapshot.name) || o.product_name || o.product_snapshot?.product_name,
          sku: (o.product_snapshot && (o.product_snapshot.sku || o.product_snapshot.SKU)) || o.sku,
          new_box_name: (o.box_snapshot && (o.box_snapshot.name || o.box_snapshot.box_name)) || o.new_box_name,
          new_box_dims: o.box_snapshot ? `${o.box_snapshot.length_cm}×${o.box_snapshot.width_cm}×${o.box_snapshot.height_cm}cm` : o.new_box_dims,
          new_box_cost: o.box_snapshot?.cost || o.new_box_cost || o.total_cost,
        }))

        setOrders(normalized);
      }
      setLoading(false);
    }
    load();
  }, []);

  const allOrders = useMemo(() => orders, [orders]);
  const successOrders = useMemo(() => orders.filter(o => o.is_optimized), [orders]);
  const failedOrders = useMemo(() => orders.filter(o => !o.is_optimized), [orders]);
  
  const totalSaved = useMemo(() => 
    successOrders.reduce((s, o) => s + (o.savings_amount || 0), 0), 
  [successOrders]);
  
  const highRiskCount = useMemo(() => 
    orders.filter(o => o.fragility_level === 'High').length,
  [orders]);

  const filtered = useMemo(() =>
    successOrders
      .filter(o => !search || o.product_name?.toLowerCase().includes(search.toLowerCase()) || o.sku?.toLowerCase().includes(search.toLowerCase()))
      .filter(o => riskFilter === 'all' || o.fragility_level === riskFilter),
  [successOrders, search, riskFilter]);

  if (loading) return <div style={{padding:40,textAlign:'center'}}>Loading orders...</div>;

  return (
    <div style={{ padding: '0 32px 32px', maxWidth: '100%', overflowX: 'hidden' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', 
                    marginBottom: 24, paddingTop: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Shipment Manifests</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
            Manage order logistics, view packing guides, and print labels.
          </p>
        </div>
        <button style={{ 
          padding: '10px 20px', background: '#14b8a6', border: 'none', borderRadius: 8,
          color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          + NEW ORDER
        </button>
      </div>

      {/* KPI Cards — all 4 populated */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <KPICard dot="green" label="PROCESSED" value={allOrders.length} />
        <KPICard dot="green" label="OPTIMIZED" value={successOrders.length} />
        <KPICard dot="orange" label="TOTAL SAVED" value={'₹' + totalSaved.toFixed(2)} />
        <KPICard dot="red" label="HIGH RISK" value={highRiskCount} valueColor="#ef4444" />
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input
          placeholder="Search by SKU or Product Name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-elevated)',
                   border: '1px solid var(--border-default)', borderRadius: 8,
                   color: 'var(--text-primary)', fontSize: 13 }}
        />
        <select
          value={riskFilter}
          onChange={e => setRiskFilter(e.target.value)}
          style={{ padding: '10px 14px', background: 'var(--bg-elevated)',
                   border: '1px solid var(--border-default)', borderRadius: 8,
                   color: 'var(--text-primary)', fontSize: 13 }}
        >
          <option value="all">All Risk Levels</option>
          <option value="High">High Risk</option>
          <option value="Medium">Medium Risk</option>
          <option value="Low">Low Risk</option>
        </select>
      </div>

      {/* Orders Table */}
      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
        <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['PRODUCT','BASELINE BOX','OPTIMIZED BOX','TOTAL COST','SAVINGS','RISK LEVEL','ACTIONS'].map(col => (
                <th key={col} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, 
                                       fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px 0' }}>
                  <EmptyState title={orders.length === 0 ? 'No optimizations yet' : 'No matching orders'} description={orders.length === 0 ? 'Run an optimization to populate shipments' : 'Try a different search or clear filters.'} />
                </td>
              </tr>
            ) : filtered.map(order => (
              <tr key={order.id} 
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', 
                           cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {/* PRODUCT */}
                <td style={{ padding: '14px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{order.product_name || order.sku}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{order.sku}</div>
                </td>
                {/* BASELINE BOX */}
                <td style={{ padding: '14px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
                  {order.old_box_dims || order.length_cm + 'x' + order.width_cm + 'x' + order.height_cm}
                </td>
                {/* OPTIMIZED BOX */}
                <td style={{ padding: '14px 14px' }}>
                  <div style={{ 
                    display: 'inline-block', padding: '3px 9px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                    background: 'rgba(20,184,166,0.12)', color: '#14b8a6', letterSpacing: '0.03em'
                  }}>
                    {order.new_box_name || 'N/A'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 3 }}>{order.new_box_dims}</div>
                </td>
                {/* TOTAL COST */}
                <td style={{ padding: '14px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', textDecoration: 'line-through' }}>
                    ₹{order.old_box_cost?.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                    ₹{order.new_box_cost?.toFixed(2)}
                  </div>
                </td>
                {/* SAVINGS */}
                <td style={{ padding: '14px 14px' }}>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                    borderRadius: 20, fontSize: 12, fontWeight: 700,
                    background: 'rgba(34,197,94,0.1)', color: '#22c55e'
                  }}>
                    ↘ {order.savings_pct?.toFixed(1)}%
                  </span>
                </td>
                {/* RISK LEVEL */}
                <td style={{ padding: '14px 14px' }}>
                  <span style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600,
                    color: order.fragility_level === 'High' ? '#ef4444' : order.fragility_level === 'Medium' ? '#f59e0b' : '#22c55e'
                  }}>
                    {order.fragility_level === 'High' ? '🔴' : order.fragility_level === 'Medium' ? '⚠️' : '✅'} {order.fragility_level}
                  </span>
                </td>
                {/* ACTIONS */}
                <td style={{ padding: '14px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <ActionBtn label="Pack" onClick={() => setSelectedOrder(order)} />
                    <ActionBtn label="Label" onClick={() => {
                      const resultId = order.optimization_result_id || order.optimization_id || order.id
                      window.location.href = `/dashboard/labels?result_id=${resultId}`
                    }} />
                    <ActionBtn label="···" onClick={() => setSelectedOrder(order)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Not Optimized Banner */}
      {failedOrders.length > 0 && (
        <div style={{ 
          marginTop: 20, padding: '14px 20px', 
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', 
          borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <span style={{ color: '#ef4444', fontWeight: 700 }}>
              ⚠ {failedOrders.length} items could not be optimized
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13, marginLeft: 8 }}>
              — see Results History for failure reasons and fix recommendations
            </span>
          </div>
          <a href="/dashboard/results" style={{ 
            padding: '7px 16px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 6, color: '#ef4444', fontSize: 12, fontWeight: 700, textDecoration: 'none'
          }}>
            View Details →
          </a>
        </div>
      )}
    </div>
  );
}

function KPICard({ dot, label, value, valueColor }: any) {
  return (
    <div style={{ padding: '16px 20px', background: 'var(--bg-elevated)', borderRadius: 10, 
                  border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', 
                      background: dot === 'green' ? '#22c55e' : dot === 'orange' ? '#f59e0b' : '#ef4444' }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: valueColor || 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function ActionBtn({ label, onClick }: any) {
  return (
    <button onClick={onClick} style={{ 
      padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6, cursor: 'pointer',
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
      color: 'var(--text-secondary)', transition: 'all 0.15s'
    }}>
      {label}
    </button>
  );
}
