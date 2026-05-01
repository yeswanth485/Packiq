'use client'

import { useState } from 'react'
import { Search, MapPin, Truck, CheckCircle2, Package, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface Checkpoint {
  status: string
  message: string
  location: string
  timestamp: string
}

interface TrackingData {
  tracking_number: string
  carrier: string
  status: string
  checkpoints: Checkpoint[]
}

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [carrier, setCarrier] = useState('fedex')
  const [isLoading, setIsLoading] = useState(false)
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingNumber) return

    setIsLoading(true)
    setErrorMsg('')
    setTrackingData(null)

    try {
      const res = await fetch(`/api/tracking?tracking_number=${trackingNumber}&slug=${carrier}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to track shipment')
      }

      setTrackingData(data)
    } catch (err: any) {
      setErrorMsg(err.message)
      toast.error('Tracking failed')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    const s = status.toLowerCase()
    if (s.includes('deliver')) return <CheckCircle2 className="w-5 h-5 text-green-400" />
    if (s.includes('out') || s.includes('transit')) return <Truck className="w-5 h-5 text-indigo-400" />
    if (s.includes('info') || s.includes('pending')) return <Package className="w-5 h-5 text-amber-400" />
    return <MapPin className="w-5 h-5 text-gray-400" />
  }

  return (
    <div className="max-w-4xl mx-auto fade-in">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-3">Track Your Shipment</h1>
        <p className="text-gray-400 text-sm">Enter your tracking number below to get real-time delivery updates.</p>
      </div>

      <form onSubmit={handleSearch} className="glass p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row gap-4 mb-10 shadow-2xl">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Enter tracking number (e.g. 1234567890)" 
            value={trackingNumber}
            onChange={e => setTrackingNumber(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            required
          />
        </div>
        <div className="w-full md:w-48 relative">
          <select 
            value={carrier}
            onChange={e => setCarrier(e.target.value)}
            className="w-full appearance-none bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            <option value="fedex">FedEx</option>
            <option value="ups">UPS</option>
            <option value="usps">USPS</option>
            <option value="dhl">DHL</option>
          </select>
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-medium transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 whitespace-nowrap"
        >
          {isLoading ? 'Tracking...' : 'Track Package'}
        </button>
      </form>

      {errorMsg && (
        <div className="glass p-6 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-start gap-4 mb-8">
          <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-medium text-red-400 mb-1">Tracking Error</h3>
            <p className="text-sm text-red-300/80">{errorMsg}</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {trackingData && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-3xl border border-white/5 overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 bg-white/[0.02]">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">{trackingData.carrier}</p>
                  <h2 className="text-2xl font-bold text-white font-mono">{trackingData.tracking_number}</h2>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium capitalize">
                    {getStatusIcon(trackingData.status)}
                    {trackingData.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-8 relative">
              {trackingData.checkpoints && trackingData.checkpoints.length > 0 ? (
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-indigo-500/50 before:to-transparent">
                  {trackingData.checkpoints.map((cp, idx) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      
                      {/* Icon */}
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-gray-900 bg-indigo-600 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-lg shadow-indigo-600/30 z-10">
                        {getStatusIcon(cp.status)}
                      </div>
                      
                      {/* Content */}
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] glass p-5 rounded-2xl border border-white/5 shadow-xl transition-transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-white">{cp.status}</h4>
                          <span className="text-xs font-medium text-indigo-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(cp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-3">{cp.message}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {cp.location || 'Location unavailable'}
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                          {new Date(cp.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white">No Tracking History</h3>
                  <p className="text-sm text-gray-400">Tracking information is not yet available for this package.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
