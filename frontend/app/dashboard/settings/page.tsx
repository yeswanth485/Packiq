'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  User, Building, Key, Bell, Shield, 
  Save, Eye, EyeOff, RefreshCw, Smartphone
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [profile, setProfile] = useState<any>({
    full_name: '',
    company: '',
    api_key: '',
    notification_prefs: {}
  })

  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (data) setProfile(data)
      }
      setLoading(false)
    }
    loadProfile()
  }, [supabase])

  const handleSave = async () => {
    setSaving(true)
    const { error } = await (supabase.from('profiles') as any)
      .update({
        full_name: profile.full_name,
        company: profile.company,
        api_key: profile.api_key
      })
      .eq('id', profile.id)

    if (error) toast.error('Failed to update settings')
    else toast.success('Settings updated successfully')
    setSaving(false)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div>
        <h1 className="text-3xl font-black text-white mb-2">Account Settings</h1>
        <p className="text-gray-500 text-sm">Manage your profile, organization, and AI integration keys.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-12">
        <div className="space-y-6">
           <nav className="space-y-2">
              {[
                { icon: User, label: 'Profile Info' },
                { icon: Building, label: 'Organization' },
                { icon: Key, label: 'AI Configuration' },
                { icon: Bell, label: 'Notifications' },
                { icon: Shield, label: 'Security' },
              ].map((item, i) => (
                <button key={i} className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${i === 0 ? 'bg-[#00E5CC]/10 text-[#00E5CC]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                   <item.icon className="w-4 h-4" />
                   {item.label}
                </button>
              ))}
           </nav>
        </div>

        <div className="md:col-span-2 space-y-10">
           {/* Profile Section */}
           <section className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-600 border-b border-white/5 pb-4">Personal Details</h3>
              <div className="grid gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Full Name</label>
                    <div className="relative">
                       <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                       <input 
                         type="text" 
                         value={profile.full_name}
                         onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                         className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-[#00E5CC]/30 transition-all font-bold text-sm"
                       />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Company Name</label>
                    <div className="relative">
                       <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                       <input 
                         type="text" 
                         value={profile.company}
                         onChange={(e) => setProfile({...profile, company: e.target.value})}
                         className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-[#00E5CC]/30 transition-all font-bold text-sm"
                       />
                    </div>
                 </div>
              </div>
           </section>

           {/* AI Section */}
           <section className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-600 border-b border-white/5 pb-4">Spatial AI Integration</h3>
              <div className="p-6 rounded-[32px] bg-[#00E5CC]/5 border border-[#00E5CC]/10 space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-[#00E5CC]/20 flex items-center justify-center text-[#00E5CC]">
                          <Key className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="text-sm font-black text-white">OpenRouter API Key</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Used for high-performance optimization</p>
                       </div>
                    </div>
                 </div>
                 <div className="relative">
                    <input 
                      type={showApiKey ? 'text' : 'password'}
                      value={profile.api_key}
                      onChange={(e) => setProfile({...profile, api_key: e.target.value})}
                      placeholder="sk-or-v1-..."
                      className="w-full bg-[#0A0A0F] border border-white/5 rounded-2xl pl-4 pr-12 py-4 text-white focus:outline-none focus:border-[#00E5CC]/30 transition-all font-mono text-sm"
                    />
                    <button 
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                    >
                       {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                 </div>
                 <p className="text-[10px] text-gray-600 leading-relaxed italic">
                    Your API key is encrypted and stored securely. This key is used to power the spatial reasoning engines behind the optimization module.
                 </p>
              </div>
           </section>

           <div className="flex justify-end pt-10">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-[#00E5CC] hover:bg-[#00c2ad] text-[#0A0A0F] px-10 py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl shadow-[#00E5CC]/20"
              >
                 {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 Save Preferences
              </button>
           </div>
        </div>
      </div>
    </div>
  )
}
