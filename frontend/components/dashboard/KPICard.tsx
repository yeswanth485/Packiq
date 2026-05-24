'use client'

import { motion } from 'framer-motion'
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import CountUp from 'react-countup'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  unit?: string
  icon: LucideIcon
  trend?: number
  delay?: number
}

export default function KPICard({ title, value, unit, icon: Icon, trend, delay = 0 }: KPICardProps) {
  const isPositive = trend && trend > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative group p-6 bg-white/[0.03] border border-white/[0.08] rounded-3xl hover:border-blue-500/50 transition-all duration-500 overflow-hidden"
    >
      <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="p-3 bg-white/5 rounded-2xl group-hover:scale-110 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-all duration-500">
            <Icon className="w-6 h-6" />
          </div>
          {trend !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-black uppercase tracking-tighter",
              isPositive ? "text-emerald-400" : "text-red-400"
            )}>
              {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-white font-space-grotesk">
              <CountUp end={Number(value)} duration={2} separator="," decimals={Number(value) % 1 !== 0 ? 1 : 0} />
            </h3>
            {unit && <span className="text-lg font-medium text-zinc-500">{unit}</span>}
          </div>
        </div>
      </div>

      {/* Subtle Glow Pulse */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
    </motion.div>
  )
}
