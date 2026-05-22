'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client';
import EmptyState from '@/components/EmptyState';
import BoxWithLabel from '@/components/3d/BoxWithLabel';
import { QRCodeSVG } from 'qrcode.react';

const BRANDS = [
  { id: 'fedex', name: 'FedEx', logo: '🟣', baseRate: 8.50, multiplier: 1.2 },
  { id: 'ups', name: 'UPS', logo: '🟤', baseRate: 9.00, multiplier: 1.15 },
  { id: 'amazon', name: 'Amazon Logistics', logo: '🟠', baseRate: 6.00, multiplier: 1.05 },
  { id: 'shopify', name: 'Shopify Shipping', logo: '🟢', baseRate: 7.50, multiplier: 1.1 }
];

export default function LabelsPage() {
  const supabase = useMemo(() => createClient(), []);
  const [shipments, setShipments] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [labelFormat, setLabelFormat] = useState('4x6');
  const [loading, setLoading] = useState(true);
  const [recipientDraft, setRecipientDraft] = useState<any>(null);
  const [selectedBrand, setSelectedBrand] = useState(BRANDS[0]);
  const [previewMode, setPreviewMode] = useState<'3d' | 'flat'>('3d');

  useEffect(() => {
    if (!selected) return;
    const key = 'recipient:' + selected.id;
    try {
      const saved = localStorage.getItem(key);
      if (saved) setRecipientDraft(JSON.parse(saved));
      else setRecipientDraft(null);
    } catch (e) {
      setRecipientDraft(null);
    }
  }, [selected]);
  
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      // Load company profile (FROM address)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('company_name, company_address, company_city, company_state, company_zip, company_phone, company_email')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData);

      try {
        const resSessions = await fetch('/api/dashboard-data?type=sessions');
        if (!resSessions.ok) throw new Error('Failed to fetch sessions');
        const { data: sessionList } = await resSessions.json();
        
        const latestSession = (sessionList || [])[0];
        if (!latestSession) { setLoading(false); return; }

        const resResults = await fetch(`/api/dashboard-data?type=results&session_id=${latestSession.id}`);
        if (!resResults.ok) throw new Error('Failed to fetch results');
        const { data: results } = await resResults.json();

      const formatted = (results || [])
        .filter((r: any) => r.is_optimized)
        .map((r: any) => ({
          ...r,
          tracking_id: r.tracking_id || ('PKQ-' + r.sku + '-' + r.id.slice(0,6).toUpperCase()),
          zone: r.zone || 'ZONE 2',
          fragility_color_initial: r.fragility_level === 'High' ? '#ef4444' : r.fragility_level === 'Medium' ? '#f59e0b' : '#14b8a6',
        }));

      setShipments(formatted);
      
      // Preselect result if result_id present in URL, or default to first
      const params = new URLSearchParams(window.location.search);
      const resultId = params.get('result_id');
      if (resultId) {
        const found = formatted.find((f: any) => f.id === resultId || f.optimization_result_id === resultId);
        if (found) {
          setSelected(found);
        } else {
          if (formatted.length > 0) {
            setSelected(formatted[0]);
          }
        }
      } else {
        if (formatted.length > 0) setSelected(formatted[0]);
      }
      } catch (err) {
        console.error('Labels error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  const filtered = shipments.filter(s =>
    !search ||
    s.product_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.sku?.toLowerCase().includes(search.toLowerCase()) ||
    s.tracking_id?.toLowerCase().includes(search.toLowerCase())
  );

  // Dynamic cost calculation
  const getCalculatedCost = () => {
    if (!selected) return 0;
    const volWeight = (selected.length_cm * selected.width_cm * selected.height_cm) / 5000;
    const billableWeight = Math.max(selected.weight_kg, volWeight);
    return selectedBrand.baseRate + (billableWeight * selectedBrand.multiplier);
  };

  const getLabelDataFor3D = () => {
    if (!selected) return {};
    return {
      product_id: selected.id,
      product_name: selected.product_name,
      product_weight: selected.weight_kg,
      optimized_box_dims: selected.new_box_dims,
      trackingNumber: selected.tracking_id,
      carrier: { name: selectedBrand.name },
      shippingAddress: {
        name: recipientDraft?.name || selected.recipient_name || 'VALUED CUSTOMER',
        line1: recipientDraft?.address || selected.recipient_address || '123 DEMO STREET',
        line2: `${recipientDraft?.city || selected.recipient_city || 'CITY'}, ${recipientDraft?.state || selected.recipient_state || 'ST'} 00000`
      }
    };
  };

  async function printLabel() {
    const content = labelRef.current;
    if (!content) return;

    // Persist draft
    const draft = recipientDraft || {};
    try {
      await (supabase as any).from('optimization_results').update({
        recipient_name: draft.name || null,
        recipient_address: draft.address || null,
        recipient_city: draft.city || null,
        recipient_state: draft.state || null,
        carrier: selectedBrand.name
      }).eq('id', selected.id);
    } catch (err) {}

    const win = window.open('', '_blank', 'width=500,height=700');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head><title>PackIQ Label</title>
      <style>body{margin:0;padding:16px;font-family:Arial,sans-serif;}@media print{@page{size:4in 6in;margin:0.2in}}</style>
      </head><body>${content.innerHTML}
      <script>window.onload=()=>{window.print();}</script></body></html>
    `);
    win.document.close();
  }

  if (loading) return <div className="p-10 text-center text-[#00FFD1] font-mono animate-pulse">Initializing Print Station...</div>;

  return (
    <div className="p-8 h-[calc(100vh-60px)] flex flex-col text-white bg-transparent">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="m-0 text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#00FFD1] to-emerald-500 tracking-tight">
            Shipping Labels
          </h1>
          <p className="mt-1 text-emerald-200/60 text-sm">
            Generate and print realistic e-commerce carrier labels for {filtered.length} optimized shipments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 flex-1 min-h-0">
        
        {/* LEFT PANEL: Shipments & Brands */}
        <div className="flex flex-col gap-4 overflow-hidden">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">1. Select Carrier</h3>
            <div className="grid grid-cols-2 gap-2">
              {BRANDS.map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBrand(b)}
                  className={`p-2 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all border ${selectedBrand.id === b.id ? 'bg-[#00FFD1]/20 border-[#00FFD1] text-white shadow-[0_0_15px_rgba(0,255,209,0.3)]' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                >
                  <span className="text-lg">{b.logo}</span>
                  {b.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 flex flex-col min-h-0 shadow-xl">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">2. Select Shipment</h3>
            <input 
              placeholder="Search tracking or SKU..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-[#00FFD1] focus:outline-none mb-3 text-sm"
            />
            <div className="overflow-y-auto flex-1 pr-2 space-y-2 custom-scrollbar">
              {filtered.map(s => (
                <div 
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className={`p-3 rounded-xl cursor-pointer transition-all border ${selected?.id === s.id ? 'bg-[#00FFD1]/10 border-[#00FFD1] shadow-[0_0_10px_rgba(0,255,209,0.1)]' : 'bg-slate-800/50 border-transparent hover:bg-slate-800'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-bold text-sm text-white truncate pr-2">{s.product_name || s.sku}</div>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5`} style={{ background: s.fragility_color_initial }} />
                  </div>
                  <div className="text-xs text-slate-500 mb-2">{s.tracking_id}</div>
                  <div className="flex gap-2 text-[10px] font-mono font-bold">
                    <span className="px-2 py-0.5 bg-slate-700 rounded text-[#00FFD1]">📦 {s.new_box_name}</span>
                    <span className="px-2 py-0.5 bg-slate-700 rounded text-slate-300">{s.zone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Preview & Print */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState title="Select a shipment" description="Choose a shipment on the left to preview the realistic 3D label." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] h-full">
              
              {/* Realistic Preview */}
              <div className="relative border-r border-slate-700/50 bg-[#0a0f18] flex flex-col h-full min-h-[400px]">
                <div className="absolute top-4 left-4 z-10">
                  <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-xs font-bold text-[#00FFD1] shadow-lg mb-1">
                    {previewMode === '3d' ? '3D Box Model Preview' : 'Flat Printed Label Preview'}
                  </div>
                  {previewMode === '3d' && (
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest px-1">
                      Drag to rotate • Scroll to zoom
                    </div>
                  )}
                </div>

                {/* 3D vs Flat Toggle */}
                <div className="absolute top-4 right-4 z-10 flex p-1 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 gap-1">
                  <button
                    onClick={() => setPreviewMode('3d')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${previewMode === '3d' ? 'bg-[#00FFD1] text-slate-900 shadow-[0_0_10px_rgba(0,255,209,0.3)] font-black' : 'text-slate-400 hover:text-white'}`}
                  >
                    3D Box
                  </button>
                  <button
                    onClick={() => setPreviewMode('flat')}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${previewMode === 'flat' ? 'bg-[#00FFD1] text-slate-900 shadow-[0_0_10px_rgba(0,255,209,0.3)] font-black' : 'text-slate-400 hover:text-white'}`}
                  >
                    Flat Label
                  </button>
                </div>
                
                {/* Visualizer content area */}
                <div className="flex-1 w-full h-full min-h-0 relative flex items-center justify-center">
                  {previewMode === '3d' ? (
                    <BoxWithLabel labelData={getLabelDataFor3D()} />
                  ) : (
                    <div className="p-6 w-full h-full flex items-center justify-center bg-slate-950/40">
                      <div className="bg-white text-black p-6 rounded-xl shadow-2xl w-[320px] aspect-[4/6] flex flex-col justify-between relative border border-slate-200">
                        <div>
                          <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-3">
                            <div>
                              <h2 className="text-xl font-black uppercase tracking-tighter leading-none">{selectedBrand.name}</h2>
                              <p className="text-[9px] font-bold mt-1">STANDARD OVERNIGHT</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-black leading-none">{new Date().getDate()}</p>
                              <p className="text-[9px] font-bold uppercase">{new Date().toLocaleString('default', { month: 'short' })}</p>
                            </div>
                          </div>

                          <div className="space-y-3 mb-4 text-left">
                            <div>
                              <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">From</p>
                              <p className="text-[10px] font-semibold leading-tight">
                                {profile?.company_name || 'PackIQ Logistics Center'}<br/>
                                {profile?.company_address || '123 Innovation Way'}<br/>
                                San Francisco, CA 94105
                              </p>
                            </div>
                            <div className="border-l-2 border-black pl-3">
                              <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">To</p>
                              <p className="text-xs font-black uppercase leading-tight">
                                {recipientDraft?.name || selected.recipient_name || 'VALUED CUSTOMER'}<br/>
                                {recipientDraft?.address || selected.recipient_address || '123 DEMO STREET'}<br/>
                                {`${recipientDraft?.city || selected.recipient_city || 'CITY'}, ${recipientDraft?.state || selected.recipient_state || 'ST'} 00000`}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 border-y-2 border-black py-2 mb-4">
                            <div>
                              <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Weight</p>
                              <p className="text-xs font-black">
                                {((selected.weight_kg || 0.5) * 2.2).toFixed(1)} LBS
                              </p>
                            </div>
                            <div>
                              <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Dimensions</p>
                              <p className="text-xs font-black uppercase tracking-tighter">{selected.new_box_dims}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-end justify-between mt-auto">
                          <div className="space-y-1">
                            <div className="w-16 h-16 border-2 border-black flex items-center justify-center p-1">
                              <QRCodeSVG 
                                value={`https://packiq.vercel.app/track/${selected.id}`}
                                size={56}
                                bgColor={"#ffffff"}
                                fgColor={"#000000"}
                                level={"Q"}
                              />
                            </div>
                            <p className="text-[7px] font-mono text-center font-bold">SCAN</p>
                          </div>
                          
                          <div className="flex-1 ml-4 h-16 flex flex-col justify-end">
                            <div className="w-full h-8 bg-black repeating-barcode-bg" style={{ background: 'repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px)' }} />
                            <p className="text-[9px] font-mono text-center font-bold mt-1 tracking-[0.1em] truncate">
                              {selected.tracking_id}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hidden Printable Label (just for window.print rendering) */}
                <div className="hidden">
                  <div ref={labelRef} style={{ background: '#ffffff', color: '#000', padding: 20, width: 400, height: 600, boxSizing: 'border-box', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #000', paddingBottom: 10, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 24, fontWeight: 900, textTransform: 'uppercase' }}>{selectedBrand.name}</div>
                        <div style={{ fontSize: 12, fontWeight: 'bold' }}>STANDARD OVERNIGHT</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 28, fontWeight: 900 }}>{new Date().getDate()}</div>
                        <div style={{ fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' }}>{new Date().toLocaleString('default', { month: 'short' })}</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 15 }}>
                      <div style={{ fontSize: 10, fontWeight: 'bold', color: '#555', textTransform: 'uppercase' }}>From</div>
                      <div style={{ fontSize: 14, fontWeight: 'bold' }}>{profile?.company_name || 'PackIQ Logistics'}</div>
                      <div style={{ fontSize: 12 }}>{profile?.company_address || '123 Innovation Way'}</div>
                      <div style={{ fontSize: 12 }}>San Francisco, CA 94105</div>
                    </div>

                    <div style={{ borderLeft: '3px solid #000', paddingLeft: 10, marginBottom: 20 }}>
                      <div style={{ fontSize: 10, fontWeight: 'bold', color: '#555', textTransform: 'uppercase' }}>To</div>
                      <div style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase' }}>{recipientDraft?.name || selected.recipient_name || 'VALUED CUSTOMER'}</div>
                      <div style={{ fontSize: 14, textTransform: 'uppercase' }}>{recipientDraft?.address || selected.recipient_address || '123 DEMO STREET'}</div>
                      <div style={{ fontSize: 14, textTransform: 'uppercase' }}>{`${recipientDraft?.city || selected.recipient_city || 'CITY'}, ${recipientDraft?.state || selected.recipient_state || 'ST'} 00000`}</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '10px 0', marginBottom: 20 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 'bold', color: '#555', textTransform: 'uppercase' }}>Weight</div>
                        <div style={{ fontSize: 14, fontWeight: 900 }}>{((selected.weight_kg || 0.5) * 2.2).toFixed(1)} LBS</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, fontWeight: 'bold', color: '#555', textTransform: 'uppercase' }}>Dimensions</div>
                        <div style={{ fontSize: 14, fontWeight: 900 }}>{selected.new_box_dims}</div>
                      </div>
                    </div>

                    <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div style={{ border: '2px solid #000', padding: 5, textAlign: 'center' }}>
                        <div style={{ width: 80, height: 80, background: '#000' }}></div>
                        <div style={{ fontSize: 10, fontWeight: 'bold', marginTop: 5 }}>SCAN</div>
                      </div>
                      <div style={{ flex: 1, marginLeft: 20, textAlign: 'center' }}>
                        <div style={{ height: 60, width: '100%', background: 'repeating-linear-gradient(90deg, #000, #000 3px, #fff 3px, #fff 6px)' }}></div>
                        <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 2, marginTop: 5 }}>{selected.tracking_id}</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Sidebar Action Panel */}
              <div className="p-5 flex flex-col gap-6 bg-slate-900/40">
                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Label Cost Calculation</h4>
                  <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl">
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-400">Carrier Base</span>
                      <span className="text-white font-mono">₹{selectedBrand.baseRate.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs mb-3">
                      <span className="text-slate-400">Volumetric Weight</span>
                      <span className="text-white font-mono">{((selected.length_cm * selected.width_cm * selected.height_cm) / 5000).toFixed(2)}kg</span>
                    </div>
                    <div className="border-t border-slate-700 pt-3 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-300">Total Label Cost</span>
                      <span className="text-xl font-black text-emerald-400">₹{getCalculatedCost().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Recipient Details</h4>
                  <div className="space-y-3">
                    <input 
                      placeholder="Recipient Name" 
                      value={recipientDraft?.name || selected.recipient_name || ''} 
                      onChange={e => setRecipientDraft((d: any) => ({ ...(d||{}), name: e.target.value }))} 
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:border-[#00FFD1] focus:outline-none" 
                    />
                    <input 
                      placeholder="Street Address" 
                      value={recipientDraft?.address || selected.recipient_address || ''} 
                      onChange={e => setRecipientDraft((d: any) => ({ ...(d||{}), address: e.target.value }))} 
                      className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:border-[#00FFD1] focus:outline-none" 
                    />
                    <div className="flex gap-2">
                      <input 
                        placeholder="City" 
                        value={recipientDraft?.city || selected.recipient_city || ''} 
                        onChange={e => setRecipientDraft((d: any) => ({ ...(d||{}), city: e.target.value }))} 
                        className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:border-[#00FFD1] focus:outline-none w-1/2" 
                      />
                      <input 
                        placeholder="State" 
                        value={recipientDraft?.state || selected.recipient_state || ''} 
                        onChange={e => setRecipientDraft((d: any) => ({ ...(d||{}), state: e.target.value }))} 
                        className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:border-[#00FFD1] focus:outline-none w-1/2" 
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={printLabel} 
                  className="w-full py-4 bg-gradient-to-r from-[#00FFD1] to-emerald-500 hover:from-[#00b392] hover:to-emerald-400 text-slate-900 font-black rounded-xl shadow-[0_0_20px_rgba(0,255,209,0.3)] transform hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-xl">🖨️</span> PRINT LABEL
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
