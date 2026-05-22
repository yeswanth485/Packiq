import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Orders API] Database error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  const orders = data || []

  // If orders contain product_id, fetch product rows and merge server-side to avoid nested selects
  const productIds = Array.from(new Set(orders.map((o: any) => o.product_id).filter(Boolean)))
  let productsMap: Record<string, any> = {}
  if (productIds.length > 0) {
    try {
      const { data: products, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)

      if (!prodErr && products) {
        productsMap = Object.fromEntries((products as any[]).map(p => [p.id, p]))
      }
    } catch (e) {
      console.error('Error fetching products for orders:', e)
    }
  }

  const merged = orders.map((o: any) => ({
    ...o,
    product: productsMap[o.product_id] || o.product_snapshot || null
  }))

  return NextResponse.json({ orders: merged })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      product_id,
      optimization_session_id,
      optimization_result_id,
      box_id,
      quantity,
      total_cost,
      product_snapshot,
      box_snapshot,
      currency,
      status,
      tracking_number,
      carrier
    } = body

    const insertPayload: any = {
      user_id: user.id,
      product_id: product_id || (product_snapshot && product_snapshot.id) || null,
      optimization_session_id: optimization_session_id || body.optimization_id || null,
      optimization_result_id: optimization_result_id || null,
      sku: body.sku || (product_snapshot && product_snapshot.sku) || (product_snapshot && product_snapshot.product_id) || null,
      product_name: body.product_name || (product_snapshot && product_snapshot.name) || (product_snapshot && product_snapshot.product_name) || null,
      length_cm: body.length_cm || (product_snapshot && product_snapshot.length_cm) || null,
      width_cm: body.width_cm || (product_snapshot && product_snapshot.width_cm) || null,
      height_cm: body.height_cm || (product_snapshot && product_snapshot.height_cm) || null,
      weight_kg: body.weight_kg || (product_snapshot && product_snapshot.weight_kg) || null,
      fragility_level: body.fragility_level || (product_snapshot && (product_snapshot.fragility || product_snapshot.fragility_level)) || null,
      product_snapshot: product_snapshot || null,
      box_snapshot: box_snapshot || null,
      quantity: quantity || 1,
      total_cost: total_cost || body.total_cost_usd || (box_snapshot && box_snapshot.cost) || null,
      currency: currency || 'INR',
      status: status || 'pending',
      tracking_number: tracking_number || body.tracking_id || null,
      carrier: carrier || null
    }

    const { data, error } = await supabase
      .from('orders')
      .insert(insertPayload)
      .select()
      .single()

    if (error) throw error
      const order = data as any

      // Trigger quick re-analysis of the order's optimization result in the background
      try {
        const frontendHost = process.env.NEXT_PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || 'http://localhost:3000'
        // Fire-and-forget to the reanalyze API
        fetch(`${frontendHost}/api/optimize/reanalyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_ids: [order.id] })
        }).catch(() => {})
      } catch (e) {
        // ignore
      }

      return NextResponse.json({ order: order })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
