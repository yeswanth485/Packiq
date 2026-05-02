'use client'

import { useState } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'

interface DashboardLayoutClientProps {
  children: React.ReactNode
  profile: any
}

export default function DashboardLayoutClient({ children, profile }: DashboardLayoutClientProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[#050505] text-white flex overflow-hidden">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} profile={profile} />
      
      <main 
        className={`flex-1 relative transition-all duration-300 ${isCollapsed ? 'ml-[64px]' : 'ml-[240px]'}`}
      >
        {/* Background Ambient Glows */}
        <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#00E5CC]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col h-screen">
          {/* Fixed Header */}
          <TopBar profile={profile} />
          
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 relative">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
