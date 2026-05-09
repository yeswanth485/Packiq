import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/dashboard'

  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error)}&message=${encodeURIComponent(error_description || '')}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    if (!sessionError) {
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      return NextResponse.redirect(`${origin}/auth/login?error=session_error&message=${encodeURIComponent(sessionError.message)}`)
    }
  }

  // If no code was provided, redirect to login instead of a non-existent error page
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
}
