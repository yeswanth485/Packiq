export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Default redirect is to onboarding to ensure profile exists
  const next = searchParams.get('next') ?? '/onboarding/company'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if profile exists and onboarding is completed
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        // If onboarding is completed, go to dashboard. Otherwise, go to onboarding.
        const redirectUrl = (profile as any)?.onboarding_completed ? '/dashboard' : '/onboarding/company'
        
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'
        
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${redirectUrl}`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${redirectUrl}`)
        } else {
          return NextResponse.redirect(`${origin}${redirectUrl}`)
        }
      }
    } else {
      console.error('Auth callback error:', error.message)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
}
