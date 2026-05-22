'use client';

import { useEffect, useState, useMemo } from 'react';
import EmptyState from '@/components/EmptyState';
import BoxViewer3D from '@/components/3d/BoxViewer3D';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Info, Search, RefreshCw, ShoppingCart, 
  CheckCircle2, AlertCircle, Calendar, ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function OrdersPage() {
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
  
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'optimized' | 'unoptimized'>('optimized');
  
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Load orders and sessions
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch sessions for the dropdown
      const sessionRes = await fetch('/api/dashboard-data?type=sessions');
      if (sessionRes.ok) {
        const { data } = await sessionRes.json();
        setSessions(data || []);
      }

      // 2. Fetch ORDERS (not optimization results)
      const ordersRes = await fetch('/api/orders');
      if (!ordersRes.ok) {
        const errorText = await ordersRes.text();
        console.error('Orders API error:', ordersRes.status, errorText);
        throw new Error(`Failed to fetch orders (${ordersRes.status}): ${errorText}`);
      }
      
      const response = await ordersRes.json();
      const orders = response.orders || [];
      console.log(`Loaded ${orders.length} orders from API`);
      
      // Transform orders data to match the expected format
      const transformedResults = orders.map((order: any) => {
        // If order has optimization_result_id, we need to fetch the optimization result details
        // For now, use the product_snapshot and box_snapshot
        const product = order.product_snapshot || {};
        const box = order.box_snapshot || {};
        
        return {
          id: order.id,
          session_id: order.optimization_session_id,
          user_id: order.user_id,
          sku: order.sku || product.sku || order.product_id || 'N/A',
          product_name: order.product_name || product.name || product.product_name || 'Unknown Product',
          length_cm: order.length_cm || product.length_cm || 0,
          width_cm: order.width_cm || product.width_cm || 0,
          height_cm: order.height_cm || product.height_cm || 0,
          weight_kg: order.weight_kg || product.weight_kg || 0,
          quantity: order.quantity || 1,
          is_optimized: true, // Orders are created from optimized results
          failure_reason: null,
          old_box_name: box.old_box_name || 'Standard Box',
          old_box_dims: box.old_box_dims || 'Not specified',
          old_box_cost: box.old_box_cost || 0,
          new_box_id: box.new_box_id || null,
          new_box_name: box.new_box_name || box.name || 'Optimal Box',
          new_box_dims: box.new_box_dims || box.dimensions || 'Not specified',
          new_box_cost: box.new_box_cost || box.cost || 0,
          new_box_length_cm: box.new_box_length_cm || box.length_cm || 0,
          new_box_width_cm: box.new_box_width_cm || box.width_cm || 0,
          new_box_height_cm: box.new_box_height_cm || box.height_cm || 0,
          savings_amount: box.savings_amount || (order.total_cost && box.old_box_cost ? box.old_box_cost - order.total_cost : 0),
          savings_pct: box.savings_pct || (box.old_box_cost && box.old_box_cost > 0
            ? ((box.old_box_cost - (order.total_cost || box.new_box_cost || 0)) / box.old_box_cost) * 100 
            : 0),
          fragility_level: order.fragility_level || product.fragility || 'Low',
          zone: order.zone || product.zone || 'ZONE 2',
          tracking_id: order.tracking_number || order.tracking_id || `ORD-${order.id?.slice(0, 8)?.toUpperCase() || 'UNKNOWN'}`,
          carrier: order.carrier || 'Standard',
          created_at: order.created_at,
          status: order.status || 'pending'
        };
      });
      
      setResults(transformedResults || []);
    } catch (err: any) {
      console.error('Error loading orders:', err);
      toast.error(err.message || 'Error loading orders data');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSessionId]);

  // Separate optimized vs. unoptimized
  const optimizedItems = useMemo(() => {
    return results.filter(r => r.is_optimized);
  }, [results]);

  const unoptimizedItems = useMemo(() => {
    return results.filter(r => !r.is_optimized);
  }, [results]);

  // KPI Calculations
  const stats = useMemo(() => {
    const total = results.length;
    const optimized = optimizedItems.length;
    const unoptimized = unoptimizedItems.length;
    
    // Sum savings deterministically
    const totalSaved = optimizedItems.reduce((acc, r) => acc + (Number(r.savings_amount) || 0), 0);
    const avgSavingsPct = optimized > 0
      ? (optimizedItems.reduce((acc, r) => acc + (Number(r.savings_pct) || 0), 0) / optimized)
      : 0;

    return { total, optimized, unoptimized, totalSaved, avgSavingsPct };
  }, [results, optimizedItems, unoptimizedItems]);

  // Filter lists based on Search & Risk filters
  const filteredOptimized = useMemo(() => {
    return optimizedItems
      .filter(item => {
        const matchesSearch = !search || 
          item.product_name?.toLowerCase().includes(search.toLowerCase()) || 
          item.sku?.toLowerCase().includes(search.toLowerCase());
        const matchesRisk = riskFilter === 'all' || item.fragility_level?.toLowerCase() === riskFilter.toLowerCase();
        return matchesSearch && matchesRisk;
      });
  }, [optimizedItems, search, riskFilter]);

  const filteredUnoptimized = useMemo(() => {
    return unoptimizedItems
      .filter(item => {
        return !search || 
          item.product_name?.toLowerCase().includes(search.toLowerCase()) || 
          item.sku?.toLowerCase().includes(search.toLowerCase());
      });
  }, [unoptimizedItems, search]);

  const handleRowClick = (id: string) => {
    setExpandedRow(prev => prev === id ? null : id);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 pb-20 text-white min-h-screen">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#00FFD1] to-blue-500 tracking-tight flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-[#00FFD1]" /> Shipments Manifest
          </h1>
          <p className="mt-2 text-slate-400 text-sm">
            Manage optimized packaging assignments, view automated 3D packing guides, and dispatch labels.
          </p>
        </div>
        
        {/* Controls: Dropdown & Refresh */}
        <div className="flex items-center gap-3 self-stretch md:self-auto">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#0F0F16] border border-white/10 rounded-xl max-w-xs flex-1">
            <Calendar className="w-4 h-4 text-[#00FFD1] shrink-0" />
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none w-full font-bold cursor-pointer [&>option]:bg-[#0F0F16]"
            >
              <option value="all">📊 All Upload Batches</option>
              {sessions.map((s, idx) => (
                <option key={s.id} value={s.id}>
                  📦 {s.file_name || `Batch ${idx + 1}`} ({new Date(s.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={loadData}
            className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-[#00FFD1]/50 text-slate-400 hover:text-white transition-all group active:scale-95"
            title="Reload Data"
          >
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          color="#00FFD1" 
          title="TOTAL ITEMS" 
          value={stats.total} 
          subtitle="Processed in pipeline" 
          icon={ShoppingCart} 
        />
        <KPICard 
          color="#10b981" 
          title="OPTIMIZED" 
          value={stats.optimized} 
          subtitle={`${stats.total > 0 ? Math.round((stats.optimized/stats.total)*100) : 0}% success rate`} 
          icon={CheckCircle2} 
        />
        <KPICard 
          color="#EAB308" 
          title="TOTAL SAVED" 
          value={`₹${stats.totalSaved.toFixed(2)}`} 
          subtitle={`Avg: ${stats.avgSavingsPct.toFixed(1)}% per order`} 
          icon={TrendingUp} 
        />
        <KPICard 
          color="#ef4444" 
          title="WHY NOT OPTIMIZED" 
          value={stats.unoptimized} 
          subtitle="Requires dimensional check" 
          icon={AlertCircle} 
        />
      </div>

      {/* Toggle & Filters Station */}
      <div className="glass p-6 rounded-3xl space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          
          {/* Custom Tabs Toggle */}
          <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/5 rounded-2xl w-fit">
            <button 
              onClick={() => { setActiveTab('optimized'); setExpandedRow(null); }}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'optimized' 
                  ? 'bg-[#00FFD1] text-[#0A0A0F] shadow-[0_0_15px_rgba(0,255,209,0.3)]' 
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              Optimized Shipments ({stats.optimized})
            </button>
            <button 
              onClick={() => { setActiveTab('unoptimized'); setExpandedRow(null); }}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'unoptimized' 
                  ? 'bg-[#ef4444]/10 text-red-400 border border-red-500/20' 
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              Why Not Optimized ({stats.unoptimized})
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3 w-full md:w-auto flex-1 md:flex-none justify-end">
            <div className="relative flex-1 md:flex-none max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                placeholder="Search SKU or product..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FFD1] focus:ring-1 focus:ring-[#00FFD1] transition-all"
              />
            </div>

            {activeTab === 'optimized' && (
              <select
                value={riskFilter}
                onChange={e => setRiskFilter(e.target.value)}
                className="px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-[#00FFD1] transition-all cursor-pointer [&>option]:bg-[#0F0F16]"
              >
                <option value="all">⚡ All Risks</option>
                <option value="low">🟢 Low Risk</option>
                <option value="medium">🟡 Medium Risk</option>
                <option value="high">🔴 High Risk</option>
              </select>
            )}
          </div>
        </div>

        {/* Dynamic Manifest Panels */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="py-20 text-center font-mono text-sm text-[#00FFD1] animate-pulse flex flex-col items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin" />
              Syncing live manifest parameters...
            </div>
          ) : activeTab === 'optimized' ? (
            <motion.div
              key="optimized-pane"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0F0F16]/50 shadow-2xl"
            >
              <table className="w-full min-w-[1000px] border-collapse text-left">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] font-black text-slate-400 tracking-wider uppercase">
                    <th className="p-4 pl-6">PRODUCT DETAILS</th>
                    <th className="p-4">BASELINE DIMS</th>
                    <th className="p-4">OPTIMIZED BOX</th>
                    <th className="p-4 text-right">SHIPPING COST</th>
                    <th className="p-4 text-center">SAVINGS</th>
                    <th className="p-4">RISK LEVEL</th>
                    <th className="p-4">AI REASON FOR RECOMMENDATION</th>
                    <th className="p-4 text-right pr-6">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOptimized.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16">
                        <EmptyState 
                          title="No Optimized Orders Found" 
                          description={results.length === 0 ? "You have not run any optimizations yet. Upload a CSV under the Optimization tab to begin." : "Try adjusting your search filters or risk level filters."} 
                        />
                      </td>
                    </tr>
                  ) : filteredOptimized.map((item) => {
                    const isExpanded = expandedRow === item.id;
                    const dims = item.new_box_dims ? item.new_box_dims.toLowerCase().replace('cm', '').split('x') : [];
                    const w = parseFloat(dims[0]) || 20;
                    const d = parseFloat(dims[1]) || 20;
                    const h = parseFloat(dims[2]) || 15;

                    return (
                      <>
                        <tr 
                          key={item.id}
                          onClick={() => handleRowClick(item.id)}
                          className={`hover:bg-white/[0.02] cursor-pointer transition-all duration-300 ${isExpanded ? 'bg-white/[0.03]' : ''}`}
                        >
                          {/* PRODUCT DETAILS */}
                          <td className="p-4 pl-6">
                            <div className="font-bold text-xs text-white max-w-[200px] truncate">{item.product_name || 'Item'}</div>
                            <div className="text-[10px] text-slate-500 mt-1 font-mono tracking-tight">{item.sku}</div>
                          </td>

                          {/* BASELINE DIMS */}
                          <td className="p-4 text-xs font-mono text-slate-500">
                            {item.old_box_dims || 'Not specified'}
                          </td>

                          {/* OPTIMIZED BOX */}
                          <td className="p-4">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black bg-[#00FFD1]/10 text-[#00FFD1] border border-[#00FFD1]/20">
                              📦 {item.new_box_name || 'Optimal'}
                            </div>
                            <div className="text-[9px] text-slate-500 font-mono mt-1">{item.new_box_dims}</div>
                          </td>

                          {/* COST BREAKDOWN */}
                          <td className="p-4 text-right">
                            <div className="text-[10px] text-slate-500 line-through">₹{(item.old_box_cost || 0).toFixed(2)}</div>
                            <div className="text-xs font-black text-white mt-0.5">₹{(item.shipping_cost || item.new_box_cost || 0).toFixed(2)}</div>
                          </td>

                          {/* SAVINGS */}
                          <td className="p-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-black border border-emerald-500/20">
                                ↘ {Math.round(item.savings_pct || 0)}%
                              </span>
                              <span className="text-[9px] text-emerald-500 mt-1 font-bold">
                                +₹{(item.savings_amount || 0).toFixed(1)}
                              </span>
                            </div>
                          </td>

                          {/* RISK LEVEL */}
                          <td className="p-4 text-xs font-bold">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              item.fragility_level === 'High' 
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                : item.fragility_level === 'Medium' 
                                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' 
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {item.fragility_level === 'High' ? '🔴 HIGH' : item.fragility_level === 'Medium' ? '🟡 MED' : '🟢 LOW'}
                            </span>
                          </td>

                          {/* REASONING */}
                          <td className="p-4 max-w-[280px]">
                            <p className="text-[11px] text-slate-400 leading-normal line-clamp-2">
                              {item.recommendation_reason || 'Selected based on optimal volumetric constraints and minimum void score.'}
                            </p>
                          </td>

                          {/* ACTIONS */}
                          <td className="p-4 text-right pr-6" onClick={e => e.stopPropagation()}>
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => window.location.href = `/dashboard/labels?result_id=${item.id}`}
                                className="px-3 py-1.5 text-[9px] font-black tracking-widest uppercase rounded-lg bg-[#00FFD1] hover:bg-[#00FFD1]/80 text-[#0A0A0F] hover:scale-105 transition-all shadow-[0_0_10px_rgba(0,255,209,0.2)] flex items-center gap-1"
                              >
                                LABEL <ArrowUpRight className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => handleRowClick(item.id)}
                                className={`px-3 py-1.5 text-[9px] font-bold rounded-lg border transition-all ${
                                  isExpanded 
                                    ? 'bg-white/10 border-white/20 text-white' 
                                    : 'bg-white/5 border-white/15 text-slate-400 hover:text-white hover:border-[#00FFD1]/30'
                                }`}
                              >
                                {isExpanded ? 'CLOSE 3D' : 'VIEW 3D'}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Interactive 3D Drawer Panel */}
                        <AnimatePresence>
                          {isExpanded && (
                            <tr key={`${item.id}-expanded`} className="bg-black/30 border-b border-white/5">
                              <td colSpan={8} className="p-6">
                                <motion.div 
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center overflow-hidden"
                                >
                                  {/* Animated 3D Viewer Box */}
                                  <div className="lg:col-span-8 relative h-[380px] w-full rounded-2xl overflow-hidden border border-white/10 bg-[#0A0A0F]/90 shadow-2xl">
                                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                                      <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded border border-[#00FFD1]/30 text-[9px] font-black uppercase tracking-widest text-[#00FFD1]">
                                        Animated 3D Assembly Guide
                                      </div>
                                      <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded border border-white/15 text-[9px] font-mono text-slate-300 uppercase">
                                        Box: {item.new_box_name || 'Custom'}
                                      </div>
                                    </div>
                                    <BoxViewer3D widthCm={w} depthCm={d} heightCm={h} openDelay={300} />
                                  </div>

                                  {/* Dunnage & Spec Strategy Details */}
                                  <div className="lg:col-span-4 space-y-4">
                                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dimension Parameters</h4>
                                      <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div>
                                          <p className="text-slate-500 font-bold text-[9px] uppercase tracking-wider">Item Dims</p>
                                          <p className="font-mono text-white mt-0.5">{item.length_cm}x{item.width_cm}x{item.height_cm}cm</p>
                                        </div>
                                        <div>
                                          <p className="text-slate-500 font-bold text-[9px] uppercase tracking-wider">Box Dims</p>
                                          <p className="font-mono text-[#00FFD1] mt-0.5">{item.new_box_dims}</p>
                                        </div>
                                      </div>
                                      <div className="pt-2 border-t border-white/5 text-xs">
                                        <p className="text-slate-500 font-bold text-[9px] uppercase tracking-wider">Unit weight</p>
                                        <p className="font-mono text-white mt-0.5">{item.weight_kg} kg</p>
                                      </div>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-[#00FFD1]/5 border border-[#00FFD1]/20 space-y-3">
                                      <h4 className="text-[10px] font-black text-[#00FFD1] uppercase tracking-widest flex items-center gap-1">
                                        <Info className="w-3.5 h-3.5" /> AI Packaging Rationale
                                      </h4>
                                      <p className="text-xs text-[#00FFD1]/80 leading-relaxed">
                                        {item.recommendation_reason || 'Optimized fit ensures minimal empty space, reducing packaging material and shipping cost class by leveraging volumetric weight efficiency ratios.'}
                                      </p>
                                      <div className="pt-2 border-t border-[#00FFD1]/20 flex justify-between items-center text-[10px]">
                                        <span className="text-[#00FFD1]/60 uppercase font-black tracking-widest">Space Utilized</span>
                                        <span className="font-black text-[#00FFD1] text-xs font-mono">{100 - (item.void_percentage || 15)}%</span>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </AnimatePresence>
                      </>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          ) : (
            <motion.div
              key="unoptimized-pane"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="overflow-x-auto rounded-2xl border border-white/5 bg-[#0F0F16]/50 shadow-2xl"
            >
              <table className="w-full min-w-[800px] border-collapse text-left">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/10 text-[10px] font-black text-slate-400 tracking-wider uppercase">
                    <th className="p-4 pl-6">PRODUCT DETAILS</th>
                    <th className="p-4">BASELINE DIMS</th>
                    <th className="p-4">WEIGHT</th>
                    <th className="p-4">SHIP CLASS</th>
                    <th className="p-4">CLEAR DIAGNOSTIC DIAGNOSIS</th>
                    <th className="p-4 text-right pr-6">FIX ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUnoptimized.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16">
                        <EmptyState 
                          title="No Unoptimized Items" 
                          description={results.length === 0 ? "You have not run any optimizations yet. Upload a CSV under the Optimization tab to begin." : "Excellent! All items in this batch were successfully optimized."} 
                        />
                      </td>
                    </tr>
                  ) : filteredUnoptimized.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-4 pl-6">
                        <div className="font-bold text-xs text-white max-w-[220px] truncate">{item.product_name || 'Item'}</div>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">{item.sku}</div>
                      </td>
                      <td className="p-4 text-xs font-mono text-slate-500">
                        {item.length_cm && item.width_cm && item.height_cm 
                          ? `${item.length_cm}x${item.width_cm}x${item.height_cm}cm` 
                          : 'Missing or Invalid'}
                      </td>
                      <td className="p-4 text-xs text-slate-400 font-mono">
                        {item.weight_kg ? `${item.weight_kg} kg` : '—'}
                      </td>
                      <td className="p-4 text-xs text-slate-500 font-mono">
                        {item.zone || 'ZONE 2'}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-xs text-rose-400 font-medium">
                          <span className="p-1 rounded-md bg-rose-500/10 border border-rose-500/20">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                          </span>
                          <span>{item.failure_reason || 'Missing or invalid product dimensions. Please check source data.'}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <button 
                          onClick={() => window.location.href = `/dashboard/optimization`}
                          className="px-3 py-1.5 text-[9px] font-bold rounded-lg border border-white/10 hover:border-[#00FFD1]/30 hover:bg-white/5 text-slate-400 hover:text-white transition-all"
                        >
                          Re-Run Fit Check
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

// KPI Card Sub-Component
function KPICard({ color, title, value, subtitle, icon: Icon }: any) {
  return (
    <div className="glass p-6 rounded-3xl relative overflow-hidden group border border-white/5 hover:border-white/10 transition-all duration-300">
      <div 
        className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 group-hover:opacity-[0.06] transition-all duration-500"
        style={{ color }}
      >
        <Icon className="w-32 h-32" />
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <div 
          className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
          style={{ backgroundColor: color, color }}
        />
        <span className="text-[10px] font-black text-slate-400 tracking-widest">{title}</span>
      </div>

      <div className="text-3xl font-black tracking-tight text-white mb-1.5 font-mono">
        {value}
      </div>

      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
        {subtitle}
      </p>
    </div>
  );
}
