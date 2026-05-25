import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { line_id, rejection_rate_threshold, confidence_threshold, alert_email, alert_webhook_url, is_active } = await req.json()

    if (!line_id) {
      return NextResponse.json({ error: 'Missing line_id' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Upsert config for the given line_id
    const { data, error } = await supabase
      .from('alert_configs')
      .upsert({
        line_id,
        rejection_rate_threshold: rejection_rate_threshold || 0.03,
        confidence_threshold: confidence_threshold || 0.70,
        alert_email,
        alert_webhook_url,
        is_active: is_active ?? true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'line_id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Alert Config Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
