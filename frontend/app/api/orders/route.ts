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
    const { product_id, optimization_id, box_id, quantity, total_cost_usd } = await req.json()
    
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        product_id,
        optimization_id,
        box_id,
        quantity: quantity || 1,
        total_cost_usd,
        status: 'pending'
      } as any)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ order: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
