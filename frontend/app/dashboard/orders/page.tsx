'use client';
import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import EmptyState from '@/components/EmptyState';
import BoxViewer3D from '@/components/3d/BoxViewer3D';

export default function OrdersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Load user orders via API (bypasses RLS issues)
      try {
        const res = await fetch('/api/dashboard-data?type=orders');
        if (!res.ok) throw new Error('Failed to fetch');
        const { data: ordersData } = await res.json();

        // normalize to expected shape for UI
        const normalized = (ordersData || []).map((o: any) => ({
          ...o,
          product_name: (o.product_snapshot && o.product_snapshot.name) || o.product_name || o.product_snapshot?.product_name,
          sku: (o.product_snapshot && (o.product_snapshot.sku || o.product_snapshot.SKU)) || o.sku,
          new_box_name: (o.box_snapshot && (o.box_snapshot.name || o.box_snapshot.box_name)) || o.new_box_name,
          new_box_dims: o.box_snapshot ? `${o.box_snapshot.length_cm}×${o.box_snapshot.width_cm}×${o.box_snapshot.height_cm}cm` : o.new_box_dims,
          new_box_cost: o.box_snapshot?.cost || o.new_box_cost || o.total_cost,
        }));

        setOrders(normalized);
      } catch (err) {
        console.error('Error loading orders:', err);
        setOrders([]);
      }
      
      setLoading(false);
    }
    load();
  }, [supabase]);

  const allOrders = useMemo(() => orders, [orders]);
  const successOrders = useMemo(() => orders.filter(o => o.is_optimized || o.new_box_name), [orders]);
  const failedOrders = useMemo(() => orders.filter(o => !o.is_optimized && !o.new_box_name), [orders]);
  
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

  if (loading) return <div className="p-10 text-center text-[#00FFD1] font-mono animate-pulse">Loading Manifests...</div>;

  return (
    <div className="p-8 max-w-full overflow-hidden text-white min-h-screen bg-transparent">
      
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start mb-8 gap-4">
        <div>
          <h1 className="m-0 text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#00FFD1] to-blue-500 tracking-tight">
            Shipment Manifests
          </h1>
          <p className="mt-2 text-blue-200/60 text-sm">
            Manage your AI-optimized order logistics, view 3D packing guides, and generate labels seamlessly.
          </p>
        </div>
        <button className="px-6 py-3 bg-gradient-to-r from-[#00FFD1] to-[#00b392] hover:from-[#00b392] hover:to-[#008f74] rounded-xl text-slate-900 font-black shadow-[0_0_20px_rgba(0,255,209,0.3)] transition-all transform hover:scale-105 whitespace-nowrap">
          + NEW ORDER
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <KPICard dot="bg-[#00FFD1]" label="PROCESSED" value={allOrders.length} glowColor="rgba(0,255,209,0.15)" />
        <KPICard dot="bg-blue-400" label="OPTIMIZED" value={successOrders.length} glowColor="rgba(96,165,250,0.15)" />
        <KPICard dot="bg-amber-400" label="TOTAL SAVED" value={'₹' + totalSaved.toFixed(2)} glowColor="rgba(251,191,36,0.15)" />
        <KPICard dot="bg-rose-500" label="HIGH RISK" value={highRiskCount} valueColor="#f43f5e" glowColor="rgba(244,63,94,0.15)" />
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-6">
        <input
          placeholder="Search by SKU or Product Name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-3 bg-[#0f172a]/60 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-[#00FFD1] focus:ring-1 focus:ring-[#00FFD1] transition-all backdrop-blur-md"
        />
        <select
          value={riskFilter}
          onChange={e => setRiskFilter(e.target.value)}
          className="px-4 py-3 bg-[#0f172a]/60 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-[#00FFD1] transition-all backdrop-blur-md"
        >
          <option value="all">All Risk Levels</option>
          <option value="High">High Risk</option>
          <option value="Medium">Medium Risk</option>
          <option value="Low">Low Risk</option>
        </select>
      </div>

      {/* Orders Table - Glassmorphism */}
      <div className="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-800/30 backdrop-blur-xl shadow-2xl">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-700/80">
              {['PRODUCT','BASELINE BOX','OPTIMIZED BOX','TOTAL COST','SAVINGS','RISK LEVEL'].map(col => (
                <th key={col} className="p-4 text-left text-xs font-bold text-slate-400 tracking-wider whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16">
                  <EmptyState title={orders.length === 0 ? 'No optimizations yet' : 'No matching orders'} description={orders.length === 0 ? 'Run an optimization to populate shipments' : 'Try a different search or clear filters.'} />
                </td>
              </tr>
            ) : filtered.map(order => (
              <OrderRow key={order.id} order={order} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Not Optimized Banner */}
      {failedOrders.length > 0 && (
        <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex justify-between items-center backdrop-blur-md">
          <div>
            <span className="text-rose-400 font-bold">
              ⚠ {failedOrders.length} items could not be optimized
            </span>
            <span className="text-slate-400 text-sm ml-2 hidden sm:inline">
              — review History for reasons and recommendations.
            </span>
          </div>
          <a href="/dashboard/results" className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-lg text-rose-300 text-xs font-bold no-underline transition-all">
            Review Failures →
          </a>
        </div>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: any }) {
  const [expanded, setExpanded] = useState(false);
  
  // Extract dimensions safely
  const dimsArray = order.new_box_dims ? order.new_box_dims.toLowerCase().replace('cm', '').split('x') : [];
  const w = parseFloat(dimsArray[0]) || 20;
  const d = parseFloat(dimsArray[1]) || 20;
  const h = parseFloat(dimsArray[2]) || 15;

  return (
    <>
      <tr 
        onClick={() => setExpanded(!expanded)}
        className="border-b border-slate-700/40 cursor-pointer hover:bg-white/5 transition-all duration-200"
        style={{ background: expanded ? 'rgba(255,255,255,0.03)' : 'transparent' }}
      >
        {/* PRODUCT */}
        <td className="p-4">
          <div className="font-bold text-sm text-slate-100">{order.product_name || order.sku}</div>
          <div className="text-xs text-slate-500 mt-1">{order.sku}</div>
        </td>
        {/* BASELINE BOX */}
        <td className="p-4 text-xs text-slate-400 font-mono">
          {order.old_box_dims || order.length_cm + 'x' + order.width_cm + 'x' + order.height_cm}
        </td>
        {/* OPTIMIZED BOX */}
        <td className="p-4">
          <div className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-[#00FFD1]/10 text-[#00FFD1] border border-[#00FFD1]/20">
            📦 {order.new_box_name || 'N/A'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">{order.new_box_dims}</div>
        </td>
        {/* TOTAL COST */}
        <td className="p-4">
          <div className="text-xs text-slate-500 line-through">
            ₹{order.old_box_cost?.toFixed(2)}
          </div>
          <div className="text-sm font-black text-white">
            ₹{order.new_box_cost?.toFixed(2)}
          </div>
        </td>
        {/* SAVINGS */}
        <td className="p-4">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            ↘ {order.savings_pct?.toFixed(1)}%
          </span>
        </td>
        {/* RISK LEVEL & ACTIONS */}
        <td className="p-4 flex justify-between items-center gap-4">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${order.fragility_level === 'High' ? 'text-rose-400' : order.fragility_level === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}`}>
            {order.fragility_level === 'High' ? '🔴' : order.fragility_level === 'Medium' ? '⚠️' : '✅'} {order.fragility_level}
          </span>
          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); window.location.href = `/dashboard/labels?result_id=${order.optimization_result_id || order.id}`; }}
              className="px-3 py-1.5 text-xs font-bold rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all"
            >
              Label
            </button>
            <button className="px-3 py-1.5 text-xs font-bold rounded-md bg-slate-700/50 hover:bg-slate-700 text-slate-300 transition-all">
              {expanded ? 'Hide 3D' : 'View 3D'}
            </button>
          </div>
        </td>
      </tr>

      {/* EXPANDED 3D VIEW */}
      {expanded && (
        <tr className="bg-slate-900/60 border-b border-slate-700/60 shadow-inner">
          <td colSpan={6} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              
              <div className="lg:col-span-2 relative h-[400px] w-full rounded-2xl overflow-hidden border border-slate-700 bg-black/50 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-xs font-bold text-[#00FFD1] shadow-lg">
                    Interactive 3D Packing Guide
                  </div>
                  <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-xs font-mono text-slate-300">
                    {order.new_box_dims}
                  </div>
                </div>
                {/* Embedded 3D Viewer Component */}
                <BoxViewer3D widthCm={w} depthCm={d} heightCm={h} openDelay={300} />
              </div>

              <div className="flex flex-col gap-4">
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Item Specs</h4>
                  <p className="text-sm font-bold text-white mb-1">{order.product_name || order.sku}</p>
                  <p className="text-xs text-slate-400 font-mono">Weight: {order.weight_kg} kg</p>
                  <p className="text-xs text-slate-400 font-mono">Dims: {order.length_cm}x{order.width_cm}x{order.height_cm}cm</p>
                </div>

                <div className="p-4 rounded-xl bg-[#00FFD1]/10 border border-[#00FFD1]/20">
                  <h4 className="text-xs font-black text-[#00FFD1]/80 uppercase tracking-widest mb-2">AI Packing Strategy</h4>
                  <ul className="text-xs text-[#00FFD1]/70 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-[#00FFD1] mt-0.5">✓</span>
                      Optimal volumetric fit ({100 - (order.void_percentage || 15)}% utilized)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#00FFD1] mt-0.5">✓</span>
                      {order.fragility_level === 'High' ? 'Heavy dunnage required' : 'Minimal void fill needed'}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#00FFD1] mt-0.5">✓</span>
                      Saved ₹{order.savings_amount?.toFixed(2)} vs baseline
                    </li>
                  </ul>
                </div>
              </div>
              
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function KPICard({ dot, label, value, valueColor, glowColor }: any) {
  return (
    <div 
      className="p-5 rounded-2xl bg-slate-800/40 backdrop-blur-xl border border-slate-700 relative overflow-hidden group hover:border-slate-500 transition-all duration-300"
      style={{ boxShadow: `0 8px 32px -8px ${glowColor}` }}
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full duration-1000 ease-in-out transition-all" />
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${dot} shadow-[0_0_8px_currentColor]`} />
        <span className="text-[10px] font-black text-slate-400 tracking-widest">{label}</span>
      </div>
      <div className="text-3xl font-black tracking-tight" style={{ color: valueColor || '#f8fafc' }}>
        {value}
      </div>
    </div>
  );
}
