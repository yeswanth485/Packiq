import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do NOT add any logic between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protected routes - redirect to login if not authenticated
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Authenticated users - check onboarding status
  if (user) {
    // Skip redirect logic for API routes and static assets
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
      return supabaseResponse
    }

    // Get profile to check onboarding status
    let needsOnboarding = false
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()
      
      needsOnboarding = !profile || !(profile as any).onboarding_completed
      console.log(`[Middleware] User ${user.id}: needsOnboarding=${needsOnboarding}`)
    } catch (error) {
      console.error('[Middleware] Error fetching profile:', error)
      // If we can't get profile, assume onboarding is needed
      needsOnboarding = true
    }

    // If on auth/landing pages and onboarding is needed → go to onboarding
    if (needsOnboarding && (pathname.startsWith('/auth') || pathname === '/')) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding/company'
      url.search = ''
      return NextResponse.redirect(url)
    }

    // If on auth/landing pages and onboarding is complete → go to dashboard
    if (!needsOnboarding && (pathname.startsWith('/auth') || pathname === '/')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.search = ''
      return NextResponse.redirect(url)
    }

    // If trying to access onboarding but already completed → redirect to dashboard
    if (!needsOnboarding && pathname.startsWith('/onboarding')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Match all pages EXCEPT static files and API routes
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
