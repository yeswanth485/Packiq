'use client'

import { 
  Search, Package, MapPin, Truck, CheckCircle2, 
  Clock, Calendar, ArrowRight, ShieldCheck, 
  RefreshCcw, AlertCircle, Ship, MoreVertical, 
  ExternalLink, ChevronRight, X, Info
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SkeletonRow from '@/components/dashboard/SkeletonRow'
import SkeletonCard from '@/components/dashboard/SkeletonCard'
import React, { memo, useState, useEffect, useMemo } from 'react'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
}

// --- MOCK DATA ---

const SHIPMENTS = [
  {
    id: 'PKQ-982341',
    orderId: 'ORD-1024',
    status: 'In Transit',
    carrier: 'FedEx',
    progress: 65,
    origin: 'San Francisco, CA',
    destination: 'New York, NY',
    lastEvent: 'Arrived at Memphis Hub',
    lastEventTime: '2h ago',
    eta: 'Oct 24, 2026',
    customer: 'John Doe',
    weight: '2.4 kg',
    dimensions: '15x10x8 cm',
    timeline: [
      { status: 'Arrived at Memphis Hub', location: 'Memphis, TN', time: 'Oct 22, 10:45 AM', done: true },
      { status: 'Departed Facility', location: 'San Francisco, CA', time: 'Oct 21, 09:30 PM', done: true },
      { status: 'Picked Up', location: 'San Francisco, CA', time: 'Oct 21, 04:00 PM', done: true },
      { status: 'Order Processed', location: 'San Francisco, CA', time: 'Oct 21, 10:00 AM', done: true }
    ]
  },
  {
    id: 'PKQ-123456',
    orderId: 'ORD-1025',
    status: 'Out for Delivery',
    carrier: 'UPS',
    progress: 90,
    origin: 'Chicago, IL',
    destination: 'Los Angeles, CA',
    lastEvent: 'Out for Delivery',
    lastEventTime: '45m ago',
    eta: 'Today',
    customer: 'Jane Smith',
    weight: '1.8 kg',
    dimensions: '12x12x12 cm',
    timeline: [
      { status: 'Out for Delivery', location: 'Los Angeles, CA', time: 'Today, 08:30 AM', done: true, current: true },
      { status: 'Arrived at Facility', location: 'Los Angeles, CA', time: 'Yesterday, 11:30 PM', done: true },
      { status: 'In Transit', location: 'Denver, CO', time: 'Oct 21, 02:00 PM', done: true },
      { status: 'Order Shipped', location: 'Chicago, IL', time: 'Oct 20, 11:00 AM', done: true }
    ]
  },
  {
    id: 'PKQ-778899',
    orderId: 'ORD-1026',
    status: 'Delivered',
    carrier: 'DHL',
    progress: 100,
    origin: 'London, UK',
    destination: 'Paris, FR',
    lastEvent: 'Delivered',
    lastEventTime: '3h ago',
    eta: 'Delivered',
    customer: 'Alice Brown',
    weight: '0.9 kg',
    dimensions: '10x10x5 cm',
    timeline: [
      { status: 'Delivered', location: 'Paris, FR', time: 'Today, 01:15 PM', done: true },
      { status: 'Out for Delivery', location: 'Paris, FR', time: 'Today, 09:00 AM', done: true },
      { status: 'Cleared Customs', location: 'Paris, FR', time: 'Yesterday, 04:30 PM', done: true },
      { status: 'Departed London', location: 'London, UK', time: 'Yesterday, 10:00 AM', done: true }
    ]
  },
  {
    id: 'PKQ-445566',
    orderId: 'ORD-1027',
    status: 'Delayed',
    carrier: 'USPS',
    progress: 40,
    origin: 'Austin, TX',
    destination: 'Miami, FL',
    lastEvent: 'Weather Delay',
    lastEventTime: '5h ago',
    eta: 'Oct 26, 2026',
    customer: 'Robert Wilson',
    weight: '3.2 kg',
    dimensions: '20x15x10 cm',
    timeline: [
      { status: 'Delayed - Weather', location: 'Houston, TX', time: 'Today, 07:00 AM', done: true, isIssue: true },
      { status: 'In Transit', location: 'Austin, TX', time: 'Yesterday, 06:00 PM', done: true },
      { status: 'Order Processed', location: 'Austin, TX', time: 'Yesterday, 09:00 AM', done: true }
    ]
  },
  {
    id: 'PKQ-112233',
    orderId: 'ORD-1028',
    status: 'Exception',
    carrier: 'FedEx',
    progress: 25,
    origin: 'Seattle, WA',
    destination: 'Boston, MA',
    lastEvent: 'Incorrect Address',
    lastEventTime: '1h ago',
    eta: 'Pending',
    customer: 'Emily Davis',
    weight: '1.2 kg',
    dimensions: '14x14x10 cm',
    timeline: [
      { status: 'Address Exception', location: 'Seattle, WA', time: 'Today, 11:30 AM', done: true, isIssue: true },
      { status: 'Picked Up', location: 'Seattle, WA', time: 'Yesterday, 05:00 PM', done: true },
      { status: 'Order Created', location: 'Seattle, WA', time: 'Yesterday, 11:00 AM', done: true }
    ]
  }
]

