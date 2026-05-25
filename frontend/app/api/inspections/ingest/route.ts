import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const body = await req.json()
    const { line_id, unit_id, defect_type, confidence_score, status, image_url, model_version } = body

    if (!line_id || !unit_id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('inspections')
      .insert({
        line_id,
        unit_id,
        defect_type: defect_type || null,
        confidence_score,
        status,
        image_url: image_url || null,
        model_version: model_version || 'v1.0'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Ingest Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
