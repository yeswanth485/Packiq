import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const supabaseAdmin = await createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  if (type === 'orders') {
    const { data } = await supabaseAdmin
      .from('orders')
      .select('*, product_snapshot, box_snapshot, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    return NextResponse.json({ data })
  }
  
  if (type === 'sessions') {
    const { data } = await supabaseAdmin
      .from('optimization_sessions')
      .select('id, file_name, created_at, total_items, optimized_items, optimization_rate')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    return NextResponse.json({ data })
  }

  if (type === 'results') {
    const sessionId = searchParams.get('session_id')
    let q = supabaseAdmin
      .from('optimization_results')
      .select('*')
      .eq('user_id', user.id)
      
    if (sessionId && sessionId !== 'latest') {
      q = q.eq('session_id', sessionId)
    }
    
    const { data } = await q
      .order('is_optimized', { ascending: false })
      .order('savings_pct', { ascending: false })
      .limit(1000)

    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
}