// --- COMPONENTS ---

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    'In Transit': 'bg-blue-500/10 text-blue-400',
    'Delivered': 'bg-green-500/10 text-green-400',
    'Out for Delivery': 'bg-indigo-500/10 text-indigo-400',
    'Delayed': 'bg-orange-500/10 text-orange-400',
    'Exception': 'bg-red-500/10 text-red-400'
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${colors[status] || 'bg-gray-500/10 text-gray-400'}`}>
      {status}
    </span>
  )
}

// --- MAIN PAGE ---

const TrackingPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [activeFilter, setActiveFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  const filters = ['All', 'In Transit', 'Out for Delivery', 'Delivered', 'Delayed', 'Exception']

  const filteredShipments = useMemo(() => {
    return SHIPMENTS.filter(s => {
      const matchesSearch = s.id.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                            s.orderId.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchesFilter = activeFilter === 'All' || s.status === activeFilter
      return matchesSearch && matchesFilter
    })
  }, [debouncedSearch, activeFilter])

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-24 px-4 md:px-0 relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-white">Live Tracking</h1>
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
              <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Live Updates</span>
            </div>
          </div>
          <p className="text-gray-400 text-sm">Monitor all shipments in real-time across your global carriers.</p>
        </div>
        <button className="bg-[#4361EE] hover:bg-[#344FDA] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-[#4361EE]/20 transition-all flex items-center gap-2">
          <RefreshCcw className="w-4 h-4" /> Track New Shipment
        </button>
      </div>

      {/* Search & Filter */}
      <div className="space-y-4">
        <div className="relative group">
          <Search className="w-5 h-5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-[#4361EE] transition-colors" />
          <input 
            type="text" 
            placeholder="Enter tracking number or order ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0f0f1a] border border-white/[0.06] rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-[#4361EE]/50 transition-all shadow-xl placeholder-gray-600 font-medium"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map(f => (
            <button 
              key={f} 
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${activeFilter === f ? 'bg-white/10 text-white border-white/20 shadow-lg' : 'text-gray-500 border-white/5 hover:border-white/10 hover:text-gray-300'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {loading ? (
          [1,2,3,4].map(i => <SkeletonCard key={i} />)
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredShipments.map((s, i) => (
            <motion.div 
              key={s.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedShipment(s)}
              className="bg-[#0f0f1a] border border-white/[0.06] rounded-[28px] p-6 shadow-xl cursor-pointer hover:border-[#4361EE]/40 group transition-all relative overflow-hidden"
            >
              {/* Status Glow Border (Hover) */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none ${
                s.status === 'In Transit' ? 'bg-blue-500' : 
                s.status === 'Delivered' ? 'bg-green-500' : 
                s.status === 'Delayed' ? 'bg-orange-500' : 'bg-red-500'
              }`} />

              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-white">{s.carrier}</span>
                    <span className="text-[10px] text-gray-500 font-mono tracking-tighter">{s.id}</span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{s.orderId}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>

              <div className="flex items-center justify-between mb-6">
                 <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Origin</p>
                    <p className="text-sm font-bold text-gray-300">{s.origin.split(',')[0]}</p>
                 </div>
                 <div className="flex flex-col items-center px-4 relative flex-1">
                    <div className="w-full h-px bg-white/10 relative">
                       <motion.div 
                         initial={{ width: 0 }} 
                         animate={{ width: `${s.progress}%` }} 
                         transition={{ duration: 1, delay: 0.5 }}
                         className={`absolute top-0 left-0 h-full ${s.status === 'Delayed' ? 'bg-orange-500' : s.status === 'Exception' ? 'bg-red-500' : 'bg-[#4361EE]'}`}
                       />
                       <Truck className="w-4 h-4 text-gray-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0f0f1a] px-0.5" />
                    </div>
                 </div>
                 <div className="flex-1 text-right">
                    <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Destination</p>
                    <p className="text-sm font-bold text-gray-300">{s.destination.split(',')[0]}</p>
                 </div>
              </div>

              <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-4">
                 <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                    <div className="flex-1">
                       <p className="text-xs font-bold text-white mb-0.5">{s.lastEvent}</p>
                       <p className="text-[10px] text-gray-500">{s.lastEventTime} • {s.origin.split(',')[1].trim()}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">ETA</p>
                       <p className="text-xs font-black text-[#00E5CC]">{s.eta}</p>
                    </div>
                 </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                 <button className="text-xs font-bold text-[#4361EE] group-hover:text-white flex items-center gap-1 transition-colors">
                   View Details <ChevronRight className="w-3.5 h-3.5" />
                 </button>
                 <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-gray-400">
                       <Package className="w-3 h-3" />
                    </div>
                 </div>
              </div>
            </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedShipment && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setSelectedShipment(null)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-[#0f0f1a] border-l border-white/10 z-[70] flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="text-lg font-black text-white mb-1">{selectedShipment.id}</h3>
                  <StatusBadge status={selectedShipment.status} />
                </div>
                <button onClick={() => setSelectedShipment(null)} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                
                {/* Visual Timeline */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-8 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#4361EE]" /> Shipment Timeline
                  </h4>
                  <div className="space-y-0 relative">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-white/5" />
                    {selectedShipment.timeline.map((t: any, i: number) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex gap-6 pb-10 last:pb-0 group"
                      >
                        <div className="relative">
                          <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center shrink-0 z-10 relative transition-all ${
                            t.done 
                              ? t.isIssue ? 'bg-red-500 border-red-500/20' : 'bg-green-500 border-green-500/20'
                              : 'bg-[#0f0f1a] border-white/10'
                          }`}>
                            {t.done ? (
                              t.isIssue ? <AlertCircle className="w-3 h-3 text-white" /> : <CheckCircle2 className="w-3 h-3 text-white" />
                            ) : null}
                            {t.current && (
                               <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-bold mb-0.5 ${t.isIssue ? 'text-red-400' : 'text-white'}`}>{t.status}</p>
                          <p className="text-xs text-gray-500 mb-2">{t.location} • {t.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Package Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-gray-600 font-bold mb-1">Carrier</p>
                          <p className="text-sm font-bold text-white">{selectedShipment.carrier}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-600 font-bold mb-1">Weight</p>
                          <p className="text-sm font-bold text-white">{selectedShipment.weight}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] text-gray-600 font-bold mb-1">Dimensions</p>
                          <p className="text-sm font-bold text-white">{selectedShipment.dimensions}</p>
                        </div>
                      </div>
                   </div>

                   <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Customer Information</h4>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#4361EE]/20 flex items-center justify-center text-sm font-bold text-[#4361EE]">
                           {selectedShipment.customer.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{selectedShipment.customer}</p>
                          <p className="text-xs text-gray-500">Premium Shipping Member</p>
                        </div>
                      </div>
                   </div>
                </div>

              </div>

              <div className="p-6 border-t border-white/5 bg-white/[0.02] flex gap-3">
                <button className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-white/5">
                   <AlertCircle className="w-4 h-4" /> Report Issue
                </button>
                <button className="flex-1 bg-[#4361EE] hover:bg-[#344FDA] text-white px-4 py-3 rounded-xl text-sm font-bold shadow-xl shadow-[#4361EE]/20 transition-all flex items-center justify-center gap-2">
                   <ExternalLink className="w-4 h-4" /> Carrier Site
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}

export default memo(TrackingPage)
