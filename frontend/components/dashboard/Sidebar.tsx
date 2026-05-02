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
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const navItems = [
  { href: '/dashboard',             label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/dashboard/upload',      label: 'Optimization',      icon: Zap },
  { href: '/dashboard/orders',      label: 'Orders',            icon: ShoppingCart },
  { href: '/dashboard/analytics',   label: 'Analytics',         icon: TrendingUp },
  { href: '/dashboard/tracking',    label: 'Tracking',          icon: Archive },
  { href: '/dashboard/catalog',     label: 'Catalog',           icon: Box },
  { href: '/dashboard/subscription',label: 'Subscription',      icon: CreditCard },
  { href: '/dashboard/settings',    label: 'Settings',          icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0A0A0F]/80 backdrop-blur-2xl border-r border-white/5 flex flex-col z-40">
      {/* Logo */}
      <div className="p-8 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00E5CC] to-[#3B82F6] flex items-center justify-center shadow-lg shadow-[#00E5CC]/20 group-hover:scale-110 transition-transform duration-300">
            <Package className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-xl tracking-tight">PackIQ</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-6 space-y-2">
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-4 ml-3">Menu</p>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 relative group ${
                active
                  ? 'bg-[#00E5CC]/10 text-[#00E5CC] border border-[#00E5CC]/10'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {active && (
                <motion.div 
                  layoutId="active-nav"
                  className="absolute left-0 w-1 h-6 bg-[#00E5CC] rounded-r-full"
                />
              )}
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-[#00E5CC]' : 'group-hover:text-white'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-6 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-400/5 transition-all w-full group"
        >
          <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
