'use client';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ResultsHistoryPage() {
  const supabase = createClient();
  const [results, setResults] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('latest');
  const [activeTab, setActiveTab] = useState<'success' | 'failed'>('success');
  const [search, setSearch] = useState('');
  const [savingsFilter, setSavingsFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: sessionList } = await supabase
      .from('optimization_sessions')
      .select('id, file_name, created_at, total_items, optimized_items, optimization_rate')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (sessionList) setSessions(sessionList);

    const latestSessionId = (sessionList as any[])?.[0]?.id;
    if (!latestSessionId) { setLoading(false); return; }

    await loadSessionResults(latestSessionId, user.id);
  }

  async function loadSessionResults(sessionId: string, userId: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from('optimization_results')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .order('is_optimized', { ascending: false })
      .order('savings_pct', { ascending: false });
    
    if (error) {
      console.error('Results load error:', error);
      setLoading(false);
      return;
    }
    
    setResults(data || []);
    setLoading(false);
  }

  const successItems = useMemo(() => 
    results.filter(r => r.is_optimized === true)
           .filter(r => !search || r.product_name?.toLowerCase().includes(search.toLowerCase()) || r.sku?.toLowerCase().includes(search.toLowerCase()))
           .filter(r => {
             if (savingsFilter === 'all') return true;
             if (savingsFilter === 'high') return (r.savings_pct || 0) >= 40;
             if (savingsFilter === 'medium') return (r.savings_pct || 0) >= 15 && (r.savings_pct || 0) < 40;
             if (savingsFilter === 'low') return (r.savings_pct || 0) < 15;
             return true;
           }),
  [results, search, savingsFilter]);

  const failedItems = useMemo(() =>
    results.filter(r => r.is_optimized === false)
           .filter(r => !search || r.product_name?.toLowerCase().includes(search.toLowerCase()) || r.sku?.toLowerCase().includes(search.toLowerCase())),
  [results, search]);

  const totalSavings = successItems.reduce((s, r) => s + (r.savings_amount || 0), 0);

  if (loading) return <div style={{padding:40,textAlign:'center'}}>Loading results...</div>;

  return (
    <div style={{ padding: '24px 32px', maxWidth: '100%' }}>
      <h1>Optimization Results</h1>
      <p>Review your AI-powered packaging recommendations and savings.</p>

      {sessions.length > 1 && (
        <select 
          value={selectedSession}
          onChange={async (e) => {
            setSelectedSession(e.target.value);
            const { data: { user } } = await supabase.auth.getUser();
            if (user) await loadSessionResults(e.target.value, user.id);
          }}
          style={{ marginBottom: 16, padding: '8px 12px', background: 'var(--bg-elevated)', 
                   border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)' }}
        >
          {sessions.map((s, i) => (
            <option key={s.id} value={s.id}>
              {i === 0 ? '(Latest) ' : ''}{s.file_name} — {new Date(s.created_at).toLocaleDateString()} 
              ({s.optimized_items}/{s.total_items} optimized)
            </option>
          ))}
        </select>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatChip label="Total Processed" value={results.length} />
        <StatChip label="Optimized" value={successItems.length} color="green" />
        <StatChip label="Not Optimized" value={failedItems.length} color="red" />
        <StatChip label="Optimization Rate" value={(results.length > 0 ? (successItems.length / results.length * 100) : 0).toFixed(1) + '%'} color="blue" />
        <StatChip label="Total Savings" value={'₹' + totalSavings.toFixed(2)} color="teal" />
      </div>

      <div style={{ display: 'flex', gap: 0, marginBottom: 20 }}>
        <button 
          onClick={() => setActiveTab('success')}
          style={{ 
            padding: '10px 20px', borderRadius: '8px 0 0 8px',
            background: activeTab === 'success' ? 'var(--accent-primary)' : 'var(--bg-elevated)',
            border: '1px solid var(--border-default)', cursor: 'pointer',
            color: activeTab === 'success' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600, fontSize: 13,
          }}
        >
          SUCCESSFUL OPTIMIZATIONS ({successItems.length})
        </button>
        <button 
          onClick={() => setActiveTab('failed')}
          style={{ 
            padding: '10px 20px', borderRadius: '0 8px 8px 0',
            background: activeTab === 'failed' ? '#ef4444' : 'var(--bg-elevated)',
            border: '1px solid var(--border-default)', borderLeft: 'none', cursor: 'pointer',
            color: activeTab === 'failed' ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600, fontSize: 13,
          }}
        >
          WHY NOT OPTIMIZED ⚠ ({failedItems.length})
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input 
          placeholder="Filter by product name..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, padding: '9px 14px', background: 'var(--bg-elevated)',
                   border: '1px solid var(--border-default)', borderRadius: 8, 
                   color: 'var(--text-primary)', fontSize: 13 }}
        />
        {activeTab === 'success' && (
          <select 
            value={savingsFilter} 
            onChange={e => setSavingsFilter(e.target.value)}
            style={{ padding: '9px 14px', background: 'var(--bg-elevated)',
                     border: '1px solid var(--border-default)', borderRadius: 8,
                     color: 'var(--text-primary)', fontSize: 13 }}
          >
            <option value="all">All Savings</option>
            <option value="high">High (≥40%)</option>
            <option value="medium">Medium (15-40%)</option>
            <option value="low">Low (&lt;15%)</option>
          </select>
        )}
        <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
          Showing {activeTab === 'success' ? successItems.length : failedItems.length} results
        </span>
      </div>

      {activeTab === 'success' && (
        <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
          <table style={{ width: '100%', minWidth: 1100, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                {['PRODUCT','OLD BOX','NEW BOX','DIMENSIONS','FRAGILITY','VOID %','SCORE','OLD COST','NEW COST','SAVINGS'].map(col => (
                  <th key={col} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, 
                                         fontWeight: 600, color: 'var(--text-secondary)', 
                                         letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {successItems.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No optimizations found matching your filters.
                  </td>
                </tr>
              ) : successItems.map(r => (
                <ResultRow key={r.id} result={r} type="success" />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'failed' && (
        <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
          <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                {['PRODUCT','DIMENSIONS','WEIGHT','FAILURE REASON','FRAGILITY','FIX ACTION'].map(col => (
                  <th key={col} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, 
                                         fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {failedItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {results.length === 0 ? 'Run an optimization first.' : 'All products were successfully optimized! 🎉'}
                  </td>
                </tr>
              ) : failedItems.map(r => (
                <FailedRow key={r.id} result={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value, color }: any) {
  return (
    <div style={{ padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color === 'green' ? '#22c55e' : color === 'red' ? '#ef4444' : color === 'teal' ? '#14b8a6' : color === 'blue' ? '#3b82f6' : 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

function ResultRow({ result: r, type }: { result: any; type: string }) {
  const [expanded, setExpanded] = useState(false);
  const fragColor = r.fragility_level === 'High' ? '#ef4444' : r.fragility_level === 'Medium' ? '#f59e0b' : '#22c55e';
  const savingsColor = (r.savings_pct || 0) >= 30 ? '#22c55e' : (r.savings_pct || 0) >= 10 ? '#f59e0b' : 'var(--text-secondary)';
  
  return (
    <>
      <tr 
        onClick={() => setExpanded(!expanded)}
        style={{ 
          borderBottom: '1px solid rgba(255,255,255,0.04)', 
          cursor: 'pointer',
          background: expanded ? 'rgba(255,255,255,0.03)' : 'transparent',
          transition: 'background 0.15s',
        }}
      >
        <td style={{ padding: '13px 14px' }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
            {r.product_name || r.sku}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.sku}</div>
        </td>
        <td style={{ padding: '13px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
          <div>{r.old_box_name || '—'}</div>
          <div style={{ fontSize: 10 }}>{r.old_box_dims || ''}</div>
        </td>
        <td style={{ padding: '13px 14px' }}>
          <div style={{ 
            display: 'inline-block', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
            background: 'rgba(20,184,166,0.12)', color: '#14b8a6', letterSpacing: '0.03em'
          }}>
            {r.new_box_name || '—'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{r.new_box_dims}</div>
        </td>
        <td style={{ padding: '13px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
          {r.length_cm}×{r.width_cm}×{r.height_cm}cm
        </td>
        <td style={{ padding: '13px 14px' }}>
          <span style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', 
            borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: fragColor + '18', color: fragColor, border: '1px solid ' + fragColor + '40'
          }}>
            {r.fragility_level === 'High' ? '🔴' : r.fragility_level === 'Medium' ? '🟡' : '🟢'} {r.fragility_level}
          </span>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>Score: {r.fragility_score}/100</div>
        </td>
        <td style={{ padding: '13px 14px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: (r.void_percentage || 0) < 30 ? '#22c55e' : (r.void_percentage || 0) < 55 ? '#f59e0b' : '#ef4444' }}>
            {r.void_percentage?.toFixed(1) || '—'}%
          </div>
        </td>
        <td style={{ padding: '13px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
          {r.ml_score?.toFixed(3) || '—'}
        </td>
        <td style={{ padding: '13px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
          <span style={{ textDecoration: 'line-through' }}>₹{r.old_box_cost?.toFixed(2) || '—'}</span>
        </td>
        <td style={{ padding: '13px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          ₹{r.new_box_cost?.toFixed(2) || '—'}
        </td>
        <td style={{ padding: '13px 14px' }}>
          <span style={{ color: savingsColor, fontWeight: 700, fontSize: 13 }}>
            ↓ {r.savings_pct?.toFixed(1) || 0}%
          </span>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <td colSpan={10} style={{ padding: '16px 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>🤖 ML Recommendation</div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {r.recommendation_reason || 'Best fit based on volume, cost, and weight optimization.'}
                </p>
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>📦 Packing Note</div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {r.fragility_recommendation || 'Standard packaging is sufficient.'}
                </p>
                {r.orientation && (
                  <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    Best orientation: {r.orientation.l}×{r.orientation.w}×{r.orientation.h}cm
                  </p>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>🔄 Alternatives Considered</div>
                {(r.alternatives || []).map((alt: any, i: number) => (
                  <div key={i} style={{ color: 'var(--text-secondary)', marginBottom: 3 }}>
                    {i + 1}. {alt.box_name} (score: {alt.score?.toFixed(3)})
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function FailedRow({ result: r }: { result: any }) {
  const getFixAction = (reason: string) => {
    if (!reason) return { label: 'Check Box Catalog', href: '/dashboard/settings?tab=boxes' };
    if (reason.toLowerCase().includes('weight')) return { label: '+ Add Heavy Box', href: '/dashboard/settings?tab=boxes' };
    if (reason.toLowerCase().includes('large') || reason.toLowerCase().includes('exceed')) return { label: '+ Add Larger Box', href: '/dashboard/settings?tab=boxes' };
    if (reason.toLowerCase().includes('small') || reason.toLowerCase().includes('group')) return { label: 'Group Pack Guide', href: '/dashboard/settings?tab=boxes' };
    return { label: 'View Box Catalog', href: '/dashboard/settings?tab=boxes' };
  };
  
  const fix = getFixAction(r.failure_reason);
  
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(239,68,68,0.03)' }}>
      <td style={{ padding: '13px 14px', borderLeft: '3px solid #ef4444' }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{r.product_name || r.sku}</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.sku}</div>
      </td>
      <td style={{ padding: '13px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
        {r.length_cm}×{r.width_cm}×{r.height_cm}cm
      </td>
      <td style={{ padding: '13px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
        {r.weight_kg}kg
      </td>
      <td style={{ padding: '13px 14px', maxWidth: 300 }}>
        <div style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.5 }}>
          {r.failure_reason || 'No suitable box found in catalog.'}
        </div>
      </td>
      <td style={{ padding: '13px 14px' }}>
        <span style={{ 
          display: 'inline-block', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
          background: r.fragility_level === 'High' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.1)',
          color: r.fragility_level === 'High' ? '#ef4444' : '#22c55e'
        }}>
          {r.fragility_level || 'Low'}
        </span>
      </td>
      <td style={{ padding: '13px 14px' }}>
        <a href={fix.href} style={{ 
          padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
          background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)',
          textDecoration: 'none', display: 'inline-block'
        }}>
          {fix.label} →
        </a>
      </td>
    </tr>
  );
}
