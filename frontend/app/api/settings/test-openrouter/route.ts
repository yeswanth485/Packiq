import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const API_KEY = process.env.OPENROUTER_API_KEY
    
    if (!API_KEY) {
      return NextResponse.json({ success: false, error: 'OpenRouter API Key not configured in environment' }, { status: 400 })
    }

    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    })

    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Invalid API Key or connection failed' }, { status: 400 })
    }

    const data = await res.json()

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('OpenRouter Test Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
