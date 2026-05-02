'use client'

import { useDashboard } from '@/lib/context/DashboardContext'
import StatCard from '@/components/dashboard/StatCard'
import SavingsChart from '@/components/charts/SavingsChart'
import BoxUsageChart from '@/components/charts/BoxUsageChart'
import { DollarSign, Package, Zap, Percent, UploadCloud, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function DashboardClient() {
  const { stats, isRefreshing } = useDashboard()

  // Mock chart data for distribution
  const boxDistribution = [
    { name: 'Small Box', value: 400 },
    { name: 'Medium Box', value: 300 },
    { name: 'Large Box', value: 300 },
    { name: 'Custom Pouch', value: 200 },
  ]

  // Mock weekly savings data
  const chartData = [
    { date: 'Week 1', savings: 120 },
    { date: 'Week 2', savings: 280 },
    { date: 'Week 3', savings: 450 },
    { date: 'Week 4', savings: 720 },
  ]

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-white">Central Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
            Real-time logistics spatial intelligence
            {isRefreshing && <RefreshCw className="w-3 h-3 animate-spin text-[#00E5CC]" />}
          </p>
        </div>
        <Link href="/dashboard/upload" className="flex items-center gap-2 bg-[#00E5CC] hover:bg-[#00c2ad] text-[#0A0A0F] px-6 py-3 rounded-2xl text-sm font-black transition-all shadow-lg shadow-[#00E5CC]/20 hover:scale-105">
          <UploadCloud className="w-4 h-4" />
          Run Optimization
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          label="Total Savings" 
          value={stats.totalSavings} 
          icon={<DollarSign className="w-5 h-5" />} 
          color="green" 
          isCurrency 
        />
        <StatCard 
          label="Orders Processed" 
          value={stats.ordersProcessed} 
          icon={<Package className="w-5 h-5" />} 
          color="indigo" 
          isNumber 
        />
        <StatCard 
          label="Optimization Efficiency" 
          value={stats.efficiency} 
          icon={<Percent className="w-5 h-5" />} 
          color="amber" 
          isPercentage 
        />
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8 border-white/5 bg-white/[0.01]"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">Savings Over Time</h3>
            <TrendingUp className="w-4 h-4 text-[#00E5CC]" />
          </div>
          <SavingsChart data={chartData} />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-8 border-white/5 bg-white/[0.01]"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">Box Usage Distribution</h3>
            <Box className="w-4 h-4 text-blue-400" />
          </div>
          <BoxUsageChart data={boxDistribution} />
        </motion.div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: 'Catalog', icon: Box, href: '/dashboard/catalog', color: 'text-blue-400' },
          { label: 'Tracking', icon: Archive, href: '/dashboard/tracking', color: 'text-green-400' },
          { label: 'Analytics', icon: TrendingUp, href: '/dashboard/analytics', color: 'text-[#00E5CC]' },
          { label: 'Settings', icon: Settings, href: '/dashboard/settings', color: 'text-gray-400' }
        ].map((item, i) => (
          <Link key={i} href={item.href} className="glass p-6 rounded-2xl border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm text-gray-300">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function RefreshCw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
}

function Box(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}

function Archive(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="5" x="2" y="3" rx="1" />
      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
      <path d="M10 12h4" />
    </svg>
  )
}

function Settings(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
