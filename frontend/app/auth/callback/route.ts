import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  const next = searchParams.get('next')

  console.log('[Auth Callback] Request received:', {
    url: request.url,
    code: code ? 'YES' : 'NO',
    next,
    error,
    origin
  })

  if (error) {
    console.error('[Auth Callback] Error param received:', error, error_description)
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error)}&message=${encodeURIComponent(error_description || '')}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    if (!sessionError) {
      console.log('[Auth Callback] Session exchange successful')
      // Get the logged in user to filter the profile query correctly
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        console.log('[Auth Callback] User found:', user.id)
        let { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', user.id)
          .maybeSingle()

        if (!profile) {
          console.log('[Auth Callback] Profile missing, creating one')
await (supabase.from('profiles') as any).insert({
  id: user.id,
  full_name: user.user_metadata?.full_name || user.email || '',
  onboarding_complete: false
}).select().single()
profile = { onboarding_complete: false } as any
        }

        if ((profile as any)?.onboarding_complete) {
          console.log('[Auth Callback] Onboarding complete, redirecting to dashboard')
          return NextResponse.redirect(`${origin}${next || '/dashboard'}`)
        }
      }
      
      console.log('[Auth Callback] Onboarding incomplete, redirecting to onboarding')
      return NextResponse.redirect(`${origin}/onboarding`)
    } else {
      console.error('[Auth Callback] Session error:', sessionError)
      return NextResponse.redirect(`${origin}/auth/login?error=session_error&message=${encodeURIComponent(sessionError.message)}`)
    }
  }

  // If no code was provided, redirect to login instead of a non-existent error page
  return NextResponse.redirect(`${origin}/auth/login?error=no_code`)
}
