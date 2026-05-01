'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Zap,
  ShoppingCart,
  Archive,
  Settings,
  LogOut,
  Box,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const navItems = [
  { href: '/dashboard',          label: 'Dashboard',         icon: LayoutDashboard },
  { href: '/dashboard/upload',   label: 'Upload & Optimize', icon: Package },
  { href: '/dashboard/orders',   label: 'Orders',            icon: ShoppingCart },
  { href: '/dashboard/analytics',label: 'Analytics',         icon: Zap },
  { href: '/dashboard/tracking', label: 'Shipment Tracking', icon: Archive },
  { href: '/dashboard/catalog',  label: 'Box Catalog',       icon: Box },
  { href: '/dashboard/settings', label: 'Settings',          icon: Settings },
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
    <aside className="fixed left-0 top-0 h-full w-64 bg-black/40 backdrop-blur-xl border-r border-white/5 flex flex-col z-40">
      {/* Logo */}
      <div className="p-8 border-b border-white/5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
            <Box className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">PackIQ</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-6 space-y-2">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 ml-3">Menu</p>
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 relative group ${
                active
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/10'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {active && (
                <motion.div 
                  layoutId="active-nav"
                  className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
                />
              )}
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-blue-400' : 'group-hover:text-white'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-6 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-400/5 transition-all w-full group"
        >
          <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
