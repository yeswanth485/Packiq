import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const PLAN_LIMITS: Record<string, number> = {
  'starter': 1000,
  'pro': 10000,
  'max': 1000000
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { amount, action } = await request.json()
    if (!amount) return NextResponse.json({ error: 'Amount required' }, { status: 400 })

    // Get current subscription
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })

    const plan = sub.plan || 'starter'
    const limit = PLAN_LIMITS[plan] || sub.monthly_limit || 1000
    const used = sub.used_this_month || 0

    if (used + amount > limit) {
      return NextResponse.json({ error: 'QUOTA_EXCEEDED', message: `You've used all your ${plan} plan tokens. Upgrade to continue.` }, { status: 403 })
    }

    // Deduct tokens
    const { data: updatedSub, error: updateErr } = await supabaseAdmin
      .from('subscriptions')
      .update({ used_this_month: used + amount })
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateErr) throw updateErr

    return NextResponse.json({
      success: true,
      used: updatedSub.used_this_month,
      limit,
      remaining: limit - updatedSub.used_this_month
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
