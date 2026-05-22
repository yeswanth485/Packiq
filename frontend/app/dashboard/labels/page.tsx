'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Printer, Package, Truck, Search, CheckCircle2,
  ChevronRight, MapPin, Barcode, X, Info, RefreshCw
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const CARRIERS = [
  { id:'amazon',    name:'Amazon Shipping',    logo:'📦', color:'#FF9900', baseRate:40, perKgRate:25, minCharge:50,  days:'1–2 days' },
  { id:'flipkart',  name:'Flipkart Logistics', logo:'🛍️', color:'#2874F0', baseRate:35, perKgRate:22, minCharge:45,  days:'2–3 days' },
  { id:'meesho',    name:'Meesho Supply Chain',logo:'🌸', color:'#FF007F', baseRate:28, perKgRate:18, minCharge:35,  days:'3–5 days' },
  { id:'shiprocket',name:'Shiprocket',         logo:'🚀', color:'#E63946', baseRate:32, perKgRate:20, minCharge:40,  days:'2–4 days' },
  { id:'delhivery', name:'Delhivery',          logo:'🔵', color:'#D40511', baseRate:30, perKgRate:19, minCharge:38,  days:'2–4 days' },
  { id:'bluedart',  name:'Blue Dart',          logo:'🔷', color:'#003087', baseRate:55, perKgRate:35, minCharge:70,  days:'1–2 days' },
  { id:'ecom',      name:'Ecom Express',       logo:'📮', color:'#F7941D', baseRate:29, perKgRate:17, minCharge:36,  days:'3–5 days' },
  { id:'shadowfax', name:'Shadowfax',          logo:'⚡', color:'#6C3CE1', baseRate:26, perKgRate:16, minCharge:32,  days:'1–3 days' },
]

