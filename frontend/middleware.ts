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

  // 3. Handle Authenticated User Routing
  if (user) {
    // Skip for API/Static
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
      return supabaseResponse
    }

    // If user exists, ensure onboarding is complete before allowing dashboard access
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle()

      const onboardingDone = profile?.onboarding_completed === true

      if (!onboardingDone && pathname.startsWith('/dashboard') && !pathname.startsWith('/onboarding')) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
    } catch (e) {
      console.error('[Middleware] Profile fetch error:', e)
    }

    // Redirect to Dashboard if visiting Auth pages
    if (pathname.startsWith('/auth')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js)$).*)',
  ],
}
