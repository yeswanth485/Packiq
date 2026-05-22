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

  // 1. Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // 2. Protect Dashboard & Onboarding routes
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // 3. Handle Authenticated User Routing (database-free session metadata check)
  if (user) {
    // Skip for API/Static
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
      return supabaseResponse
    }

    // If user exists, ensure onboarding is complete before allowing dashboard access
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', user.id)
        .maybeSingle()

      // If profile doesn't exist OR onboarding_complete is not true, and trying to access dashboard
      const onboardingDone = profile?.onboarding_complete === true

      if (!onboardingDone && pathname.startsWith('/dashboard') && !pathname.startsWith('/onboarding')) {
        console.log(`[Middleware] User ${user.id} has not completed onboarding. Redirecting to /onboarding`)
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
    } catch (e) {
      console.error('[Middleware] Profile fetch error:', e)
      // If we can't check profile, but user is authenticated, we might want to be safe
      // but for now we let it pass to avoid blocking users on DB glitches
    }

    // Redirect to Dashboard if visiting Landing ('/') or Auth pages
    if (pathname === '/' || pathname.startsWith('/auth')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public assets with typical extensions (png, jpg, jpeg, gif, svg, webp, ico, css, js)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js)$).*)',
  ],
}
