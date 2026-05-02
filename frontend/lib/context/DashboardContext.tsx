'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DashboardStats {
  totalSavings: number
  ordersProcessed: number
  efficiency: number
  optimizationsCount: number
}

interface DashboardContextType {
  stats: DashboardStats
  refreshStats: () => Promise<void>
  isRefreshing: boolean
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<DashboardStats>({
    totalSavings: 0,
    ordersProcessed: 0,
    efficiency: 0,
    optimizationsCount: 0
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const supabase = createClient()

  const refreshStats = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all optimizations for this user
      const { data: optimizations, error } = await (supabase.from('optimizations') as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')

      if (error) throw error

      const totalSavings = (optimizations || []).reduce((acc: number, o: any) => acc + (o.cost_savings_usd || 0), 0)
      const count = (optimizations || []).length
      const avgEff = count > 0 
        ? (optimizations || []).reduce((acc: number, o: any) => acc + (o.efficiency_score || 0), 0) / count
        : 0

      setStats({
        totalSavings,
        ordersProcessed: count * 1.5, // Mocking orders count based on optimizations for now
        efficiency: avgEff,
        optimizationsCount: count
      })
    } catch (error) {
      console.error('Error refreshing dashboard stats:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [supabase])

  useEffect(() => {
    refreshStats()
  }, [refreshStats])

  return (
    <DashboardContext.Provider value={{ stats, refreshStats, isRefreshing }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}
