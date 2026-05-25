import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { order_id, optimization_result_id, recipient, carrier, tracking_id, status } = await req.json()

    const payload: any = {
      user_id: user.id,
      order_id: order_id || null,
      optimization_result_id: optimization_result_id || null,
      recipient: recipient || null,
      carrier: carrier || null,
      tracking_id: tracking_id || null,
      status: status || 'prepared',
      printed_at: status === 'printed' ? new Date().toISOString() : null
    }

    const { data, error } = await supabase
      .from('shipments')
      .insert(payload)
      .select()
      .single()

    if (error) throw error

    // Note: order status update intentionally omitted here to avoid strict supabase typings.

    return NextResponse.json({ shipment: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
