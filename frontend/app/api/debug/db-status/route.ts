import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServiceClient()

    const counts = await Promise.all([
      supabase.from('orders').select('*', { head: true, count: 'exact' }),
      supabase.from('optimization_results').select('*', { head: true, count: 'exact' }),
      supabase.from('optimization_sessions').select('*', { head: true, count: 'exact' }),
      supabase.from('products').select('*', { head: true, count: 'exact' }),
    ])

    const recentOrders = await supabase
      .from('orders')
      .select('id, user_id, product_id, product_snapshot, optimization_result_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50)

    const recentResults = await supabase
      .from('optimization_results')
      .select('id, session_id, user_id, sku, product_name, is_optimized, created_at')
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({
      counts: {
        orders: counts[0].count ?? null,
        optimization_results: counts[1].count ?? null,
        optimization_sessions: counts[2].count ?? null,
        products: counts[3].count ?? null,
      },
      recentOrders: recentOrders.data || [],
      recentResults: recentResults.data || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
