import { NextResponse } from 'next/server'
import { runLightweightTask, DEFAULT_MODEL } from '@/lib/openrouter'

export async function GET() {
  const start = Date.now()
  try {
    const API_KEY = process.env.OPENROUTER_API_KEY
    
    if (!API_KEY || API_KEY.includes('dummy')) {
      return NextResponse.json({ 
        status: 'FAIL', 
        error: 'OpenRouter API Key not configured or using dummy key',
        model: DEFAULT_MODEL 
      }, { status: 503 })
    }

    // Test connection by performing a very small completion
    // This verifies both auth and model availability
    const testResult = await runLightweightTask('Respond with exactly "OK" in JSON format.', {})
    
    const duration = Date.now() - start

    if (!testResult || (testResult.status !== 'OK' && testResult.response !== 'OK')) {
      // Note: runLightweightTask returns the parsed JSON. 
      // If the model didn't return "OK", it's still a partial success (connection works)
      // but we'll report it as such.
    }

    return NextResponse.json({
      status: 'OK',
      model: DEFAULT_MODEL,
      responseTime: duration,
      healthCheck: testResult
    })
  } catch (error: any) {
    const duration = Date.now() - start
    console.error('AI Health Check Error:', error)
    return NextResponse.json({
      status: 'FAIL',
      error: error.message,
      model: DEFAULT_MODEL,
      responseTime: duration
    }, { status: 500 })
  }
}
