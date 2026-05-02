import { NextRequest, NextResponse } from 'next/server'
import { sendVerificationCode, checkVerificationCode } from '@/lib/twilio'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, phoneNumber, code } = body

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    if (action === 'send') {
      const result = await sendVerificationCode(phoneNumber)
      if (result.success) {
        return NextResponse.json({ success: true, status: result.status })
      } else {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }
    } 
    
    if (action === 'verify') {
      if (!code) {
        return NextResponse.json({ error: 'Verification code is required' }, { status: 400 })
      }
      const result = await checkVerificationCode(phoneNumber, code)
      if (result.success) {
        return NextResponse.json({ success: true, status: result.status })
      } else {
        return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('[API Auth OTP] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
