import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <div className="min-h-screen animated-bg">
      <Sidebar />
      <main className="ml-60 p-8 min-h-screen flex flex-col">
        <TopBar profile={profile} />
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}
