'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Building2, Mail, Phone, Globe, Save, Loader2, Key, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/Badge'

export default function SettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [company, setCompany] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('owner_user_id', user.id)
        .single()

      setProfile(profileData)
      setCompany(companyData)
      setLoading(false)
    }
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error: profileError } = await (supabase.from('profiles') as any)
        .update({
          full_name: profile.full_name,
        })
        .eq('id', profile.id)

      if (profileError) throw profileError

      const { error: companyError } = await (supabase.from('companies') as any)
        .update({
          company_name: company.company_name,
          industry: company.industry,
          address: company.address,
          phone: company.phone,
          website: company.website,
        })
        .eq('id', company.id)

      if (companyError) throw companyError

      toast.success('Settings updated successfully')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 pb-24 max-w-4xl mx-auto space-y-12">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold font-space-grotesk text-white">Settings</h1>
        <p className="text-zinc-500">Manage your company profile, billing, and API access.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Company Profile */}
        <div className="bg-white/[0.03] border border-white/10 rounded-[40px] p-8 md:p-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold font-space-grotesk text-white">Company Profile</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Company Name</label>
              <input
                type="text"
                value={company?.company_name || ''}
                onChange={e => setCompany({ ...company, company_name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Industry</label>
              <input
                type="text"
                value={company?.industry || ''}
                onChange={e => setCompany({ ...company, industry: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Address</label>
              <textarea
                value={company?.address || ''}
                onChange={e => setCompany({ ...company, address: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all h-32 resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Phone</label>
              <div className="relative group">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="tel"
                  value={company?.phone || ''}
                  onChange={e => setCompany({ ...company, phone: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Website</label>
              <div className="relative group">
                <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="url"
                  value={company?.website || ''}
                  onChange={e => setCompany({ ...company, website: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-white/[0.03] border border-white/10 rounded-[40px] p-8 md:p-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold font-space-grotesk text-white">Personal Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Full Name</label>
              <input
                type="text"
                value={profile?.full_name || ''}
                onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Email Address</label>
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-zinc-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Plan & Billing */}
        <div className="bg-white/[0.03] border border-white/10 rounded-[40px] p-8 md:p-10 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold font-space-grotesk text-white">Plan & Billing</h2>
            </div>
            <Badge variant="blue" className="px-4 py-2 uppercase tracking-widest">{profile?.plan || 'Starter'}</Badge>
          </div>

          <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/10">
            <div className="space-y-1">
              <p className="text-white font-bold">Manage Subscription</p>
              <p className="text-sm text-zinc-500">View invoices and change your plan.</p>
            </div>
            <button
              type="button"
              className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold transition-all border border-white/10"
            >
              Open Billing Portal
            </button>
          </div>
        </div>

        {/* API Access */}
        <div className="bg-white/[0.03] border border-white/10 rounded-[40px] p-8 md:p-10 space-y-8">
           <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                <Key className="w-6 h-6 text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold font-space-grotesk text-white">API Access</h2>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500 ml-1">Your API Key</label>
            <div className="flex gap-4">
              <input
                type="password"
                readOnly
                value="sk_live_............................"
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-zinc-500 font-mono"
              />
              <button
                type="button"
                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold transition-all border border-white/10"
              >
                Reveal
              </button>
              <button
                type="button"
                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold transition-all border border-white/10"
              >
                Regenerate
              </button>
            </div>
            <p className="text-xs text-zinc-500 ml-1 italic">Never share your API key with anyone.</p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-4 rounded-2xl font-bold transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] flex items-center gap-3 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}
