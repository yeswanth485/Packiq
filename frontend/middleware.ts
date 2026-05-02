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

    // Check Onboarding
    let onboardingCompleted = false
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()
      
      onboardingCompleted = !!profile?.onboarding_completed
    } catch (e) {
      onboardingCompleted = false
    }

    // Redirect to Onboarding if not done
    if (!onboardingCompleted && !pathname.startsWith('/onboarding') && !pathname.startsWith('/auth')) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding/company'
      return NextResponse.redirect(url)
    }

    // Redirect to Dashboard if done and on Landing/Auth
    if (onboardingCompleted && (pathname === '/' || pathname.startsWith('/auth'))) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
