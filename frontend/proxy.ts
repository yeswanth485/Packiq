import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')

  // Check MFA status
  const { data: aal }: any = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  const needsMFA = aal && aal.nextLevel === 'aal2' && aal.currentLevel === 'aal1'

  if (!user && isDashboard) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // If user is accessing dashboard but needs MFA, redirect to MFA screen
  if (user && isDashboard && needsMFA) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/mfa'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login/signup/mfa if they are fully authenticated
  if (user && isAuthRoute && !request.nextUrl.pathname.includes('callback')) {
    // If they are on MFA page but don't need MFA, redirect to dashboard
    if (request.nextUrl.pathname === '/auth/mfa' && !needsMFA) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // If they are on login/signup but need MFA, redirect to MFA
    if ((request.nextUrl.pathname === '/auth/login' || request.nextUrl.pathname === '/auth/signup') && needsMFA) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/mfa'
      return NextResponse.redirect(url)
    }

    // If they are on login/signup and DON'T need MFA, redirect to dashboard
    if ((request.nextUrl.pathname === '/auth/login' || request.nextUrl.pathname === '/auth/signup') && !needsMFA) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
}
