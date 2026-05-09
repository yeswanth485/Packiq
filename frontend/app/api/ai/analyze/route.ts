import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { line_id, data_sample } = await req.json()

    if (!line_id || !data_sample) {
      return NextResponse.json({ error: 'Missing line_id or data_sample' }, { status: 400 })
    }

    // Call OpenRouter API with Claude Haiku / Sonnet
    const openRouterRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku',
        messages: [
          {
            role: 'system',
            content: 'You are an AI packaging quality inspector. Analyze the provided inspection data sample and return a JSON object with: "summary" (string), "anomalies" (array of strings), "recommendations" (array of strings), "health_score" (integer 0-100).'
          },
          {
            role: 'user',
            content: JSON.stringify(data_sample)
          }
        ],
        response_format: { type: 'json_object' }
      })
    })

    if (!openRouterRes.ok) {
      throw new Error(`OpenRouter API error: ${await openRouterRes.text()}`)
    }

    const aiData = await openRouterRes.json()
    const resultContent = aiData.choices[0].message.content
    let parsedResult
    try {
      parsedResult = JSON.parse(resultContent)
    } catch (e) {
      parsedResult = { summary: 'Failed to parse AI response', anomalies: [], recommendations: [], health_score: 50 }
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('ai_analyses')
      .insert({
        line_id,
        model_used: 'claude',
        summary: parsedResult.summary,
        anomalies: parsedResult.anomalies,
        recommendations: parsedResult.recommendations,
        health_score: parsedResult.health_score,
        raw_response: aiData
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('AI Analysis Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
