'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Printer, Scan, Package, MapPin, Search, Filter, 
  Truck, CheckCircle2, ChevronRight, Hash, Box, QrCode
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useOptimizationStore } from '@/lib/store/optimizationStore'

export default function LabelsPage() {
  const { results: orders } = useOptimizationStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLabel, setSelectedLabel] = useState<any>(null)

  // Use orders with a savings > 0 as "Ready to Ship"
  const readyToShip = orders.filter(o => o.savings >= 0)
  const filtered = readyToShip.filter(o => 
    o.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.product_id?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const carriers = [
    { name: 'FedEx Express', logo: 'F', color: 'bg-[#4D148C]' },
    { name: 'UPS Ground', logo: 'U', color: 'bg-[#351C15]' },
    { name: 'USPS Priority', logo: 'P', color: 'bg-[#004B87]' }
  ]

  const getCarrier = (id: string) => carriers[id.charCodeAt(0) % carriers.length]

  return (
    <div className="max-w-[1200px] w-full mx-auto space-y-6 pb-20 px-4 md:px-0 h-[calc(100vh-100px)] flex flex-col">
      
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Shipping Labels</h1>
          <p className="text-gray-500 text-sm font-medium">Generate and print QR-enabled carrier labels.</p>
        </div>
        <button className="bg-[#00FFD1] text-[#0A0A0F] px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(0,255,209,0.2)] flex items-center gap-2 hover:scale-105 transition-all">
          <Printer className="w-4 h-4" /> Print Batch
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        
        {/* Left Column: Shipment List */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="glass rounded-[32px] flex flex-col overflow-hidden h-full">
            <div className="p-5 border-b border-white/5 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search tracking or SKU..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white text-xs focus:border-[#00FFD1] transition-all"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
              {filtered.length > 0 ? filtered.map((order, idx) => {
                const carrier = getCarrier(order.product_id)
                return (
                  <button 
                    key={idx}
                    onClick={() => setSelectedLabel({ ...order, carrier })}
                    className={`w-full text-left p-4 rounded-2xl transition-all border ${
                      selectedLabel?.product_id === order.product_id 
                        ? 'bg-[#00FFD1]/5 border-[#00FFD1]/30' 
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-bold text-white mb-0.5">{order.product_name}</p>
                        <p className="text-[10px] font-mono text-gray-500">{order.product_id}</p>
                      </div>
                      <div className={`w-8 h-8 rounded-lg ${carrier.color} flex items-center justify-center text-white font-black text-xs shrink-0`}>
                        {carrier.logo}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Box className="w-3.5 h-3.5" />
                        <span className="font-mono text-[10px]">{order.optimized_box}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-[10px] uppercase">Zone 2</span>
                      </div>
                    </div>
                  </button>
                )
              }) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <Package className="w-12 h-12 text-gray-600 mb-4 opacity-50" />
                  <p className="text-sm font-bold text-gray-400">No ready shipments</p>
                  <p className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest">Optimize orders to generate labels</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Label Preview */}
        <div className="flex-1 glass rounded-[40px] p-8 flex flex-col relative overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedLabel ? (
              <motion.div 
                key="label" 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full flex flex-col"
              >
                {/* Status Bar */}
                <div className="flex justify-between items-center mb-8 shrink-0">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Label Generated</span>
                  </div>
                  <p className="text-xs font-mono text-gray-500 flex items-center gap-2">
                    <Hash className="w-3 h-3" /> TRK-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                  </p>
                </div>

                <div className="flex-1 flex flex-col xl:flex-row gap-8 overflow-y-auto no-scrollbar">
                  
                  {/* The Physical Label Representation */}
                  <div className="w-full xl:w-[400px] shrink-0 bg-white rounded-xl shadow-2xl p-6 flex flex-col justify-between text-black relative">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gray-100 rounded-bl-[40px]" />
                    
                    <div>
                      {/* Carrier Header */}
                      <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
                        <div>
                          <h2 className="text-2xl font-black uppercase tracking-tighter">{selectedLabel.carrier.name}</h2>
                          <p className="text-xs font-bold mt-1">STANDARD OVERNIGHT</p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-black">{new Date().getDate()}</p>
                          <p className="text-xs font-bold uppercase">{new Date().toLocaleString('default', { month: 'short' })}</p>
                        </div>
                      </div>

                      {/* Addresses */}
                      <div className="space-y-4 mb-6">
                        <div>
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">From</p>
                          <p className="text-xs font-bold mt-0.5">PackIQ Logistics Center<br/>123 Innovation Way<br/>San Francisco, CA 94105</p>
                        </div>
                        <div className="border-l-2 border-black pl-4">
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">To</p>
                          <p className="text-lg font-black uppercase leading-tight mt-0.5">Jane Doe<br/>456 Receiving Dock<br/>New York, NY 10001</p>
                        </div>
                      </div>

                      {/* Package Details */}
                      <div className="grid grid-cols-2 gap-4 border-y-2 border-black py-4 mb-6">
                        <div>
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Weight</p>
                          <p className="text-sm font-black">2.5 LBS</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Dimensions</p>
                          <p className="text-sm font-black uppercase tracking-tighter">{selectedLabel.optimized_box_dims}</p>
                        </div>
                      </div>
                    </div>

                    {/* QR Code and Barcode area */}
                    <div className="flex items-end justify-between mt-auto">
                      <div className="space-y-2">
                        <QRCodeSVG 
                          value={`https://packiq.vercel.app/track/${selectedLabel.product_id}`}
                          size={96}
                          bgColor={"#ffffff"}
                          fgColor={"#000000"}
                          level={"Q"}
                        />
                        <p className="text-[8px] font-mono text-center font-bold">SCAN TO TRACK</p>
                      </div>
                      
                      {/* Fake Barcode */}
                      <div className="flex-1 ml-6 h-20 flex flex-col justify-end">
                        <div className="w-full h-12 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTEwLDBWMTAwaDVWMHptMTAsMFYxMDBoMlYwem01LDBWMTAwaDhWMHptMTUsMFYxMDBoM1Ywem01LDBWMTAwaDVWMHoiIGZpbGw9ImJsYWNrIi8+PC9zdmc+')] bg-repeat-x opacity-90" />
                        <p className="text-[10px] font-mono text-center font-bold mt-1 tracking-[0.2em]">1Z 999 AA1 01 2345 6784</p>
                      </div>
                    </div>
                  </div>

                  {/* Shipment Info Panel */}
                  <div className="flex-1 space-y-6">
                    <div className="glass p-6 rounded-3xl border border-white/5">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-[#00FFD1]" /> Dispatch Details
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-white/5">
                          <span className="text-xs text-gray-400">Order Reference</span>
                          <span className="text-sm font-bold text-white font-mono">{selectedLabel.product_id}</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-white/5">
                          <span className="text-xs text-gray-400">Carrier Service</span>
                          <span className="text-sm font-bold text-white">{selectedLabel.carrier.name}</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-white/5">
                          <span className="text-xs text-gray-400">Box Selected</span>
                          <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-2 py-1 rounded text-white">{selectedLabel.optimized_box}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">Shipping Cost</span>
                          <span className="text-lg font-black text-[#00FFD1] font-mono">${(selectedLabel.shipping_cost || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => window.print()}
                      className="w-full h-14 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      <Printer className="w-5 h-5" /> Print Thermal Label (4x6")
                    </button>
                  </div>
                </div>

              </motion.div>
            ) : (
              <motion.div 
                key="empty" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center opacity-50"
              >
                <QrCode className="w-20 h-20 text-gray-600 mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Label Viewer</h3>
                <p className="text-xs font-medium text-gray-400 max-w-[250px]">Select a shipment from the left to preview and print the carrier label.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
