'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import EmptyState from '@/components/EmptyState';
import BoxWithLabel from '@/components/3d/BoxWithLabel';
import { 
  Search, Printer, Truck, RefreshCw, CheckCircle2, 
  Info, MapPin, User, ShoppingBag, ArrowLeftRight 
} from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [recipientDraft, setRecipientDraft] = useState<any>(null);
  const [selectedBrand, setSelectedBrand] = useState(BRANDS[0]);

  // Load recipient draft from local storage when selection changes
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
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        // Load company profile (FROM address)
        const { data: profileData } = await supabase
          .from('profiles')
          .select('company_name, company_address, company_city, company_state, company_zip, company_phone, company_email')
          .eq('id', user.id)
          .single();
        
        setProfile(profileData);

        // Fetch upload sessions to narrow down to latest batch
        const resSessions = await fetch('/api/dashboard-data?type=sessions');
        let sessionList = [];
        if (resSessions.ok) {
          const json = await resSessions.json();
          sessionList = json.data || [];
        }
        
        const latestSession = sessionList[0];
        
        // Fetch results for the latest batch, or fetch all if none exists
        let resultsUrl = '/api/dashboard-data?type=results';
        // We only narrow to latest session if it's explicitly available,
        // otherwise let it fetch all results so the page isn't empty.
        if (latestSession && latestSession.id) {
          resultsUrl += `&session_id=${latestSession.id}`;
        }

        const resResults = await fetch(resultsUrl);
        if (!resResults.ok) throw new Error('Failed to fetch results');
        const { data: results } = await resResults.json();

        // Format and set shipments
        const formatted = (results || []).map((r: any) => ({
          ...r,
          tracking_id: r.tracking_id || ('PKQ-' + (r.sku || '').toUpperCase() + '-' + r.id.slice(0, 6).toUpperCase()),
          zone: r.zone || 'ZONE 2',
          fragility_color_initial: r.fragility_level === 'High' ? '#ef4444' : r.fragility_level === 'Medium' ? '#f59e0b' : '#14b8a6',
        }));

        setShipments(formatted);
        
        // Preselect result if result_id is in URL
        const params = new URLSearchParams(window.location.search);
        const resultId = params.get('result_id');
        
        if (resultId) {
          const found = formatted.find((f: any) => f.id === resultId || f.optimization_result_id === resultId);
          if (found) {
            setSelected(found);
          } else if (formatted.length > 0) {
            setSelected(formatted[0]);
          }
        } else if (formatted.length > 0) {
          setSelected(formatted[0]);
        }
      } catch (err) {
        console.error('Labels initialization error:', err);
        toast.error('Failed to initialize shipping station');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [supabase]);

  // Handle instant recipient address draft changes
  const updateDraft = (fields: any) => {
    if (!selected) return;
    const newDraft = { ...(recipientDraft || {}), ...fields };
    setRecipientDraft(newDraft);
    const key = 'recipient:' + selected.id;
    localStorage.setItem(key, JSON.stringify(newDraft));
  };

  const filtered = shipments.filter(s =>
    !search ||
    s.product_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.sku?.toLowerCase().includes(search.toLowerCase()) ||
    s.tracking_id?.toLowerCase().includes(search.toLowerCase())
  );

  // Dynamic cost calculation based on optimized box dimensions
  const getCalculatedCost = () => {
    if (!selected) return 0;
    const l = selected.new_box_length_cm || selected.length_cm || 20;
    const w = selected.new_box_width_cm || selected.width_cm || 15;
    const h = selected.new_box_height_cm || selected.height_cm || 10;
    const volWeight = (l * w * h) / 5000;
    const billableWeight = Math.max(selected.weight_kg, volWeight);
    return selectedBrand.baseRate + (billableWeight * selectedBrand.multiplier);
  };

  const getLabelDataFor3D = () => {
    if (!selected) return {};
    return {
      product_id: selected.id,
      product_name: selected.product_name,
      product_weight: selected.weight_kg,
      optimized_box_dims: selected.new_box_dims || 'Not specified',
      length: selected.new_box_length_cm || selected.length_cm || 20,
      width: selected.new_box_width_cm || selected.width_cm || 15,
      height: selected.new_box_height_cm || selected.height_cm || 10,
      trackingNumber: selected.tracking_id,
      carrier: { name: selectedBrand.name },
      shippingAddress: {
        name: recipientDraft?.name ?? selected.recipient_name ?? 'VALUED CUSTOMER',
        line1: recipientDraft?.address ?? selected.recipient_address ?? '123 DEMO STREET',
        line2: `${recipientDraft?.city ?? selected.recipient_city ?? 'CITY'}, ${recipientDraft?.state ?? selected.recipient_state ?? 'ST'} 00000`
      }
    };
  };

  async function printLabel() {
    if (!selected) return;
    const content = labelRef.current;
    if (!content) return;

    // Save final state to Supabase
    const draft = recipientDraft || {};
    try {
      await (supabase as any).from('optimization_results').update({
        recipient_name: draft.name || null,
        recipient_address: draft.address || null,
        recipient_city: draft.city || null,
        recipient_state: draft.state || null,
        carrier: selectedBrand.name
      }).eq('id', selected.id);
      
      toast.success('Recipient information updated on manifest');
    } catch (err) {
      console.error('Failed to update recipient on DB:', err);
    }

    const win = window.open('', '_blank', 'width=500,height=700');
    if (!win) {
      toast.error('Pop-up blocked. Please allow popups to print shipping labels.');
      return;
    }
    
    win.document.write(`
      <!DOCTYPE html><html><head><title>PackIQ Label - ${selected.sku}</title>
      <style>
        body { margin: 0; padding: 16px; font-family: Arial, sans-serif; background: #fff; color: #000; }
        @media print {
          @page { size: 4in 6in; margin: 0.1in; }
          body { padding: 0; }
        }
      </style>
      </head><body>
      ${content.innerHTML}
      <script>
        window.onload = () => {
          window.print();
          setTimeout(() => window.close(), 100);
        }
      </script>
      </body></html>
    `);
    win.document.close();
  }

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-sm text-[#00FFD1] animate-pulse flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="w-8 h-8 animate-spin" />
        Syncing 3D label printing hardware...
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 pb-20 text-white min-h-screen">
      
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#00FFD1] to-blue-500 tracking-tight flex items-center gap-3">
          <Truck className="w-8 h-8 text-[#00FFD1]" /> Shipping Labels
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          Select carrier, customize recipient parameters, and generate compliant high-fidelity 3D shipping labels.
        </p>
      </div>

      {shipments.length === 0 ? (
        <div className="glass p-12 rounded-3xl">
          <EmptyState 
            title="No Optimized Orders Yet" 
            description="You need to optimize your CSV rows under the Optimization tab before generating shipping labels."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
          
          {/* LEFT COLUMN: Carrier & Shipment selectors */}
          <div className="flex flex-col gap-4">
            
            {/* Carrier select panel */}
            <div className="glass p-5 rounded-3xl space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#00FFD1]" /> 1. SELECT CARRIER
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {BRANDS.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBrand(b)}
                    className={`p-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black transition-all border ${
                      selectedBrand.id === b.id 
                        ? 'bg-[#00FFD1]/10 border-[#00FFD1] text-white shadow-[0_0_15px_rgba(0,255,209,0.2)]' 
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/[0.05] hover:text-white'
                    }`}
                  >
                    <span className="text-base">{b.logo}</span>
                    {b.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Shipment select panel */}
            <div className="glass p-5 rounded-3xl flex flex-col min-h-[450px] max-h-[600px]">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-[#00FFD1]" /> 2. SELECT SHIPMENT ({filtered.length})
              </h3>
              
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  placeholder="Search tracking or SKU..."
                  value={search} 
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white/[0.02] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FFD1] focus:ring-1 focus:ring-[#00FFD1] transition-all"
                />
              </div>

              <div className="overflow-y-auto flex-1 pr-1 space-y-2 custom-scrollbar">
                {filtered.map(s => {
                  const isSelected = selected?.id === s.id;
                  return (
                    <div 
                      key={s.id}
                      onClick={() => setSelected(s)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border ${
                        isSelected 
                          ? 'bg-[#00FFD1]/10 border-[#00FFD1] shadow-[0_0_12px_rgba(0,255,209,0.1)]' 
                          : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05] hover:border-white/5'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <div className="font-bold text-xs text-white truncate">{s.product_name || s.sku}</div>
                        <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: s.fragility_color_initial }} />
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mb-2">{s.tracking_id}</div>
                      <div className="flex gap-2 text-[9px] font-mono font-bold">
                        <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[#00FFD1] truncate max-w-[120px]">
                          📦 {s.new_box_name || 'Standard'}
                        </span>
                        <span className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-slate-400 shrink-0">
                          {s.zone}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Interactive 3D Label viewport & customization panel */}
          <div className="glass rounded-3xl overflow-hidden min-h-[600px] flex flex-col">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center p-12">
                <EmptyState title="Select a Shipment" description="Choose an optimized item on the left panel to render its realistic 3D label." />
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] divide-y xl:divide-y-0 xl:divide-x divide-white/10 h-full flex-1">
                
                {/* 3D Render Screen */}
                <div className="relative bg-[#07070B] p-6 flex flex-col justify-between h-[450px] xl:h-auto min-h-[400px]">
                  
                  {/* Overlay Info Badges */}
                  <div className="z-10 flex flex-col gap-1.5 self-start">
                    <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded border border-[#00FFD1]/30 text-[9px] font-black uppercase tracking-widest text-[#00FFD1] shadow-lg w-fit">
                      Interactive 3D Preview
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest px-1">
                      Drag to rotate box • Scroll to zoom
                    </div>
                  </div>

                  {/* 3D Component */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BoxWithLabel labelData={getLabelDataFor3D()} />
                  </div>

                  {/* Dimension overlay HUD */}
                  <div className="z-10 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/5 text-[10px] font-mono text-slate-400 self-start shadow-xl">
                    <span className="text-[#00FFD1] font-bold">BOX: </span>
                    {selected.new_box_name || 'Optimal'} ({selected.new_box_dims || 'Not specified'})
                  </div>

                  {/* HIDDEN PRINT TARGET (renders offscreen, styled specifically for e-commerce print requirements) */}
                  <div className="hidden">
                    <div ref={labelRef} style={{ background: '#ffffff', color: '#000000', padding: '24px', width: '384px', height: '576px', boxSizing: 'border-box', position: 'relative', border: '4px solid #000000' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '4px solid #000000', paddingBottom: '12px', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.05em', textTransform: 'uppercase' }}>{selectedBrand.name}</div>
                          <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '2px' }}>STANDARD OVERNIGHT</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '28px', fontWeight: 900 }}>{new Date().getDate()}</div>
                          <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>{new Date().toLocaleString('default', { month: 'short' })}</div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '2px' }}>{profile?.company_name || 'PackIQ Logistics Center'}</div>
                        <div style={{ fontSize: '10px', color: '#333333' }}>{profile?.company_address || '123 Innovation Way'}</div>
                        <div style={{ fontSize: '10px', color: '#333333' }}>{`${profile?.company_city || 'San Francisco'}, ${profile?.company_state || 'CA'} ${profile?.company_zip || '94105'}`}</div>
                      </div>

                      <div style={{ borderLeft: '4px solid #000000', paddingLeft: '12px', marginBottom: '20px' }}>
                        <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#555555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>To</div>
                        <div style={{ fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', marginTop: '2px', lineHeight: 1.2 }}>
                          {recipientDraft?.name ?? selected.recipient_name ?? 'VALUED CUSTOMER'}
                        </div>
                        <div style={{ fontSize: '12px', textTransform: 'uppercase', marginTop: '4px', fontWeight: 'bold' }}>
                          {recipientDraft?.address ?? selected.recipient_address ?? '123 DEMO STREET'}
                        </div>
                        <div style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                          {`${recipientDraft?.city ?? selected.recipient_city ?? 'CITY'}, ${recipientDraft?.state ?? selected.recipient_state ?? 'ST'} 00000`}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '3px solid #000000', borderBottom: '3px solid #000000', padding: '10px 0', marginBottom: '20px' }}>
                        <div>
                          <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#555555', textTransform: 'uppercase' }}>Weight</div>
                          <div style={{ fontSize: '12px', fontWeight: 900 }}>{((selected.weight_kg || 0.5) * 2.2).toFixed(1)} LBS ({selected.weight_kg} KG)</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#555555', textTransform: 'uppercase' }}>Box Dims</div>
                          <div style={{ fontSize: '12px', fontWeight: 900 }}>{selected.new_box_dims || 'Not specified'}</div>
                        </div>
                      </div>

                      {/* Printable Barcodes */}
                      <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div style={{ border: '2px solid #000000', padding: '6px', textAlign: 'center' }}>
                          <div style={{ width: '70px', height: '70px', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ color: '#fff', fontSize: '9px', fontWeight: 'bold' }}>QR SCAN</div>
                          </div>
                          <div style={{ fontSize: '8px', fontWeight: 'bold', marginTop: '4px' }}>VERIFY</div>
                        </div>
                        <div style={{ flex: 1, marginLeft: '20px', textAlign: 'center' }}>
                          <div style={{ height: '54px', width: '100%', background: 'repeating-linear-gradient(90deg, #000, #000 3px, #fff 3px, #fff 7px)', border: '1px solid #000' }}></div>
                          <div style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '2px', marginTop: '6px', fontFamily: 'monospace' }}>{selected.tracking_id}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right side configuration parameters */}
                <div className="p-6 flex flex-col justify-between gap-6 bg-white/[0.01]">
                  
                  {/* Pricing HUD */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-[#00FFD1]" /> CALCULATION STATION
                    </h4>
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">Carrier Base</span>
                        <span className="text-white font-mono font-bold">₹{(selectedBrand.baseRate * 84).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-medium">Dimensional Weight</span>
                        <span className="text-white font-mono">
                          {(((selected.new_box_length_cm || selected.length_cm || 20) * 
                             (selected.new_box_width_cm || selected.width_cm || 15) * 
                             (selected.new_box_height_cm || selected.height_cm || 10)) / 5000).toFixed(2)} kg
                        </span>
                      </div>
                      <div className="border-t border-white/5 pt-2 flex justify-between items-center mt-1">
                        <span className="text-xs font-black text-slate-300">TOTAL LABEL COST</span>
                        <span className="text-lg font-black text-emerald-400 font-mono">
                          ₹{(getCalculatedCost() * 84).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recipient customizer */}
                  <div className="flex-1 space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#00FFD1]" /> RECIPIENT INFORMATION
                    </h4>
                    <div className="space-y-3">
                      
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                          placeholder="Recipient Name" 
                          value={recipientDraft?.name ?? selected.recipient_name ?? ''} 
                          onChange={e => updateDraft({ name: e.target.value })} 
                          className="w-full pl-9 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FFD1] focus:ring-1 focus:ring-[#00FFD1] transition-all" 
                        />
                      </div>

                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input 
                          placeholder="Street Address" 
                          value={recipientDraft?.address ?? selected.recipient_address ?? ''} 
                          onChange={e => updateDraft({ address: e.target.value })} 
                          className="w-full pl-9 pr-4 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FFD1] focus:ring-1 focus:ring-[#00FFD1] transition-all" 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          placeholder="City" 
                          value={recipientDraft?.city ?? selected.recipient_city ?? ''} 
                          onChange={e => updateDraft({ city: e.target.value })} 
                          className="px-3.5 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FFD1] focus:ring-1 focus:ring-[#00FFD1] transition-all" 
                        />
                        <input 
                          placeholder="State" 
                          value={recipientDraft?.state ?? selected.recipient_state ?? ''} 
                          onChange={e => updateDraft({ state: e.target.value })} 
                          className="px-3.5 py-2.5 bg-white/[0.02] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00FFD1] focus:ring-1 focus:ring-[#00FFD1] transition-all" 
                        />
                      </div>

                    </div>
                  </div>

                  {/* Print dispatch button */}
                  <button 
                    onClick={printLabel} 
                    className="w-full py-4 bg-gradient-to-r from-[#00FFD1] to-blue-500 hover:from-[#00b392] hover:to-blue-400 text-slate-950 font-black rounded-2xl shadow-[0_0_20px_rgba(0,255,209,0.2)] hover:shadow-[0_0_30px_rgba(0,255,209,0.4)] transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 text-xs uppercase tracking-widest shrink-0"
                  >
                    <Printer className="w-4 h-4 text-slate-950" /> PRINT COMPLIANT LABEL
                  </button>

                </div>

              </div>
            )}
          </div>

        </div>
      )}
      
    </div>
  );
}
