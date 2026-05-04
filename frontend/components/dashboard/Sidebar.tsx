'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Zap,
  ShoppingCart,
  Archive,
  Box,
  TrendingUp,
  Settings,
  CreditCard,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { href: '/dashboard',             label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/dashboard/optimization',label: 'Optimization',      icon: Zap },
  { href: '/dashboard/orders',      label: 'Orders',            icon: ShoppingCart },
  { href: '/dashboard/analytics',   label: 'Analytics',         icon: TrendingUp },
  { href: '/dashboard/tracking',    label: 'Tracking',          icon: Archive },
  { href: '/dashboard/catalog',     label: 'Catalog',           icon: Box },
  { href: '/dashboard/subscription',label: 'Subscription',      icon: CreditCard },
  { href: '/dashboard/settings',    label: 'Settings',          icon: Settings },
]

export default function Sidebar({ isCollapsed, setIsCollapsed, profile }: any) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <motion.aside 
      animate={{ width: isCollapsed ? 40 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full bg-[#0a0a12] border-r border-white/5 flex flex-col z-40"
    >
      {/* Logo & Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 h-[72px]">
        <Link href="/" className={`flex items-center gap-3 group overflow-hidden ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
          <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[#00E5CC] to-[#3B82F6] flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight whitespace-nowrap">PackIQ</span>
        </Link>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors shrink-0"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-hidden mt-4">
        {!isCollapsed && <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3 ml-2">Menu</p>}
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <div key={item.href} className="relative group">
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 h-[40px] rounded-xl text-[13px] font-medium transition-all duration-300 relative ${
                  active
                    ? 'bg-[#00E5CC]/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {active && (
                  <motion.div 
                    layoutId="active-nav-sidebar"
                    className="absolute left-0 w-[3px] h-5 bg-[#00E5CC] rounded-r-full"
                  />
                )}
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-[#00E5CC]' : 'group-hover:text-white'}`} />
                
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span 
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-white/10 pointer-events-none">
                  {item.label}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User / Logout */}
      <div className="p-4 border-t border-white/5 flex flex-col gap-2">
        <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
             {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
             ) : (
                <User className="w-4 h-4 text-indigo-400" />
             )}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col whitespace-nowrap">
              <span className="text-xs font-medium text-white">{profile?.full_name || 'User'}</span>
              <span className="text-[10px] text-gray-500">{profile?.company || 'Company'}</span>
            </div>
          )}
        </div>
        
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-400/5 transition-all group ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Sign out</span>}
        </button>
      </div>
    </motion.aside>
  )
}
