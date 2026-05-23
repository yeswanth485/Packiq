'use client'

import { useState, useEffect, useMemo, memo, useRef } from 'react'
import {
  Printer, CheckCircle2, X, RefreshCw, AlertCircle, Eye,
  Package, Truck, Info, Leaf, RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useOptimizationStore } from '@/lib/store/optimizationStore'
import { useSubscriptionStore } from '@/lib/store/subscriptionStore'
import BoxViewer3D from '@/components/3d/BoxViewer3D'
import { QRCodeSVG } from 'qrcode.react'
import * as THREE from 'three'

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

const LABEL_TYPES = [
  { id: 'shipping', name: 'Shipping Label', icon: Truck, cost: 8 },
  { id: 'content', name: 'Box Content', icon: Package, cost: 2 },
  { id: 'voidfill', name: 'Void Fill', icon: Info, cost: 1.5 },
  { id: 'eco', name: 'Sustainability', icon: Leaf, cost: 1 },
  { id: 'return', name: 'Return Label', icon: RotateCcw, cost: 8 },
]

const LabelsClient = memo(function LabelsClient() {
  const { results: optResults } = useOptimizationStore()
  const { deductTokens, remaining: tokensRemaining } = useSubscriptionStore()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCarrier, setSelectedCarrier] = useState(CARRIERS[0])
  const [activeTab, setActiveTab] = useState('shipping')
  const [viewProduct, setViewProduct] = useState<any>(null)
  const [show3DModal, setShow3DModal] = useState(false)
  const [profileName, setProfileName] = useState<string | null>(null)
  const [labelTexture, setLabelTexture] = useState<THREE.CanvasTexture | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
           setLoading(false)
           return
        }

        // Fetch orders
        const res = await fetch('/api/orders', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })
        const json = await res.json()

        // Fetch profile
        const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single()
        if (prof) setProfileName((prof as any).full_name)

        const dbOrders = json.orders || []

        // Merge with optResults
        const sessionProducts = optResults.map(r => ({
          id: `opt-${r.sku || r.product_id}`,
          sku: r.sku || r.product_id,
          productName: r.product_name,
          weight: r.product_weight || 0,
          optimizedDims: r.optimizedDims || { l: 30, w: 22, h: 18 },
          boxName: r.optimizedBox || 'Standard Box',
          isOptimized: true,
          fragility: r.fragility || 'LOW',
          voidPct: r.voidPct || 0,
          trackingId: `SHZ-${r.sku || r.product_id}-${Date.now().toString().slice(-4)}`,
          senderName: (prof as any)?.full_name || 'PackIQ Seller',
          senderAddress: '123 Warehouse St, Bangalore, KA',
          receiverName: 'John Doe',
          receiverAddress: '456 Delivery Lane, Mumbai, MH'
        }))

        const dbProducts = dbOrders.map((o: any) => ({
          id: o.id,
          sku: o.product_snapshot?.sku || o.sku || 'N/A',
          productName: o.product_snapshot?.product_name || o.product_name || 'Unknown',
          weight: o.weight || o.product_snapshot?.weight_kg || 0,
          optimizedDims: o.optimized_dims || { l: 30, w: 22, h: 18 },
          boxName: o.optimized_box || 'Standard',
          isOptimized: !!o.optimized_box,
          fragility: o.fragility || o.product_snapshot?.fragility || 'LOW',
          voidPct: o.void_pct || 0,
          trackingId: o.tracking_number && o.tracking_number !== 'PENDING' ? o.tracking_number : `SHZ-${o.id.slice(-4)}-${Date.now().toString().slice(-4)}`,
          senderName: (prof as any)?.full_name || 'PackIQ Seller',
          senderAddress: '123 Warehouse St, Bangalore, KA',
          receiverName: 'Jane Smith',
          receiverAddress: '789 Customer Ave, Delhi, DL'
        }))

        // Deduplicate by SKU
        const seen = new Set()
        const merged = [...sessionProducts, ...dbProducts].filter(p => {
          if (seen.has(p.sku)) return false
          seen.add(p.sku)
          return true
        })

        setProducts(merged)
      } catch (err) {
        console.error('Labels fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [optResults])

  // Generate Label Texture for 3D
  useEffect(() => {
    if (show3DModal && viewProduct && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = 'black'
        ctx.font = 'bold 40px sans-serif'
        ctx.fillText('PackIQ Shipping', 20, 60)
        ctx.font = '24px sans-serif'
        ctx.fillText(`SKU: ${viewProduct.sku}`, 20, 110)
        ctx.fillText(`Tracking: ${viewProduct.trackingId}`, 20, 150)
        ctx.fillText(`To: ${viewProduct.receiverName}`, 20, 190)
        ctx.font = 'bold 30px monospace'
        ctx.fillText('|| ||| | || |||| |', 20, 250)

        const texture = new THREE.CanvasTexture(canvas)
        setLabelTexture(texture)
      }
    }
  }, [show3DModal, viewProduct])

  const labelCosts = useMemo(() => {
    const perSku = LABEL_TYPES.reduce((acc, t) => acc + t.cost, 0)
    const total = products.length * perSku
    return { perSku, total }
  }, [products])

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20 text-white min-h-screen bg-[#0d0d1a]">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-600 tracking-tight">
            Smart Labels
          </h1>
          <p className="mt-2 text-slate-400 text-sm font-medium">
            AI-generated labels with precise dimensions and real-time tracking.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="glass px-4 py-2 rounded-xl border border-white/10">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Total Label Cost</p>
            <p className="text-lg font-black text-[#00FFD1]">₹{labelCosts.total.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-4 glass rounded-3xl border border-white/5">
          <span className="text-6xl">🏷️</span>
          <h3 className="text-xl font-bold">Upload and optimize a file to generate labels.</h3>
          <button
            onClick={() => router.push('/dashboard/optimization')}
            className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            Start Optimization →
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Tabs */}
          <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
            {LABEL_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setActiveTab(type.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === type.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-white/5'
                }`}
              >
                <type.icon className="w-4 h-4" />
                {type.name} (₹{type.cost})
              </button>
            ))}
          </div>

          {/* Carrier Selection for Shipping Labels */}
          {activeTab === 'shipping' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {CARRIERS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCarrier(c)}
                  className={`relative glass border rounded-xl p-3 text-left transition-all ${
                    selectedCarrier.id === c.id ? 'ring-2 ring-indigo-500 border-transparent' : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="absolute top-0 left-0 w-full h-1 rounded-t-xl" style={{ backgroundColor: c.color }} />
                  <span className="text-xl mb-1 block">{c.logo}</span>
                  <p className="text-[9px] font-black uppercase truncate">{c.name}</p>
                </button>
              ))}
            </div>
          )}

          {/* Label Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(p => (
              <div key={p.id} className="glass border border-white/5 rounded-3xl p-6 flex flex-col gap-6 group hover:border-indigo-500/30 transition-all">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[9px] font-mono font-bold">{p.sku}</span>
                    <h4 className="font-bold text-sm text-gray-200 line-clamp-1">{p.productName}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 font-black uppercase">Label Cost</p>
                    <p className="text-sm font-black text-[#00FFD1]">₹{LABEL_TYPES.find(t => t.id === activeTab)?.cost}</p>
                  </div>
                </div>

                {/* Tab Specific Info */}
                <div className="flex-1 space-y-4">
                  {activeTab === 'shipping' && (
                    <div className="space-y-3">
                      <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-black text-gray-500 uppercase mb-1">To: {p.receiverName}</p>
                        <p className="text-[10px] text-gray-300 truncate">{p.receiverAddress}</p>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-500">Tracking: <span className="text-indigo-400 font-mono">{p.trackingId}</span></span>
                        <span className="text-gray-500">Weight: <span className="text-white">{p.weight}kg</span></span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'content' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-black text-gray-500 uppercase mb-1">Dimensions</p>
                        <p className="text-xs font-bold text-white">{p.optimizedDims.l}x{p.optimizedDims.w}x{p.optimizedDims.h} cm</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                        <p className="text-[9px] font-black text-gray-500 uppercase mb-1">Fragility</p>
                        <p className={`text-xs font-bold ${p.fragility === 'HIGH' ? 'text-orange-400' : 'text-emerald-400'}`}>{p.fragility}</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'voidfill' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] text-gray-500 uppercase font-black">Void Space: {p.voidPct.toFixed(1)}%</span>
                         <span className="text-[10px] text-indigo-400 font-black uppercase">Recommended Fill</span>
                      </div>
                      <div className="p-3 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                        <p className="text-xs text-indigo-200">
                          {p.fragility === 'HIGH' ? 'Double Bubble Wrap + 3 Air Pillows' : 'Single Kraft Paper Wrap'}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'eco' && (
                    <div className="flex items-center gap-4 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                      <Leaf className="w-6 h-6 text-emerald-400" />
                      <div>
                        <p className="text-[10px] font-black text-emerald-500 uppercase">CO₂ Saved</p>
                        <p className="text-sm font-black text-white">{(p.voidPct * 0.02).toFixed(2)} kg</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'return' && (
                    <div className="p-3 bg-red-500/5 rounded-2xl border border-red-500/10 opacity-60">
                      <p className="text-[9px] font-black text-red-400 uppercase mb-1 underline">Return To Sender</p>
                      <p className="text-[10px] text-gray-300">{p.senderName}</p>
                      <p className="text-[9px] text-gray-500">{p.senderAddress}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      const { data: { session } } = await supabase.auth.getSession()
                      const success = await deductTokens(session?.access_token || '', 1, 'label')
                      if (success) {
                        toast.success('Label generated & printed')
                      } else {
                        toast.error('Token limit reached. Please upgrade.')
                      }
                    }}
                    disabled={tokensRemaining <= 0}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/5 disabled:opacity-50"
                  >
                    <Printer className="w-3 h-3" /> Print
                  </button>
                  <button
                    onClick={async () => {
                      const { data: { session } } = await supabase.auth.getSession()
                      const success = await deductTokens(session?.access_token || '', 5, 'view3d')
                      if (success) {
                        setViewProduct(p)
                        setShow3DModal(true)
                      } else {
                        toast.error('Token limit reached (5 tokens required). Please upgrade.')
                      }
                    }}
                    disabled={tokensRemaining < 5}
                    className="flex-1 py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-indigo-500/20 disabled:opacity-50"
                  >
                    <Eye className="w-3 h-3" /> 3D View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3D Modal with Label Texture */}
      <AnimatePresence>
        {show3DModal && viewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
             <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-4xl glass border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative"
             >
                <button
                  onClick={() => {
                    setShow3DModal(false)
                    setLabelTexture(null)
                  }}
                  className="absolute top-6 right-6 z-10 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="grid md:grid-cols-2 h-[600px]">
                   <div className="p-8 flex flex-col justify-center gap-6">
                      <div>
                        <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                           {activeTab} Label Preview
                        </span>
                        <h2 className="text-3xl font-black">{viewProduct.productName}</h2>
                        <p className="text-gray-400 text-sm mt-2">Visualizing real-time label application on optimized packaging.</p>
                      </div>

                      <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                         <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-500 uppercase">Label Content</span>
                            <QRCodeSVG value={viewProduct.trackingId} size={40} bgColor="transparent" fgColor="#4f46e5" />
                         </div>
                         <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                               <span className="text-gray-500">Carrier</span>
                               <span className="font-bold">{selectedCarrier.name}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                               <span className="text-gray-500">Tracking</span>
                               <span className="font-mono text-indigo-400">{viewProduct.trackingId}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                               <span className="text-gray-500">Dimensions</span>
                               <span className="font-bold">{viewProduct.optimizedDims.l}x{viewProduct.optimizedDims.w}x{viewProduct.optimizedDims.h} cm</span>
                            </div>
                         </div>
                      </div>

                      <button
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3"
                      >
                        <Printer className="w-5 h-5" /> Print This Label
                      </button>
                   </div>

                   <div className="bg-black/20 h-full">
                      <BoxViewer3D
                        widthCm={viewProduct.optimizedDims.w}
                        heightCm={viewProduct.optimizedDims.h}
                        depthCm={viewProduct.optimizedDims.l}
                        sku={viewProduct.sku}
                        labelTexture={labelTexture}
                      />
                   </div>
                </div>

                {/* Hidden Canvas for Texture Generation */}
                <canvas ref={canvasRef} width={512} height={512} className="hidden" />
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default LabelsClient
