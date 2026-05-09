import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const line_id = searchParams.get('line_id')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let query = supabase.from('ai_analyses').select('*').order('created_at', { ascending: false }).limit(20)

    if (line_id) {
      query = query.eq('line_id', line_id)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('AI Analyses Fetch Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
