import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase.from('profiles')
    .select('onboarding_complete')
    .eq('id', user.id)
    .maybeSingle()

  if ((profile as any)?.onboarding_complete) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#05050a]">
      {children}
    </div>
  )
}
