'use client'

import { usePathname } from 'next/navigation'
import { Bell, Search, Command, User, X, Clock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function TopBar({ profile }: { profile: any }) {
  const pathname = usePathname()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard'
    if (pathname.includes('/optimization')) return 'Optimization'
    if (pathname.includes('/orders')) return 'Orders'
    if (pathname.includes('/analytics')) return 'Analytics'
    if (pathname.includes('/tracking')) return 'Shipment Tracking'
    if (pathname.includes('/catalog')) return 'Catalog'
    if (pathname.includes('/settings')) return 'Settings'
    return 'Dashboard'
  }

  // Handle CMD+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsSearchOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <>
      <header className="flex-none h-[60px] flex items-center justify-between px-6 bg-[#0d0d18] border-b border-white/[0.06] shrink-0 z-30">
        {/* Left: Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">PackIQ</span>
          <span className="text-gray-600">/</span>
          <span className="font-semibold text-white tracking-tight">{getPageTitle()}</span>
        </div>
        
        {/* Center: Search Trigger */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between bg-[#151522] border border-white/5 hover:border-white/10 px-3 py-1.5 rounded-lg text-sm text-gray-400 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span>Search anywhere...</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-sans">⌘</kbd>
              <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-sans">K</kbd>
            </div>
          </button>
        </div>
        
        {/* Right: Actions & User */}
        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-white transition-colors relative p-2 rounded-lg hover:bg-white/5">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block"></div>
          
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-white group-hover:text-[#00E5CC] transition-colors">{profile?.full_name || 'User'}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center overflow-hidden shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-indigo-400" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Spotlight Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#05050a]/80 backdrop-blur-sm"
              onClick={() => setIsSearchOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed z-50 top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-[#0f0f1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center px-4 py-3 border-b border-white/5">
                <Search className="w-5 h-5 text-gray-400 mr-3" />
                <input 
                  autoFocus
                  placeholder="Search orders, shipments, settings..."
                  className="flex-1 bg-transparent border-none text-white focus:outline-none text-lg placeholder-gray-500"
                />
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1 text-gray-500 hover:text-white rounded bg-white/5 hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Recent Searches</h3>
                <div className="space-y-1">
                  {['Order #ORD-8439', 'Update Billing Details', 'Small Box Optimization'].map((item, i) => (
                    <button key={i} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 rounded-lg text-sm text-gray-300 transition-colors group">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-gray-500 group-hover:text-[#00E5CC]" />
                        {item}
                      </div>
                      <span className="text-xs text-gray-600 group-hover:text-gray-400">Jump to</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
