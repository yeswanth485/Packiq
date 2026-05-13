import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runBusinessSummary } from '@/lib/openrouter'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { results, shipmentsPerMonth = 1000 } = body

    if (!results || !Array.isArray(results)) {
      return NextResponse.json({ error: 'Results array required' }, { status: 400 })
    }

    const summary = await runBusinessSummary(results, shipmentsPerMonth)
    
    return NextResponse.json({ success: true, summary })
  } catch (error: any) {
    console.error('[Summary API] Fatal error:', error)
    return NextResponse.json({ error: error.message, success: false }, { status: 500 })
  }
}
