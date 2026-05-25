import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardProvider } from '@/lib/context/DashboardContext'
import DashboardLayoutClient from '@/components/dashboard/DashboardLayoutClient'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  let { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    // Create default profile if missing to prevent errors
    await (supabase.from('user_profiles') as any).insert({
      id: user.id,
      full_name: user.email || '',
      onboarding_completed: false
    })
    
    const { data: newProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      
    profile = newProfile
  }

  return (
    <DashboardProvider>
      <DashboardLayoutClient profile={profile}>
        {children}
      </DashboardLayoutClient>
    </DashboardProvider>
  )
}
