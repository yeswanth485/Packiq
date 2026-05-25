import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase.from('user_profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()

  if ((profile as any)?.onboarding_completed) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#05050a]">
      {children}
    </div>
  )
}
