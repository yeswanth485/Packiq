'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useInspectionFeed(lineId?: string) {
  const [inspections, setInspections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    async function fetchInspections() {
      let query = supabase
        .from('inspections')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20)

      if (lineId) {
        query = query.eq('line_id', lineId)
      }

      const { data, error } = await query
      if (!error && data) {
        setInspections(data)
      }
      setLoading(false)
    }

    fetchInspections()

    // Real-time subscription
    const channel = supabase
      .channel('realtime_inspections')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'inspections' },
        (payload) => {
          if (!lineId || payload.new.line_id === lineId) {
            setInspections((prev) => [payload.new, ...prev].slice(0, 20))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineId])

  return { inspections, loading }
}
