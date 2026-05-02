'use client'

import { useState } from 'react'
import { 
  Search, Package, MapPin, Truck, CheckCircle2, 
  Clock, Calendar, ArrowRight, ShieldCheck, 
  RefreshCcw, AlertCircle, Ship
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const MOCK_TRACKING: Record<string, any> = {
  'PKQ-123456': {
    status: 'In Transit',
    carrier: 'BlueDart',
    eta: 'May 04, 2026',
    location: 'Mumbai, MH',
    origin: 'Bangalore, KA',
    destination: 'New Delhi, DL',
    timeline: [
      { status: 'Out for Delivery', time: 'Today, 09:15 AM', location: 'New Delhi Distribution Hub', done: false },
      { status: 'In Transit', time: 'Yesterday, 11:30 PM', location: 'Ahmedabad Sorting Center', done: true },
      { status: 'Shipped', time: 'May 01, 2026, 04:00 PM', location: 'Bangalore Warehouse', done: true },
      { status: 'Processed', time: 'May 01, 2026, 10:00 AM', location: 'Order Management System', done: true },
    ]
  },
  'AMZ-789012': {
    status: 'Delivered',
    carrier: 'Amazon Logistics',
    eta: 'Delivered Today',
    location: 'Bangalore, KA',
    origin: 'Chennai, TN',
    destination: 'Bangalore, KA',
    timeline: [
      { status: 'Delivered', time: 'Today, 02:45 PM', location: 'Front Door', done: true },
      { status: 'Out for Delivery', time: 'Today, 08:30 AM', location: 'HSR Layout Hub', done: true },
      { status: 'In Transit', time: 'May 01, 2026, 09:00 PM', location: 'Chennai Sorting Center', done: true },
      { status: 'Shipped', time: 'May 01, 2026, 11:00 AM', location: 'Chennai Fulfillment Center', done: true },
    ]
  }
}

export default function TrackingPage() {
  const [trackingId, setTrackingId] = useState('')
  const [result, setResult] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)

  const handleTrack = () => {
    if (!trackingId) return
    setLoading(true)
    setTimeout(() => {
      setResult(MOCK_TRACKING[trackingId] || 'not_found')
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      <div className="text-center space-y-4 pt-10">
        <h1 className="text-4xl font-black text-white">Universal Tracking</h1>
        <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
          Monitor your AI-optimized shipments across all global carriers in one unified spatial interface.
        </p>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <div className="relative glass p-2 rounded-[32px] border-white/5 bg-white/[0.01] shadow-2xl">
          <input 
            type="text" 
            placeholder="Enter Tracking ID (e.g., PKQ-123456)" 
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
            className="w-full bg-transparent border-none rounded-2xl pl-14 pr-40 py-5 text-white font-black tracking-widest focus:ring-0 placeholder:text-gray-700 placeholder:font-medium"
          />
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700">
            <Package className="w-6 h-6" />
          </div>
          <button 
            onClick={handleTrack}
            disabled={loading}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#00E5CC] hover:bg-[#00c2ad] text-[#0A0A0F] px-8 py-3.5 rounded-2xl font-black text-sm transition-all flex items-center gap-2"
          >
            {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <><Ship className="w-4 h-4" /> Track Item</>}
          </button>
        </div>
        <p className="text-center mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-700">
          Try: PKQ-123456 or AMZ-789012
        </p>
      </div>

      <AnimatePresence mode="wait">
        {result === 'not_found' && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass p-12 rounded-[40px] border-red-500/10 bg-red-500/5 text-center max-w-xl mx-auto">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-black text-white mb-2">Tracking ID Not Found</h3>
            <p className="text-gray-500 text-sm">We couldn't find any shipment matching that ID. Please verify and try again.</p>
          </motion.div>
        )}

        {result && result !== 'not_found' && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-5 gap-8"
          >
            <div className="lg:col-span-2 space-y-6">
              <div className="glass p-8 rounded-[40px] border-white/5 bg-white/[0.01]">
                <div className="flex items-center justify-between mb-8">
                   <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${result.status === 'Delivered' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                      {result.status}
                   </div>
                   <ShieldCheck className="w-6 h-6 text-[#00E5CC]" />
                </div>
                
                <div className="space-y-6">
                   <div>
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Carrier</p>
                      <p className="text-xl font-black text-white">{result.carrier}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Estimated Arrival</p>
                      <p className="text-xl font-black text-[#00E5CC]">{result.eta}</p>
                   </div>
                   <div className="pt-6 border-t border-white/5">
                      <div className="flex items-center justify-between">
                         <div>
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Origin</p>
                            <p className="text-sm font-bold text-gray-300">{result.origin}</p>
                         </div>
                         <ArrowRight className="w-4 h-4 text-gray-700" />
                         <div className="text-right">
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Destination</p>
                            <p className="text-sm font-bold text-gray-300">{result.destination}</p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="p-8 rounded-[40px] bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
                    <Truck className="w-32 h-32" />
                 </div>
                 <h4 className="text-xl font-black mb-2 relative z-10">Premium Tracking</h4>
                 <p className="text-sm text-blue-100/70 leading-relaxed relative z-10">Real-time GPS updates and spatial route optimization active for this shipment.</p>
              </div>
            </div>

            <div className="lg:col-span-3 glass p-10 rounded-[40px] border-white/5 bg-white/[0.01]">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-12 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00E5CC]" /> Shipment Timeline
              </h3>

              <div className="space-y-12 relative">
                {/* Connector Line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-white/5" />

                {result.timeline.map((step: any, i: number) => (
                  <div key={i} className="flex gap-8 relative group">
                    <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center shrink-0 z-10 transition-all ${
                      step.done 
                        ? 'bg-[#00E5CC] border-[#00E5CC]/20' 
                        : 'bg-[#0A0A0F] border-white/10 group-hover:border-[#00E5CC]/30'
                    }`}>
                      {step.done && <CheckCircle2 className="w-3 h-3 text-[#0A0A0F]" />}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                         <span className={`text-sm font-black uppercase tracking-tight ${step.done ? 'text-white' : 'text-gray-600'}`}>{step.status}</span>
                         <span className="text-[10px] font-bold text-gray-700">{step.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                         <MapPin className="w-3 h-3" />
                         {step.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
