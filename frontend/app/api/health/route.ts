import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'PackIQ API', timestamp: new Date().toISOString() })
}
