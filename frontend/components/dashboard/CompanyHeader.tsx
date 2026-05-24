'use client'

import { useCompany } from '@/lib/hooks/useCompany'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'

export default function CompanyHeader() {
  const { company, isLoading } = useCompany() as any

  if (isLoading) {
    return (
      <div className="flex items-center gap-6 mb-8">
        <Skeleton className="w-20 h-20 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    )
  }

  const initials = company?.company_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'SZ'

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12"
    >
      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 rounded-[32px] overflow-hidden bg-gradient-to-br from-blue-600/20 to-cyan-400/20 border border-white/10 flex items-center justify-center shadow-xl">
          {company?.logo_url ? (
            <Image
              src={company.logo_url}
              alt={company.company_name}
              fill
              className="object-contain p-4"
              priority
            />
          ) : (
            <span className="text-4xl font-bold text-blue-400 font-space-grotesk">{initials}</span>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold font-space-grotesk text-white">
              {company?.company_name || 'My Company'}
            </h1>
            <Badge variant="blue">{company?.industry || 'Logistics'}</Badge>
          </div>
          <p className="text-zinc-500 font-medium">
            Welcome back! Here's what's happening with your packaging today.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <div className="text-xs text-blue-400 font-bold uppercase tracking-tighter">
          Terybi Intelligence Network v4.2
        </div>
      </div>
    </motion.div>
  )
}
