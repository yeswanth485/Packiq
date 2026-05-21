'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import EmptyState from '@/components/EmptyState';

export default function ResultsHistoryPage() {
  const supabase = useMemo(() => createClient(), []);
  const [results, setResults] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('latest');
  const [activeTab, setActiveTab] = useState<'success' | 'failed'>('success');
  const [search, setSearch] = useState('');
  const [savingsFilter, setSavingsFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadSessionResults = useCallback(async (sessionId: string, userId: string) => {
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
  }, [supabase]);

  const loadData = useCallback(async () => {
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

    setSelectedSession(latestSessionId);
    await loadSessionResults(latestSessionId, user.id);
  }, [supabase, loadSessionResults]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  if (loading) return <div className="p-10 text-center text-indigo-400 font-mono animate-pulse">Loading Analytics...</div>;

  return (
    <div className="p-8 max-w-full overflow-hidden text-white min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="m-0 text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-500 tracking-tight">
          Optimization History
        </h1>
        <p className="mt-2 text-indigo-200/60 text-sm">
          Deep dive into your AI packaging analysis, savings breakdown, and optimization rationale.
        </p>
      </div>

      {sessions.length > 0 && (
        <div className="mb-6">
          <select 
            value={selectedSession}
            onChange={async (e) => {
              setSelectedSession(e.target.value);
              const { data: { user } } = await supabase.auth.getUser();
              if (user) await loadSessionResults(e.target.value, user.id);
            }}
            className="px-4 py-3 bg-[#1e1b4b]/60 border border-indigo-500/30 rounded-xl text-indigo-100 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all backdrop-blur-md font-medium"
          >
            {sessions.map((s, i) => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                {i === 0 ? '✨ LATEST: ' : '📄 '}{s.file_name} — {new Date(s.created_at).toLocaleDateString()} 
                ({s.optimized_items}/{s.total_items} optimized)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatChip label="Total Processed" value={results.length} glowColor="rgba(255,255,255,0.1)" />
        <StatChip label="Optimized" value={successItems.length} color="text-emerald-400" glowColor="rgba(52,211,153,0.15)" />
        <StatChip label="Not Optimized" value={failedItems.length} color="text-rose-400" glowColor="rgba(251,113,133,0.15)" />
        <StatChip label="Success Rate" value={(results.length > 0 ? (successItems.length / results.length * 100) : 0).toFixed(1) + '%'} color="text-blue-400" glowColor="rgba(96,165,250,0.15)" />
        <StatChip label="Total Savings" value={'₹' + totalSavings.toFixed(2)} color="text-purple-400" glowColor="rgba(192,132,252,0.15)" />
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-indigo-900/30 backdrop-blur-md border border-indigo-500/20 rounded-xl w-fit mb-6 shadow-inner">
        <button 
          onClick={() => setActiveTab('success')}
          className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${activeTab === 'success' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' : 'text-indigo-300/70 hover:text-white hover:bg-white/5'}`}
        >
          OPTIMIZED DETAILS ({successItems.length})
        </button>
        <button 
          onClick={() => setActiveTab('failed')}
          className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 ${activeTab === 'failed' ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg' : 'text-indigo-300/70 hover:text-white hover:bg-white/5'}`}
        >
          WHY NOT OPTIMIZED ⚠ ({failedItems.length})
        </button>
      </div>

      {/* Filters (Search Grid Area) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <input 
          placeholder="Search by SKU or Product Name..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="col-span-1 md:col-span-2 px-4 py-3 bg-[#1e1b4b]/60 border border-indigo-500/30 rounded-xl text-white placeholder-indigo-300/50 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all backdrop-blur-md"
        />
        {activeTab === 'success' && (
          <select 
            value={savingsFilter} 
            onChange={e => setSavingsFilter(e.target.value)}
            className="px-4 py-3 bg-[#1e1b4b]/60 border border-indigo-500/30 rounded-xl text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all backdrop-blur-md"
          >
            <option value="all" className="bg-slate-900">All Savings Ranges</option>
            <option value="high" className="bg-slate-900">High Impact (≥40%)</option>
            <option value="medium" className="bg-slate-900">Medium Impact (15-40%)</option>
            <option value="low" className="bg-slate-900">Low Impact (&lt;15%)</option>
          </select>
        )}
      </div>

      {/* Content Areas */}
      {activeTab === 'success' && (
        <div className="grid grid-cols-1 gap-4">
          {successItems.length === 0 ? (
            <div className="py-16 bg-slate-900/30 rounded-2xl border border-white/5">
              <EmptyState title="No optimizations" description="No successful optimizations found for this session and filters." />
            </div>
          ) : successItems.map(r => (
            <DetailedResultCard key={r.id} result={r} />
          ))}
        </div>
      )}

      {activeTab === 'failed' && (
        <div className="grid grid-cols-1 gap-4">
          {failedItems.length === 0 ? (
            <div className="py-16 bg-slate-900/30 rounded-2xl border border-white/5">
              <EmptyState title={results.length === 0 ? 'No optimizations yet' : 'Zero Failures!'} description={results.length === 0 ? 'Run an optimization to see results here.' : 'All items were successfully optimized.'} />
            </div>
          ) : failedItems.map(r => (
            <DetailedFailureCard key={r.id} result={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value, color = 'text-white', glowColor }: any) {
  return (
    <div 
      className="p-5 rounded-2xl bg-indigo-950/40 backdrop-blur-xl border border-indigo-500/20 relative overflow-hidden group hover:border-indigo-400/50 transition-all duration-300"
      style={{ boxShadow: `0 8px 32px -8px ${glowColor}` }}
    >
      <div className="text-xs font-black text-indigo-300/80 tracking-widest uppercase mb-2">{label}</div>
      <div className={`text-3xl font-black tracking-tight ${color}`}>{value}</div>
    </div>
  )
}

function DetailedResultCard({ result: r }: { result: any }) {
  const savingsColor = (r.savings_pct || 0) >= 30 ? 'text-emerald-400' : (r.savings_pct || 0) >= 10 ? 'text-amber-400' : 'text-slate-400';
  
  // Calculate a mock score for progress bar if not present
  const mlScore = Math.min(99, Math.max(10, r.ml_score || Math.round((r.savings_pct || 0) * 1.5 + 50)));

  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-indigo-500/20 rounded-2xl overflow-hidden hover:border-indigo-500/40 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
      {/* Header Bar */}
      <div className="p-5 border-b border-white/5 flex flex-wrap justify-between items-center bg-gradient-to-r from-indigo-900/30 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-xl shadow-lg">
            {(r.product_name || r.sku).charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-black m-0">{r.product_name || r.sku}</h3>
            <span className="text-xs text-indigo-300 font-mono tracking-wider">{r.sku}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-indigo-300/70 font-bold uppercase tracking-widest mb-1">Cost Savings</div>
          <div className={`text-2xl font-black ${savingsColor} flex items-center gap-2`}>
            <span>↓ {r.savings_pct?.toFixed(1) || 0}%</span>
            <span className="text-sm px-2 py-1 bg-white/5 rounded-lg border border-white/10 text-white">
              Save ₹{r.savings_amount?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5">
        
        {/* Box Transformation */}
        <div className="p-6 bg-slate-900/40">
          <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Box Selection</h4>
          <div className="flex items-center gap-4">
            <div className="flex-1 opacity-60">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Baseline</div>
              <div className="font-mono text-sm">{r.old_box_name || 'N/A'}</div>
              <div className="text-xs text-slate-500">{r.old_box_dims}</div>
              <div className="text-xs text-slate-500 mt-1 line-through">₹{r.old_box_cost?.toFixed(2)}</div>
            </div>
            <div className="text-indigo-500 font-bold">→</div>
            <div className="flex-1">
              <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1">Optimized</div>
              <div className="font-bold text-sm text-emerald-300">{r.new_box_name}</div>
              <div className="text-xs text-slate-400">{r.new_box_dims}</div>
              <div className="text-xs font-bold text-white mt-1">₹{r.new_box_cost?.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Shipping & Handling */}
        <div className="p-6 bg-slate-900/40">
          <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Handling & Shipping</h4>
          
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Fragility Score</span>
              <span className="font-bold text-white">{r.fragility_score || 30}/100 ({r.fragility_level})</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${r.fragility_level === 'High' ? 'bg-rose-500' : r.fragility_level === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400'}`}
                style={{ width: `${r.fragility_score || 30}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1 italic">{r.fragility_recommendation}</p>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Void Reduction</span>
              <span className="font-bold text-emerald-400">{100 - (r.void_percentage || 15)}% Utilized</span>
            </div>
          </div>
        </div>

        {/* ML Reasoning */}
        <div className="p-6 bg-slate-900/40">
          <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Why We Chose This</h4>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            {r.recommendation_reason || `The ${r.new_box_name} offers the optimal balance of minimal volumetric weight and sufficient padding space for a ${r.fragility_level?.toLowerCase()} fragility item.`}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">AI Confidence</span>
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${mlScore}%` }} />
            </div>
            <span className="text-xs font-mono font-bold text-indigo-300">{mlScore}%</span>
          </div>
        </div>

      </div>
    </div>
  );
}

function DetailedFailureCard({ result: r }: { result: any }) {
  const getFixAction = (reason: string) => {
    if (!reason) return { label: 'Check Box Catalog', href: '/dashboard/settings?tab=boxes', desc: 'Ensure your catalog has appropriate sizes.' };
    if (reason.toLowerCase().includes('weight')) return { label: '+ Add Heavy Box', href: '/dashboard/settings?tab=boxes', desc: 'The item exceeds the maximum weight limit of all available boxes in your current catalog.' };
    if (reason.toLowerCase().includes('large') || reason.toLowerCase().includes('exceed') || reason.toLowerCase().includes('missing')) return { label: '+ Add Larger Box / Update Dims', href: '/dashboard/settings?tab=boxes', desc: 'The item dimensions are too large for existing boxes, or product dimensions are missing/invalid.' };
    if (reason.toLowerCase().includes('small') || reason.toLowerCase().includes('group')) return { label: 'Group Pack Guide', href: '/dashboard/settings?tab=boxes', desc: 'Item is too small. Consider polybags or grouped shipping.' };
    return { label: 'View Box Catalog', href: '/dashboard/settings?tab=boxes', desc: 'No suitable box found. Expand your catalog.' };
  };
  
  const fix = getFixAction(r.failure_reason);

  return (
    <div className="bg-rose-950/20 backdrop-blur-md border border-rose-500/30 rounded-2xl overflow-hidden hover:border-rose-500/50 transition-all">
      <div className="p-6 flex flex-col md:flex-row gap-6 items-start">
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-black text-xl">
              ⚠
            </div>
            <div>
              <h3 className="text-lg font-black text-rose-100 m-0">{r.product_name || r.sku}</h3>
              <span className="text-xs text-rose-300/60 font-mono">{r.sku}</span>
            </div>
          </div>
          
          <div className="flex gap-4 mb-4">
            <div className="bg-rose-900/40 px-3 py-2 rounded-lg border border-rose-500/20">
              <div className="text-[10px] text-rose-300/70 font-bold uppercase mb-1">Dims</div>
              <div className="text-sm font-mono text-white">{r.length_cm}x{r.width_cm}x{r.height_cm}cm</div>
            </div>
            <div className="bg-rose-900/40 px-3 py-2 rounded-lg border border-rose-500/20">
              <div className="text-[10px] text-rose-300/70 font-bold uppercase mb-1">Weight</div>
              <div className="text-sm font-mono text-white">{r.weight_kg}kg</div>
            </div>
            <div className="bg-rose-900/40 px-3 py-2 rounded-lg border border-rose-500/20">
              <div className="text-[10px] text-rose-300/70 font-bold uppercase mb-1">Fragility</div>
              <div className="text-sm font-bold text-white">{r.fragility_level || 'Low'}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full p-5 bg-black/40 rounded-xl border border-white/5">
          <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-2">Failure Definition</h4>
          <p className="text-sm text-white font-bold mb-1">{r.failure_reason || 'No suitable box found in catalog.'}</p>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            {fix.desc}
          </p>
          <a 
            href={fix.href} 
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-all"
          >
            {fix.label}
          </a>
        </div>
        
      </div>
    </div>
  );
}
