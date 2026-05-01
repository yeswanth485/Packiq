'use client'

import { usePathname } from 'next/navigation'
import { Bell, User } from 'lucide-react'

export default function TopBar({ profile }: { profile: any }) {
  const pathname = usePathname()
  
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard'
    if (pathname.includes('/upload')) return 'Upload & Optimize'
    if (pathname.includes('/orders')) return 'Orders'
    if (pathname.includes('/analytics')) return 'Analytics'
    if (pathname.includes('/tracking')) return 'Shipment Tracking'
    if (pathname.includes('/catalog')) return 'Box Catalog'
    if (pathname.includes('/settings')) return 'Settings'
    return 'Dashboard'
  }

  return (
    <header className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{getPageTitle()}</h1>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="text-gray-400 hover:text-white transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
          <div className="flex flex-col text-right">
            <span className="text-sm font-medium text-white">{profile?.full_name || 'User'}</span>
            <span className="text-xs text-gray-400">{profile?.company || 'Company'}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-indigo-400" />
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
