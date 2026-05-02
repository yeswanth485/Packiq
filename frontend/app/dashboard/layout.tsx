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

  const { data: profile } = await (supabase.from('profiles') as any)
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.onboarding_completed) {
    redirect('/onboarding')
  }

  return (
    <DashboardProvider>
      <DashboardLayoutClient profile={profile}>
        {children}
      </DashboardLayoutClient>
    </DashboardProvider>
  )
}
