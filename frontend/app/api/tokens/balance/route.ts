import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const PLAN_LIMITS: Record<string, number> = {
  'starter': 1000,
  'pro': 10000,
  'max': 1000000
}

export async function GET(request: NextRequest) {
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

    const { data: sub, error: subErr } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (subErr || !sub) {
      // Create default starter subscription if missing
      await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan: 'starter',
          used_this_month: 0,
          monthly_limit: 1000
        })

      return NextResponse.json({
        plan: 'starter',
        used: 0,
        limit: 1000,
        remaining: 1000,
        percentage: 0
      })
    }

    const plan = sub.plan || 'starter'
    const limit = PLAN_LIMITS[plan] || sub.monthly_limit || 1000
    const used = sub.used_this_month || 0

    return NextResponse.json({
      plan,
      used,
      limit,
      remaining: Math.max(0, limit - used),
      percentage: Math.min(100, Math.round((used / limit) * 100))
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
