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
  User,
  Activity
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { href: '/dashboard',             label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/dashboard/optimization',label: 'Optimization',      icon: Zap },
  { href: '/dashboard/orders',      label: 'Orders',            icon: ShoppingCart },
  { href: '/dashboard/analytics',   label: 'Analytics',         icon: TrendingUp },
  { href: '/dashboard/catalog',     label: 'Box Catalog',       icon: Box },
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
      animate={{ width: isCollapsed ? 60 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-full bg-[#0A0A0F] border-r border-white/5 flex flex-col z-40"
    >
      {/* Logo & Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 h-[72px]">
        <Link href="/" className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
          <div className="w-8 h-8 rounded-lg bg-[#00FFD1] flex items-center justify-center shrink-0">
            <Box className="w-5 h-5 text-[#0A0A0F]" />
          </div>
          <span className="font-bold text-white text-xl font-syne tracking-tight whitespace-nowrap">PackIQ</span>
        </Link>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-500 hover:text-[#00FFD1] transition-colors shrink-0"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-hidden mt-4">
        {!isCollapsed && <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest mb-4 ml-3">Operations</p>}
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <div key={item.href} className="relative group px-1">
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 h-[44px] rounded-xl text-xs font-bold transition-all duration-300 relative ${
                  active
                    ? 'bg-[#00FFD1]/10 text-white'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-[#00FFD1]' : 'group-hover:text-white'}`} />
                
                {!isCollapsed && (
                  <span className="whitespace-nowrap uppercase tracking-widest">{item.label}</span>
                )}
                
                {active && !isCollapsed && (
                  <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#00FFD1] shadow-[0_0_8px_#00FFD1]" />
                )}
              </Link>
              
              {isCollapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-[#1a1a2e] text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-white/10 shadow-2xl">
                  {item.label}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User / Logout */}
      <div className="p-4 border-t border-white/5 flex flex-col gap-4">
        {!isCollapsed && (
          <div className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-2xl border border-white/5">
            <div className="w-8 h-8 rounded-full bg-[#00FFD1]/20 border border-[#00FFD1]/30 flex items-center justify-center shrink-0">
               <User className="w-4 h-4 text-[#00FFD1]" />
            </div>
            <div className="flex flex-col whitespace-nowrap overflow-hidden">
              <span className="text-[11px] font-bold text-white truncate">{profile?.full_name || 'Admin'}</span>
              <span className="text-[9px] text-gray-500 uppercase tracking-widest truncate">{profile?.company || 'Enterprise'}</span>
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-red-400 hover:bg-red-400/5 transition-all group ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Sign out</span>}
        </button>
      </div>
    </motion.aside>
  )
}
