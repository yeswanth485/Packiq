import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  // Redirect to onboarding if not completed
  if (profile && !profile.onboarding_completed) {
    redirect('/onboarding/company')
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Sidebar />
      <main className="ml-64 min-h-screen relative">
        {/* Background Decorative Elements */}
        <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 p-8 pt-6">
          <TopBar profile={profile} />
          <div className="mt-8 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
