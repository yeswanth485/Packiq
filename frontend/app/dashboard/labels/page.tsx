 'use client';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client';
import EmptyState from '@/components/EmptyState'

export default function LabelsPage() {
  const supabase = createClient();
  const [shipments, setShipments] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [labelFormat, setLabelFormat] = useState('4x6');
  const [loading, setLoading] = useState(true);
  const [recipientDraft, setRecipientDraft] = useState<any>(null)

  useEffect(() => {
    if (!selected) return
    const key = 'recipient:' + selected.id
    try {
      const saved = localStorage.getItem(key)
      if (saved) setRecipientDraft(JSON.parse(saved))
      else setRecipientDraft(null)
    } catch (e) {
      setRecipientDraft(null)
    }
  }, [selected])
  const labelRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Load latest optimization's successful results
      const { data: latestSession } = await supabase
        .from('optimization_sessions')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!latestSession) { setLoading(false); return; }

      const { data: results } = await supabase
        .from('optimization_results')
        .select('*')
        .eq('session_id', (latestSession as any).id)
        .eq('user_id', user.id)
        .eq('is_optimized', true)
        .order('created_at', { ascending: true });

      const formatted = (results || []).map((r: any) => ({
        ...r,
        tracking_id: r.tracking_id || ('PKQ-' + r.sku + '-' + r.id.slice(0,6).toUpperCase()),
        zone: r.zone || 'ZONE 2',
        fragility_color_initial: r.fragility_level === 'High' ? '#ef4444' : r.fragility_level === 'Medium' ? '#f59e0b' : '#6366f1',
      }));

      setShipments(formatted);
      if (formatted.length > 0) setSelected(formatted[0]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = shipments.filter(s =>
    !search || 
    s.product_name?.toLowerCase().includes(search.toLowerCase()) || 
    s.sku?.toLowerCase().includes(search.toLowerCase()) ||
    s.tracking_id?.toLowerCase().includes(search.toLowerCase())
  );

  function printLabel() {
    const content = labelRef.current;
    if (!content) return;
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

  async function printBatch() {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    const labelsHTML = filtered.map(s => `
      <div style="border:1px solid #000;padding:12px;margin:6px;width:340px;display:inline-block;vertical-align:top;font-family:Arial;box-sizing:border-box;">
        <div style="font-size:18px;font-weight:900;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:8px;">
          ${s.carrier || 'STANDARD'} SHIPPING
        </div>
        <div style="font-size:10px;color:#666;">FROM</div>
        <div style="font-size:12px;font-weight:700;">${profile?.company_name || 'Your Company'}</div>
        <div style="font-size:10px;">${profile?.company_address || ''}, ${profile?.company_city || ''}</div>
        <div style="font-size:10px;margin-bottom:6px;">${profile?.company_state || ''} ${profile?.company_zip || ''}</div>
        <div style="font-size:10px;color:#666;">PRODUCT</div>
        <div style="font-size:12px;font-weight:700;">${s.product_name || s.sku}</div>
        <div style="font-size:10px;">SKU: ${s.sku} · Box: ${s.new_box_name}</div>
        <div style="font-size:10px;">${s.length_cm}×${s.width_cm}×${s.height_cm}cm · ${s.weight_kg}kg · ${s.zone}</div>
        <div style="font-size:11px;font-weight:700;margin-top:6px;letter-spacing:1px;"># ${s.tracking_id}</div>
        ${s.fragility_level === 'High' ? '<div style="color:red;font-weight:900;border:2px solid red;padding:4px;text-align:center;margin-top:6px;">⚠ FRAGILE — HANDLE WITH CARE</div>' : ''}
      </div>
    `).join('');
    win.document.write(`
      <!DOCTYPE html><html><head><title>Batch Labels</title>
      <style>body{margin:12px;font-family:Arial;}@media print{@page{margin:0.5cm}}</style>
      </head><body>
      <h2 style="margin-bottom:12px;">Batch Labels — ${filtered.length} items · ${new Date().toLocaleDateString()}</h2>
      ${labelsHTML}
      <script>window.onload=()=>{window.print();}</script></body></html>
    `);
    win.document.close();
  }

  if (loading) return <div style={{padding:40,textAlign:'center'}}>Loading labels...</div>;

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>Shipping Labels</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 13 }}>
            Generate and print carrier labels for {filtered.length} optimized shipments.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <select 
            value={labelFormat} onChange={e => setLabelFormat(e.target.value)}
            style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-primary)', fontSize: 13 }}
          >
            <option value="4x6">4×6" Thermal</option>
            <option value="letter">Letter (8.5×11")</option>
            <option value="a4">A4</option>
          </select>
          <button onClick={printBatch} style={{ 
            padding: '9px 18px', background: '#14b8a6', border: 'none', borderRadius: 8,
            color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6
          }}>
            🖨️ PRINT BATCH ({filtered.length})
          </button>
        </div>
      </div>

      {/* Main layout: list left, label right */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT: Shipment List */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <input 
            placeholder="Search tracking or SKU..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding: '9px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
                     borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, marginBottom: 10 }}
          />
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map(s => (
              <div 
                key={s.id}
                onClick={() => setSelected(s)}
                style={{ 
                  padding: '12px 14px', borderRadius: 10, marginBottom: 6, cursor: 'pointer',
                  border: selected?.id === s.id ? '1px solid rgba(20,184,166,0.5)' : '1px solid rgba(255,255,255,0.06)',
                  background: selected?.id === s.id ? 'rgba(20,184,166,0.08)' : 'var(--bg-elevated)',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{s.product_name || s.sku}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.sku}</div>
                  </div>
                  <div title={s.fragility_level + ' fragility'} style={{
                    width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', fontWeight: 900, fontSize: 14, color: '#fff',
                    background: s.fragility_color_initial,
                  }}>
                    {s.fragility_level === 'High' ? '⚠' : (s.product_name || s.sku).charAt(0).toUpperCase()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span>📦 {s.new_box_name}</span>
                  <span>📍 {s.zone}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Label Viewer */}
        <div style={{ overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!selected ? (
            <div style={{ flex: 1 }}>
              <EmptyState title={shipments.length === 0 ? 'No shipments' : 'Select a shipment'} description={shipments.length === 0 ? 'Run an optimization to create shipments ready for labels.' : 'Select a shipment on the left to preview and print labels.'} />
            </div>
          ) : (
            <>
              {/* Status bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>LABEL GENERATED</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  # {selected.tracking_id}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 16, flex: 1 }}>
                
                {/* Label Preview */}
                <div ref={labelRef} style={{
                  background: '#ffffff', color: '#000', borderRadius: 8, padding: 20,
                  fontFamily: 'Arial, sans-serif', border: '2px solid rgba(255,255,255,0.1)',
                  display: 'flex', flexDirection: 'column', gap: 10, minHeight: 500,
                }}>
                  {/* Carrier Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #000', paddingBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 900 }}>
                        {selected.carrier?.toUpperCase() || 'STANDARD'} SHIPPING
                      </div>
                      <div style={{ fontSize: 11, color: '#555' }}>
                        {selected.carrier === 'UPS' ? 'STANDARD OVERNIGHT' : 'GROUND DELIVERY'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12 }}>
                      <div style={{ color: '#555', fontSize: 10 }}>Date</div>
                      <div style={{ fontWeight: 700 }}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                  </div>

                  {/* From — REAL company data */}
                  <div style={{ borderBottom: '1px solid #ddd', paddingBottom: 10 }}>
                    <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 }}>FROM</div>
                    <div style={{ fontSize: 14, fontWeight: 900 }}>{profile?.company_name || 'Your Company Name'}</div>
                    <div style={{ fontSize: 11, color: '#333' }}>{profile?.company_address || 'Set your address in Settings → Company Profile'}</div>
                    <div style={{ fontSize: 11, color: '#333' }}>
                      {[profile?.company_city, profile?.company_state, profile?.company_zip].filter(Boolean).join(', ') || ''}
                    </div>
                    {profile?.company_phone && <div style={{ fontSize: 10, color: '#555' }}>{profile.company_phone}</div>}
                  </div>

                  {/* To — Configurable */}
                  <div style={{ borderBottom: '1px solid #ddd', paddingBottom: 10 }}>
                    <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', fontWeight: 700, marginBottom: 3 }}>TO</div>
                    <div style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase', color: '#000' }}>
                      [RECIPIENT NAME]
                    </div>
                    <div style={{ fontSize: 13, textTransform: 'uppercase', color: '#000' }}>
                      [DELIVERY ADDRESS]
                    </div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 4, fontStyle: 'italic' }}>
                      (Set recipient details in order management)
                    </div>
                  </div>

                  {/* Product Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, borderBottom: '1px solid #ddd', paddingBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', fontWeight: 700 }}>Product</div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{selected.product_name}</div>
                      <div style={{ fontSize: 10, color: '#555' }}>SKU: {selected.sku}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', fontWeight: 700 }}>Package</div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{selected.new_box_name}</div>
                      <div style={{ fontSize: 10, color: '#555' }}>{selected.new_box_dims}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: '#666', textTransform: 'uppercase', fontWeight: 700 }}>Weight / Zone</div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{selected.weight_kg}kg</div>
                      <div style={{ fontSize: 10, color: '#555' }}>{selected.zone}</div>
                    </div>
                  </div>

                  {/* Fragility Warning */}
                  {selected.fragility_level === 'High' && (
                    <div style={{ border: '2px solid #dc2626', borderRadius: 6, padding: '8px 14px', display: 'flex', gap: 10, background: '#fef2f2' }}>
                      <span style={{ fontSize: 22 }}>⚠️</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: '#dc2626' }}>FRAGILE — HANDLE WITH CARE</div>
                        <div style={{ fontSize: 10, color: '#dc2626' }}>Do not stack · Keep upright · Avoid moisture</div>
                      </div>
                    </div>
                  )}

                  {/* Barcode visual */}
                  <div style={{ display: 'flex', gap: 1.5, height: 48, padding: '0 8px' }}>
                    {Array.from({ length: 55 }, (_, i) => (
                      <div key={i} style={{
                        flex: 1, background: '#000',
                        opacity: (selected.tracking_id?.charCodeAt(i % selected.tracking_id.length) + i) % 3 === 0 ? 0 : 1,
                      }} />
                    ))}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 10, letterSpacing: 3, fontFamily: 'monospace' }}>
                    {selected.tracking_id}
                  </div>

                  {/* Footer */}
                  <div style={{ fontSize: 8, color: '#999', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: 6 }}>
                    Generated by PackIQ AI Packaging Optimizer · {new Date().toLocaleString()}
                  </div>
                </div>

                {/* Dispatch Details Panel */}
                <div style={{ 
                  background: 'var(--bg-elevated)', borderRadius: 10, padding: 16,
                  border: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto',
                  display: 'flex', flexDirection: 'column', gap: 16
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    DISPATCH DETAILS
                  </div>
                  {[
                    { label: 'Order Reference', value: selected.sku },
                    { label: 'Tracking ID', value: selected.tracking_id, mono: true },
                    { label: 'Carrier Service', value: selected.carrier || 'Standard' },
                    { label: 'Box', value: selected.new_box_name },
                    { label: 'Box Dims', value: selected.new_box_dims }
                  ].map((field: any, i: number) => (
                    <div key={i}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{field.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: field.mono ? 'monospace' : 'inherit' }}>
                        {field.value}
                      </div>
                    </div>
                  ))}

                  {/* Recipient editor */}
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>Recipient</div>
                    <input placeholder="Recipient name" value={recipientDraft?.name || selected.recipient_name || ''} onChange={e => setRecipientDraft((d: any) => ({ ...(d||{}), name: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-default)', marginBottom: 8 }} />
                    <input placeholder="Address" value={recipientDraft?.address || selected.recipient_address || ''} onChange={e => setRecipientDraft((d: any) => ({ ...(d||{}), address: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-default)', marginBottom: 8 }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input placeholder="City" value={recipientDraft?.city || selected.recipient_city || ''} onChange={e => setRecipientDraft((d: any) => ({ ...(d||{}), city: e.target.value }))} style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-default)' }} />
                      <input placeholder="State / ZIP" value={recipientDraft?.state || selected.recipient_state || ''} onChange={e => setRecipientDraft((d: any) => ({ ...(d||{}), state: e.target.value }))} style={{ flex: 1, padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-default)' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={async () => {
                        const draft = recipientDraft || {};
                        // attempt to persist to optimization_results; if columns don't exist, ignore
                        try {
                          await supabase.from('optimization_results').update({
                            recipient_name: draft.name || null,
                            recipient_address: draft.address || null,
                            recipient_city: draft.city || null,
                            recipient_state: draft.state || null,
                          } as any).eq('id', selected.id)
                          // persist to localStorage as fallback
                          localStorage.setItem('recipient:' + selected.id, JSON.stringify(draft))
                          toast.success('Recipient saved')
                        } catch (err) {
                          localStorage.setItem('recipient:' + selected.id, JSON.stringify(draft))
                          toast.success('Saved locally (schema may not support server persistence)')
                        }
                      }} style={{ padding: '8px 12px', background: '#14b8a6', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 700 }}>Save Recipient</button>
                      <button onClick={() => { setRecipientDraft(null); localStorage.removeItem('recipient:' + selected.id); toast.success('Cleared') }} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.06)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>Clear</button>
                    </div>
                  </div>

                  <button onClick={printLabel} style={{
                    marginTop: 'auto', padding: '10px', background: '#14b8a6', color: '#fff',
                    border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer'
                  }}>
                    🖨️ Print Label
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