export default function LabelsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCarrier, setSelectedCarrier] = useState(CARRIERS[0])
  const [printProduct, setPrintProduct] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        // Fetch orders
        const res = await fetch('/api/orders', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        const json = await res.json()
        
        // Fetch profile
        const { data: prof } = await (supabase as any).from('profiles').select('*').eq('id', session.user.id).single()
        setProfile(prof)

        if (json.orders) {
          const mapped = json.orders.map((order: any) => ({
            id: order.id,
            sku: order.product_snapshot?.sku ?? order.sku ?? 'N/A',
            productName: order.product_snapshot?.product_name ?? order.product_name ?? 'Unknown',
            weight: Number(order.weight ?? order.product_snapshot?.weight_kg ?? 0.5),
            optimizedDims: order.optimized_dims ?? { l: 30, w: 22, h: 18 },
            destination: order.product_snapshot?.destination ?? 'India',
            senderName: (prof as any)?.full_name ?? 'PackIQ Seller',
            senderAddress: 'Warehouse, India',
            receiverName: 'Customer',
            receiverAddress: order.product_snapshot?.destination ?? 'India'
          }))
          setProducts(mapped)
        }
      } catch (err) {
        console.error('Labels fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  function calcCost(carrier: any, weight: number, dims: any) {
    const volWeight = (dims.l * dims.w * dims.h) / 5000
    const chargeable = Math.max(weight, volWeight)
    return Math.max(carrier.baseRate + carrier.perKgRate * chargeable, carrier.minCharge)
  }

  const totalEstimated = useMemo(() => {
    return products.reduce((acc, p) => acc + calcCost(selectedCarrier, p.weight, p.optimizedDims), 0)
  }, [products, selectedCarrier])

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20 text-white min-h-screen bg-[#0d0d1a]">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-600 tracking-tight">
          Shipping Labels
        </h1>
        <p className="mt-2 text-slate-400 text-sm font-medium">
          Generate professional labels for your optimized shipments.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <span className="text-6xl">🏷️</span>
          <h3 className="text-xl font-bold">No products to label</h3>
          <p className="text-slate-500">Optimize products first -{'>'} Labels appear here automatically</p>
          <button
            onClick={() => router.push('/dashboard/optimization')}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-500 rounded-xl font-bold transition-all"
          >
            Go to Optimization →
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Carrier Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Select Carrier Service</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CARRIERS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCarrier(c)}
                  className={`relative bg-[#1a1a2e] border rounded-2xl p-4 text-left transition-all overflow-hidden group ${
                    selectedCarrier.id === c.id ? 'ring-2 ring-violet-500 border-transparent shadow-[0_0_20px_rgba(139,92,246,0.2)]' : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: c.color }} />
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{c.logo}</span>
                    {selectedCarrier.id === c.id && <CheckCircle2 className="w-4 h-4 text-violet-500" />}
                  </div>
                  <h4 className="font-bold text-sm mb-1">{c.name}</h4>
                  <p className="text-[10px] text-slate-500 mb-2">{c.days}</p>
                  <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400">Starts at</span>
                    <span className="font-black text-xs">₹{c.minCharge}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Product List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Items to Ship</h3>
              {selectedCarrier && (
                <div className="px-4 py-2 bg-violet-600/10 border border-violet-500/20 rounded-xl text-[10px] font-black text-violet-400 uppercase tracking-widest animate-pulse">
                  Estimated Total: ₹{totalEstimated.toFixed(2)} for {products.length} shipments via {selectedCarrier.name}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(p => {
                const cost = calcCost(selectedCarrier, p.weight, p.optimizedDims)
                return (
                  <div key={p.id} className="bg-[#1a1a2e] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-white/5 rounded text-[9px] font-mono font-bold text-slate-500">{p.sku}</span>
                        <h4 className="font-bold text-sm line-clamp-1">{p.productName}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-white">₹{cost.toFixed(2)}</p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase">Estimated</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-400 border-y border-white/5 py-3">
                      <div>
                        <p className="font-bold text-slate-600 uppercase mb-1">Weight</p>
                        <p className="text-white">{p.weight} kg</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-600 uppercase mb-1">Dims</p>
                        <p className="text-white">{p.optimizedDims.l}x{p.optimizedDims.w}x{p.optimizedDims.h} cm</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setPrintProduct(p)}
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Printer className="w-4 h-4" /> Print Label
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      <AnimatePresence>
        {printProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A0F]/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-4xl w-full grid md:grid-cols-2 gap-8"
            >
              {/* Label Preview */}
              <div className="bg-white rounded p-1 shadow-2xl overflow-hidden text-black font-sans">
                <div className="border-[3px] border-black h-full flex flex-col">
                  {/* Carrier Header */}
                  <div className="p-4 flex justify-between items-center text-white" style={{ backgroundColor: selectedCarrier.color }}>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{selectedCarrier.logo}</span>
                      <span className="font-black italic tracking-tighter text-xl uppercase">{selectedCarrier.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold">EXPRESS</p>
                      <p className="text-lg font-black leading-none">P1</p>
                    </div>
                  </div>

                  <div className="p-6 flex-1 space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-black uppercase text-slate-400">From</p>
                          <p className="text-xs font-bold">{printProduct.senderName}</p>
                          <p className="text-[10px] text-slate-600">{printProduct.senderAddress}</p>
                        </div>
                        <div className="p-3 border-2 border-black rounded-lg">
                          <p className="text-[10px] font-black uppercase text-slate-400">To</p>
                          <p className="text-sm font-black">{printProduct.receiverName}</p>
                          <p className="text-xs font-bold leading-relaxed">{printProduct.receiverAddress}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-center justify-center gap-4">
                         {/* 3D Box Simulation CSS only */}
                         <div className="w-24 h-24 relative" style={{ perspective: '500px' }}>
                           <div className="w-full h-full border-[1.5px] border-black/20" style={{ transform: 'rotateX(60deg) rotateZ(45deg)', transformStyle: 'preserve-3d', background: '#fff', boxShadow: '10px 10px 20px rgba(0,0,0,0.1)' }}>
                             <div className="absolute top-0 left-1/2 w-px h-full bg-slate-300" />
                             <div className="absolute top-1/2 left-0 w-full h-px bg-slate-300" />
                           </div>
                         </div>
                         <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-500">
                           {printProduct.optimizedDims.l}×{printProduct.optimizedDims.w}×{printProduct.optimizedDims.h} CM
                         </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 border-y-2 border-black py-4 font-mono text-[10px] font-bold">
                      <div className="border-r border-black/10 pr-2">
                        <p className="text-slate-400 mb-1">SKU</p>
                        <p className="truncate">{printProduct.sku}</p>
                      </div>
                      <div className="border-r border-black/10 pr-2">
                        <p className="text-slate-400 mb-1">WT</p>
                        <p>{printProduct.weight} KG</p>
                      </div>
                      <div className="border-r border-black/10 pr-2">
                        <p className="text-slate-400 mb-1">DIMS</p>
                        <p>OK</p>
                      </div>
                      <div>
                        <p className="text-slate-400 mb-1">COST</p>
                        <p>PREPAID</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-2 pt-4">
                      <div className="flex gap-[2px] items-end h-16 w-full px-8">
                        {Array(60).fill(0).map((_, i) => (
                          <div key={i} className="bg-black flex-1" style={{ height: `${20 + Math.random() * 80}%`, width: i % 7 === 0 ? '4px' : '1px' }} />
                        ))}
                      </div>
                      <p className="text-xs font-mono font-bold tracking-[0.4em]">{printProduct.id.slice(0, 16).toUpperCase()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Controls */}
              <div className="flex flex-col justify-center gap-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-black">Shipment Confirmed</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Labels are generated with AI-verified dimensions for {selectedCarrier.name}. Ensure you use the {printProduct.optimizedDims.l}×{printProduct.optimizedDims.w}×{printProduct.optimizedDims.h} cm box for the calculated rate.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Final Charge</p>
                    <p className="text-2xl font-black">₹{calcCost(selectedCarrier, printProduct.weight, printProduct.optimizedDims).toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Delivery By</p>
                    <p className="text-xl font-black">{selectedCarrier.days}</p>
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={() => {
                      const printContent = document.querySelector('.bg-white.rounded.p-1')
                      if (!printContent) return
                      const win = window.open('', '', 'width=800,height=1000')
                      if (!win) return
                      win.document.write('<html><head><title>Print Label</title><script src="https://cdn.tailwindcss.com"></script></head><body class="p-10">')
                      win.document.write(printContent.innerHTML)
                      win.document.write('</body></html>')
                      win.document.close()
                      setTimeout(() => {
                        win.print()
                        win.close()
                      }, 500)
                    }}
                    className="flex-1 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-violet-600/30 transition-all flex items-center justify-center gap-3"
                  >
                    <Printer className="w-5 h-5" /> Print Now
                  </button>
                  <button
                    onClick={() => setPrintProduct(null)}
                    className="p-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
