import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // 1. Get user from auth header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No auth header' }, { status: 401 })
    }

    const { data: { user }, error: authError } =
      await adminClient.auth.getUser(authHeader.replace('Bearer ', ''))

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Query orders WITHOUT nested join (avoids PostgREST errors)
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')

    let query = adminClient
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    const { data: orders, error: ordersError } = await query

    if (ordersError) {
      console.error('Orders query error:', ordersError)
      return NextResponse.json({ error: ordersError.message }, { status: 500 })
    }

    // 3. For rows with product_id but no snapshot, fetch product separately
    const missingSnapshotOrders = (orders ?? []).filter(
      o => !o.product_snapshot && o.product_id
    )

    const productMap: Record<string, any> = {}
    if (missingSnapshotOrders.length > 0) {
      const productIds = [...new Set(missingSnapshotOrders.map(o => o.product_id))]
      const { data: products } = await adminClient
        .from('products')
        .select('*')
        .in('id', productIds)
      products?.forEach(p => { productMap[p.id] = p })
    }

    // 4. Merge and return
    const enrichedOrders = (orders ?? []).map(order => ({
      ...order,
      product: order.product_snapshot
        ? null  // already have snapshot
        : (order.product_id ? productMap[order.product_id] ?? null : null)
    }))

    console.log(`Orders fetched: ${enrichedOrders.length} for user ${user.id}`)

    return NextResponse.json({
      orders: enrichedOrders,
      count: enrichedOrders.length
    })

  } catch (err) {
    console.error('Orders API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
