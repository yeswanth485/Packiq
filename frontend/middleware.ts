import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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
  
  // Check MFA status
  const { data: aal }: any = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  const needsMFA = aal && aal.nextLevel === 'aal2' && aal.currentLevel === 'aal1'

  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  const isOnboarding = request.nextUrl.pathname.startsWith('/onboarding')
  const isRoot = request.nextUrl.pathname === '/'

  // Redirect to login if not authenticated on protected routes
  if (!user && (isDashboard || isOnboarding)) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // If user is accessing dashboard but needs MFA, redirect to MFA screen
  if (user && (isDashboard || isOnboarding) && needsMFA) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/mfa'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login/signup/mfa if they are fully authenticated
  if (user && (isAuthRoute || isRoot) && !request.nextUrl.pathname.includes('callback')) {
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

    // If they are on login/signup/root and DON'T need MFA, redirect to dashboard
    // The dashboard layout will handle the onboarding check
    if ((request.nextUrl.pathname === '/auth/login' || request.nextUrl.pathname === '/auth/signup' || isRoot) && !needsMFA) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*', '/onboarding/:path*', '/'],
}
