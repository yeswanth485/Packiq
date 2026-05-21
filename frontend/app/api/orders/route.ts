import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      products(name, sku),
      box_catalog(name, sku)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ orders: data })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { product_id, optimization_id, optimization_result_id, box_id, quantity, total_cost_usd, product_snapshot, box_snapshot } = await req.json()

    const insertPayload: any = {
      user_id: user.id,
      product_id: product_id || (product_snapshot && product_snapshot.id) || null,
      optimization_id: optimization_id || null,
      optimization_result_id: optimization_result_id || null,
      box_id: box_id || (box_snapshot && box_snapshot.id) || null,
      product_snapshot: product_snapshot || null,
      box_snapshot: box_snapshot || null,
      quantity: quantity || 1,
      total_cost: total_cost_usd || null,
      status: 'pending'
    }

    const { data, error } = await supabase
      .from('orders')
      .insert(insertPayload)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ order: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
