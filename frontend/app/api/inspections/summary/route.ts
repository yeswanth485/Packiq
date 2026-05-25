import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const line_id = searchParams.get('line_id')
    const from = searchParams.get('from') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const to = searchParams.get('to') || new Date().toISOString()

    if (!line_id) {
      return NextResponse.json({ error: 'Missing line_id' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase.rpc('get_line_summary', {
      p_line_id: line_id,
      p_from: from,
      p_to: to
    })

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Summary Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
