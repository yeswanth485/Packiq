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

  let { data: profile } = await (supabase.from('profiles') as any)
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Create default profile if missing to prevent errors
    await (supabase.from('profiles') as any).insert({
      id: user.id,
      email: user.email,
      onboarding_completed: true
    })
    
    const { data: newProfile } = await (supabase.from('profiles') as any)
      .select('*')
      .eq('id', user.id)
      .single()
      
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
