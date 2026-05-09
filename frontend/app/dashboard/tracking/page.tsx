'use client'

import { 
  Search, Package, MapPin, Truck, CheckCircle2, 
  Clock, RefreshCcw, AlertCircle, X, Activity, Brain
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import React, { useState } from 'react'

const SHIPMENTS = [
  { id: 'PKQ-982341', orderId: 'ORD-1024', status: 'In Transit', progress: 65, eta: 'Today', carrier: 'FedEx' },
  { id: 'PKQ-123456', orderId: 'ORD-1025', status: 'Out for Delivery', progress: 92, eta: '11:45 AM', carrier: 'UPS' },
  { id: 'PKQ-778899', orderId: 'ORD-1026', status: 'Delivered', progress: 100, eta: 'Delivered', carrier: 'DHL' }
]

export default function TrackingPage() {
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null)

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Live Tracking</h1>
          <p className="text-gray-500 text-sm font-medium">Global logistics monitoring with real-time anomaly detection.</p>
        </div>
        <button className="bg-[#00FFD1] text-[#0A0A0F] px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,209,0.2)] flex items-center gap-2 hover:scale-105 transition-all">
          <RefreshCcw className="w-4 h-4" /> Sync All
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="relative group">
            <Search className="w-5 h-5 text-gray-600 absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-[#00FFD1] transition-colors" />
            <input 
              type="text" 
              placeholder="Track by PKQ Number or Order ID..." 
              className="w-full bg-white/[0.03] border border-white/10 rounded-[32px] pl-14 pr-6 py-5 text-white text-sm focus:border-[#00FFD1] transition-all shadow-2xl"
            />
          </div>

          <div className="grid gap-4">
            {SHIPMENTS.map((s, i) => (
              <motion.div 
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedShipment(s)}
                className="glass p-8 rounded-[40px] cursor-pointer group hover:border-[#00FFD1]/30 transition-all flex flex-col md:flex-row items-center gap-8"
              >
                <div className="w-16 h-16 rounded-[24px] bg-white/[0.03] flex items-center justify-center border border-white/5 shrink-0">
                  <Package className="w-8 h-8 text-[#00FFD1]" />
                </div>

                <div className="flex-1 space-y-4 w-full">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">{s.id}</p>
                      <h3 className="text-lg font-bold text-white">{s.carrier} Express</h3>
                    </div>
                    <span className="text-[10px] font-black text-[#00FFD1] uppercase tracking-widest">ETA: {s.eta}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${s.progress}%` }} 
                        className="h-full bg-[#00FFD1]" 
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-gray-600 uppercase tracking-widest">
                      <span>Origin</span>
                      <span>Destination</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <div className="text-right hidden md:block">
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Current Status</p>
                    <p className="text-xs font-bold text-white">{s.status}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-[#00FFD1] group-hover:text-[#0A0A0F] transition-all">
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 h-full">
          <div className="glass p-8 rounded-[40px] sticky top-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#00FFD1]" /> Network Pulse
            </h3>
            
            <div className="space-y-6">
              {[
                { label: 'Active Streams', value: '842' },
                { label: 'Carrier Latency', value: '45ms' },
                { label: 'Transit Accuracy', value: '99.9%' }
              ].map((m, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{m.label}</span>
                  <span className="text-sm font-black text-white">{m.value}</span>
                </div>
              ))}
            </div>

            <div className="mt-12">
               <div className="w-full h-48 rounded-3xl bg-black/20 border border-white/5 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,209,0.1)_0%,transparent_70%)]" />
                  <MapPin className="w-8 h-8 text-[#00FFD1] animate-bounce" />
               </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
