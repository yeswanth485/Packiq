'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
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

const CACHE_TTL = 60_000 // 60 seconds

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState<DashboardStats>({
    totalSavings: 0,
    ordersProcessed: 0,
    efficiency: 0,
    optimizationsCount: 0
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const supabase = createClient()
  
  // Use a ref to store cache tied to the current user ID to fix multi-user bug
  const statsCacheRef = useRef<{ data: DashboardStats; ts: number; userId: string } | null>(null)

  const refreshStats = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check cache validity against current user
      if (
        statsCacheRef.current && 
        statsCacheRef.current.userId === user.id && 
        Date.now() - statsCacheRef.current.ts < CACHE_TTL
      ) {
        setStats(statsCacheRef.current.data)
        return
      }

      // Read from optimization_sessions (new schema)
      const { data: sessions, error } = await (supabase.from('optimization_sessions') as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')

      if (error) throw error

      const totalSavings = (sessions || []).reduce((acc: number, s: any) => acc + (s.estimated_savings || 0), 0)
      const count = (sessions || []).length
      const totalItems = (sessions || []).reduce((acc: number, s: any) => acc + (s.total_items || 0), 0)
      const totalOptimized = (sessions || []).reduce((acc: number, s: any) => acc + (s.optimized_items || 0), 0)
      const avgEff = totalItems > 0 ? (totalOptimized / totalItems) * 100 : 0

      const newStats = {
        totalSavings,
        ordersProcessed: totalItems,
        efficiency: avgEff,
        optimizationsCount: count
      }

      setStats(newStats)
      statsCacheRef.current = { data: newStats, ts: Date.now(), userId: user.id }
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
