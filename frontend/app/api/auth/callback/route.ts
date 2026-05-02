import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('[Auth Callback] Processing callback with code:', code ? 'present' : 'missing')

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing user sessions.
            }
          },
        },
      }
    )

    const { error, data } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[Auth Callback] Session exchange error:', error.message)
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('error', 'auth_callback_error')
      return NextResponse.redirect(loginUrl)
    }

    if (!data.session) {
      console.error('[Auth Callback] No session created after code exchange')
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('error', 'no_session_created')
      return NextResponse.redirect(loginUrl)
    }

    console.log('[Auth Callback] Session created for user:', data.session.user.id)

    // Verify session was created
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.error('[Auth Callback] Failed to verify session:', userError?.message)
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('error', 'session_verification_failed')
      return NextResponse.redirect(loginUrl)
    }

    // Final session establishment
    const redirectUrl = new URL(next, request.url)
    const response = NextResponse.redirect(redirectUrl)
    
    // In Next.js 15, we can also use cookies() to set, but it's already handled by the SSR client
    // Here we just ensure the redirect is clean
    console.log('[Auth Callback] Final redirect to:', next)
    return response
  }

  console.warn('[Auth Callback] No code provided in query params')
  const loginUrl = new URL('/auth/login', request.url)
  loginUrl.searchParams.set('error', 'no_code_provided')
  return NextResponse.redirect(loginUrl)
}

export const dynamic = 'force-dynamic'
