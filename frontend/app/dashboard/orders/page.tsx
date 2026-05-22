'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import EmptyState from '@/components/EmptyState';
import BoxViewer3D from '@/components/3d/BoxViewer3D';
import { 
  Search, Filter, CheckCircle2, AlertTriangle, ShieldCheck, 
  TrendingDown, Sparkles, Box, Printer, HelpCircle, ArrowRight 
} from 'lucide-react';

export default function OrdersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState<any[]>([]);
  const [unoptimized, setUnoptimized] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'optimized' | 'unoptimized'>('optimized');
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    try {
      const res = await fetch('/api/dashboard-data?type=orders');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const { orders: rawOrders, unoptimized: rawUnoptimized } = await res.json();

      // Normalize orders (optimized results)
      const normalizedOrders = (rawOrders || []).map((o: any) => {
        const r = o.optimization_results || {};
        return {
          id: o.id,
          optimization_result_id: o.optimization_result_id,
          sku: o.product_snapshot?.sku || r.sku || 'SKU-UNKNOWN',
          product_name: o.product_snapshot?.name || r.product_name || 'Unnamed Product',
          length_cm: o.product_snapshot?.length_cm || r.length_cm || 0,
          width_cm: o.product_snapshot?.width_cm || r.width_cm || 0,
          height_cm: o.product_snapshot?.height_cm || r.height_cm || 0,
          weight_kg: o.product_snapshot?.weight_kg || r.weight_kg || 0.5,
          quantity: o.quantity || 1,
          
          old_box_name: o.product_snapshot?.current_box_name || r.old_box_name || 'Standard Box',
          old_box_dims: o.product_snapshot?.current_box_dims || r.old_box_dims || 'N/A',
          old_box_cost: o.product_snapshot?.current_box_cost || r.old_box_cost || 0,

          new_box_id: o.box_snapshot?.id || r.new_box_id || null,
          new_box_name: o.box_snapshot?.name || r.new_box_name || 'N/A',
          new_box_dims: o.box_snapshot?.length_cm 
            ? `${o.box_snapshot.length_cm}x${o.box_snapshot.width_cm}x${o.box_snapshot.height_cm} cm` 
            : (r.new_box_dims || 'N/A'),
          new_box_cost: o.box_snapshot?.cost || r.new_box_cost || o.total_cost || 0,

          is_optimized: true,
          savings_pct: r.savings_pct || 0,
          savings_amount: r.savings_amount || 0,
          fragility_level: r.fragility_level || 'Low',
          recommendation_reason: r.recommendation_reason || 'Optimized using Multi-Factor ML Cost Model.',
          zone: r.zone || 'ZONE 2',
          tracking_id: r.tracking_id || 'N/A',
          carrier: r.carrier || 'Standard',
          created_at: o.created_at
        };
      });

      // Normalize unoptimized failures
      const normalizedUnoptimized = (rawUnoptimized || []).map((r: any) => ({
        id: r.id,
        sku: r.sku,
        product_name: r.product_name,
        length_cm: r.length_cm,
        width_cm: r.width_cm,
        height_cm: r.height_cm,
        weight_kg: r.weight_kg,
        quantity: r.quantity || 1,
        is_optimized: false,
        failure_reason: r.failure_reason || 'Dimensions exceed maximum packaging standards.',
        created_at: r.created_at
      }));

      setOrders(normalizedOrders);
      setUnoptimized(normalizedUnoptimized);
    } catch (err) {
      console.error('Error loading manifest data:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // KPI calculations
  const stats = useMemo(() => {
    const totalProcessed = orders.length + unoptimized.length;
    const totalSaved = orders.reduce((acc, o) => acc + (o.savings_amount || 0), 0);
    const highRisk = orders.filter(o => o.fragility_level === 'High').length;
    const rate = totalProcessed > 0 ? (orders.length / totalProcessed) * 100 : 0;
    return {
      processed: totalProcessed,
      optimized: orders.length,
      unoptimizedCount: unoptimized.length,
      saved: totalSaved,
      highRisk,
      optimizationRate: rate
    };
  }, [orders, unoptimized]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter(o => 
        !search || 
        o.product_name?.toLowerCase().includes(search.toLowerCase()) || 
        o.sku?.toLowerCase().includes(search.toLowerCase()) ||
        o.tracking_id?.toLowerCase().includes(search.toLowerCase())
      )
      .filter(o => riskFilter === 'all' || o.fragility_level === riskFilter);
  }, [orders, search, riskFilter]);

  const filteredUnoptimized = useMemo(() => {
    return unoptimized.filter(o => 
      !search || 
      o.product_name?.toLowerCase().includes(search.toLowerCase()) || 
      o.sku?.toLowerCase().includes(search.toLowerCase())
    );
  }, [unoptimized, search]);

  if (loading) {
    return (
      <div className="p-10 min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full border-4 border-[#00FFD1]/20 border-t-[#00FFD1] animate-spin mb-4" />
        <p className="text-[#00FFD1] font-mono text-xs uppercase tracking-widest animate-pulse">Syncing Logistic Manifests...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-full overflow-hidden text-white min-h-screen bg-transparent">
      
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start mb-8 gap-6">
        <div>
          <h1 className="m-0 text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#00FFD1] to-blue-500 tracking-tight uppercase">
            Order Manifests
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            Fulfill AI-optimized orders, review packing instructions, and view 3D guides.
          </p>
        </div>
        <button 
          onClick={loadData}
          className="px-5 py-2.5 bg-white/[0.03] hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-[#00FFD1] transition-all hover:scale-105"
        >
          🔄 Refresh
        </button>
      </div>

      {/* KPI Display */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <KPICard dot="bg-[#00FFD1]" label="TOTAL ITEMS" value={stats.processed} glowColor="rgba(0,255,209,0.15)" />
        <KPICard dot="bg-emerald-400" label="OPTIMIZED" value={stats.optimized} labelSuffix={`(${stats.optimizationRate.toFixed(0)}%)`} glowColor="rgba(52,211,153,0.15)" />
        <KPICard dot="bg-amber-400" label="EST. SAVINGS" value={'₹' + stats.saved.toFixed(2)} glowColor="rgba(251,191,36,0.15)" />
        <KPICard dot="bg-rose-500" label="HIGH RISK ITEMS" value={stats.highRisk} valueColor="#f43f5e" glowColor="rgba(244,63,94,0.15)" />
      </div>

      {/* Main Tabs Container */}
      <div className="flex flex-col gap-6">
        
        {/* Toggle between Optimized and Unoptimized */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-4 flex-wrap">
          <div className="flex gap-2 p-1 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveSubTab('optimized')}
              className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeSubTab === 'optimized' 
                  ? 'bg-[#00FFD1]/20 text-[#00FFD1] border border-[#00FFD1]/30' 
                  : 'text-slate-400 border border-transparent hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Optimized ({stats.optimized})
            </button>
            <button
              onClick={() => setActiveSubTab('unoptimized')}
              className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeSubTab === 'unoptimized' 
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                  : 'text-slate-400 border border-transparent hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Unoptimized ({stats.unoptimizedCount})
            </button>
          </div>

          {/* Filters Area */}
          <div className="flex gap-3 items-center flex-1 max-w-md justify-end">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                placeholder={activeSubTab === 'optimized' ? "Search SKU, Name, Tracking..." : "Search SKU, Name..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#0f172a]/60 border border-slate-700/60 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-[#00FFD1] text-xs"
              />
            </div>
            {activeSubTab === 'optimized' && (
              <select
                value={riskFilter}
                onChange={e => setRiskFilter(e.target.value)}
                className="px-3 py-2.5 bg-[#0f172a]/60 border border-slate-700/60 rounded-xl text-white text-xs focus:outline-none focus:border-[#00FFD1]"
              >
                <option value="all">All Risks</option>
                <option value="High">🔴 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🟢 Low</option>
              </select>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeSubTab === 'optimized' ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-2xl">
            <table className="w-full min-w-[1000px] border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800">
                  {['PRODUCT DETAILS', 'BASELINE DIMENSIONS', 'RECOMMENDED PACKAGING', 'SHIPPING COST', 'SAVINGS', 'RISK', 'ACTIONS'].map(col => (
                    <th key={col} className="p-4 text-left text-[10px] font-black text-slate-400 tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center">
                      <EmptyState 
                        title={orders.length === 0 ? "No Optimized Orders" : "No Matches"} 
                        description={orders.length === 0 ? "Upload product catalog coordinates in the Optimization tab to generate boxes." : "Refine your filters or search criteria."} 
                      />
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => (
                    <OrderRow key={order.id} order={order} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Unoptimized / Failures List */
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-2xl">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800">
                  {['PRODUCT SKU / NAME', 'PHYSICAL DIMS', 'WEIGHT', 'FAILURE DETAILS & REASON', 'CRITICAL ADVICE'].map(col => (
                    <th key={col} className="p-4 text-left text-[10px] font-black text-slate-400 tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUnoptimized.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <EmptyState 
                        title={unoptimized.length === 0 ? "No Optimization Failures" : "No Matches"} 
                        description={unoptimized.length === 0 ? "Fantastic! All items have been successfully fitted and optimized." : "Refine your search term."} 
                      />
                    </td>
                  </tr>
                ) : (
                  filteredUnoptimized.map(item => (
                    <tr key={item.id} className="border-b border-slate-800/60 hover:bg-white/5 transition-all">
                      <td className="p-4">
                        <div className="font-bold text-sm text-slate-100">{item.product_name || 'Item'}</div>
                        <div className="text-xs text-rose-400 font-mono mt-1">{item.sku}</div>
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-400">
                        {item.length_cm} x {item.width_cm} x {item.height_cm} cm
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-400">
                        {item.weight_kg} kg
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-rose-400 text-xs font-bold bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg max-w-lg">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{item.failure_reason}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        Suggest adding a larger box (e.g. 50x50x40 cm) to the Box Catalog to fit this dimension profile.
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderRow({ order }: { order: any }) {
  const [expanded, setExpanded] = useState(false);
  
  // Parse dimensions for 3D viewer
  const dimsArray = order.new_box_dims ? order.new_box_dims.toLowerCase().replace('cm', '').split('x') : [];
  const l = parseFloat(dimsArray[0]) || 20;
  const w = parseFloat(dimsArray[1]) || 20;
  const h = parseFloat(dimsArray[2]) || 15;

  return (
    <>
      <tr 
        onClick={() => setExpanded(!expanded)}
        className="border-b border-slate-800/60 cursor-pointer hover:bg-white/5 transition-all duration-200"
        style={{ background: expanded ? 'rgba(0, 255, 209, 0.03)' : 'transparent' }}
      >
        {/* PRODUCT DETAILS */}
        <td className="p-4">
          <div className="font-bold text-sm text-slate-100">{order.product_name}</div>
          <div className="text-xs text-slate-500 mt-1 font-mono">{order.sku}</div>
          <div className="text-[10px] text-slate-400/50 font-mono mt-0.5">{order.tracking_id}</div>
        </td>
        
        {/* BASELINE DIMS */}
        <td className="p-4 font-mono text-xs text-slate-400">
          <div>{order.old_box_dims}</div>
          <div className="text-[10px] text-slate-600 mt-0.5">₹{order.old_box_cost?.toFixed(2)} baseline</div>
        </td>
        
        {/* RECOMMENDED PACKAGING */}
        <td className="p-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#00FFD1]/10 text-[#00FFD1] border border-[#00FFD1]/20">
            <Box className="w-3.5 h-3.5" />
            {order.new_box_name}
          </span>
          <div className="text-[10px] text-slate-500 font-mono mt-1">{order.new_box_dims}</div>
        </td>
        
        {/* SHIPPING COST */}
        <td className="p-4 font-mono text-sm font-black text-white">
          ₹{order.new_box_cost?.toFixed(2)}
        </td>
        
        {/* SAVINGS */}
        <td className="p-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]">
            ↘ {order.savings_pct?.toFixed(1)}%
          </span>
          <div className="text-[10px] text-emerald-500/80 font-mono mt-1">Saved ₹{order.savings_amount?.toFixed(2)}</div>
        </td>
        
        {/* RISK */}
        <td className="p-4">
          <span className={`inline-flex items-center gap-1 text-xs font-bold ${
            order.fragility_level === 'High' ? 'text-rose-400' : 
            order.fragility_level === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {order.fragility_level === 'High' ? '🔴' : order.fragility_level === 'Medium' ? '🟡' : '🟢'}
            {order.fragility_level} Risk
          </span>
        </td>

        {/* ACTIONS */}
        <td className="p-4" onClick={e => e.stopPropagation()}>
          <div className="flex gap-2">
            <button 
              onClick={() => window.location.href = `/dashboard/labels?result_id=${order.optimization_result_id || order.id}`}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-500/15 hover:bg-blue-500/30 text-blue-400 border border-blue-500/20 transition-all flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              Label
            </button>
            <button 
              onClick={() => setExpanded(!expanded)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            >
              {expanded ? 'Hide 3D' : 'View 3D'}
            </button>
          </div>
        </td>
      </tr>

      {/* EXPANDED 3D PACKING DRAWER */}
      {expanded && (
        <tr className="bg-slate-950/40 border-b border-slate-850 shadow-inner">
          <td colSpan={7} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-6 items-stretch">
              
              {/* Left Column: 3D canvas */}
              <div className="relative h-[380px] rounded-2xl overflow-hidden border border-slate-800 bg-black/60 shadow-xl">
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  <div className="px-3 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/5 text-[10px] font-black text-[#00FFD1] uppercase tracking-widest">
                    Interactive Packing Guide
                  </div>
                  <div className="px-3 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/5 text-[10px] font-mono text-slate-400">
                    {order.new_box_dims}
                  </div>
                </div>
                
                {/* 3D Component */}
                <BoxViewer3D widthCm={l} depthCm={w} heightCm={h} openDelay={100} />
              </div>

              {/* Right Column: AI Strategy Explanations */}
              <div className="flex flex-col justify-between gap-4">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Item Specifications</h4>
                    <p className="text-sm font-bold text-white mb-1.5">{order.product_name}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                      <div>Dims: {order.length_cm}x{order.width_cm}x{order.height_cm} cm</div>
                      <div>Weight: {order.weight_kg} kg</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#00FFD1]/5 border border-[#00FFD1]/15">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#00FFD1] uppercase tracking-widest mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>XGBoost ML Packaging Recommendation</span>
                    </div>
                    <p className="text-xs text-[#00FFD1]/80 leading-relaxed font-medium">
                      {order.recommendation_reason}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    This box provides the optimal volume safety index with standard packing orientations. Follow the 3D guide to align items.
                  </div>
                </div>
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function KPICard({ dot, label, value, labelSuffix = '', valueColor, glowColor }: any) {
  return (
    <div 
      className="p-5 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all duration-300"
      style={{ boxShadow: `0 8px 32px -8px ${glowColor}` }}
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full duration-1000 ease-in-out transition-all" />
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${dot} shadow-[0_0_8px_currentColor]`} />
        <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">
          {label} <span className="text-[#00FFD1]/60 font-mono lowercase">{labelSuffix}</span>
        </span>
      </div>
      <div className="text-2xl font-black tracking-tight" style={{ color: valueColor || '#f8fafc' }}>
        {value}
      </div>
    </div>
  );
}
