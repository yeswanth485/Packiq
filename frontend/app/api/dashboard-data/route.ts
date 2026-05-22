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
    const { data: ordersData, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        user_id,
        optimization_result_id,
        optimization_session_id,
        product_snapshot,
        box_snapshot,
        quantity,
        total_cost,
        currency,
        status,
        created_at,
        optimization_results:optimization_result_id (
          is_optimized,
          failure_reason,
          old_box_name,
          old_box_dims,
          old_box_cost,
          new_box_id,
          new_box_name,
          new_box_dims,
          new_box_cost,
          ml_score,
          void_percentage,
          volume_utilization,
          savings_pct,
          savings_amount,
          recommendation_reason,
          fragility_level,
          fragility_score,
          zone,
          tracking_id,
          carrier
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('[API] Error loading orders:', ordersError);
    }

    const { data: unoptimizedData, error: unoptimizedError } = await supabaseAdmin
      .from('optimization_results')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_optimized', false)
      .order('created_at', { ascending: false });

    if (unoptimizedError) {
      console.error('[API] Error loading unoptimized:', unoptimizedError);
    }

    return NextResponse.json({
      orders: ordersData || [],
      unoptimized: unoptimizedData || []
    });
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
