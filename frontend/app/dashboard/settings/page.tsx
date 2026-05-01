'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  CheckCircle, Loader2, ExternalLink, User, CreditCard, Zap, 
  ShieldAlert, ShieldCheck, Key, Bell, Upload, RefreshCw, Smartphone
} from 'lucide-react'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'

const PLANS = [
  { key: 'pro',        name: 'Pro',        price: '$49/mo', optimizations: '500/month' },
  { key: 'enterprise', name: 'Enterprise', price: '$199/mo', optimizations: 'Unlimited' },
]

export default function SettingsPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('profile')
  const [profile, setProfile] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Profile Form state
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  // Security state
  const [password, setPassword] = useState('')
  const [updatingPassword, setUpdatingPassword] = useState(false)
  const [isMfaEnrolled, setIsMfaEnrolled] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [verifyingMfa, setVerifyingMfa] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])

  // Billing state
  const [upgrading, setUpgrading] = useState<string | null>(null)

  // API state
  const [apiKey, setApiKey] = useState('')
  const [testingApi, setTestingApi] = useState(false)
  const [apiStatus, setApiStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Notification state
  const [notifPrefs, setNotifPrefs] = useState({
    email_optimization: true,
    weekly_report: false,
    system_alerts: true
  })
  const [savingNotifs, setSavingNotifs] = useState(false)

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUser(user)
    
    // Fetch profile
    const { data }: any = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setProfile(data)
      setName(data.full_name || '')
      setCompany(data.company || '')
      setAvatarUrl(data.avatar_url || '')
      setApiKey(data.api_key || '')
      if (data.notification_prefs) {
        setNotifPrefs(data.notification_prefs)
      }
    }

    // Check MFA
    const { data: factors } = await supabase.auth.mfa.listFactors()
    const totpFactors = factors?.totp ?? []
    setIsMfaEnrolled(totpFactors.some((f) => f.status === 'verified'))

    // Active sessions mock (Supabase doesn't easily expose list of sessions via JS client directly for self, we'll mock it for now)
    setSessions([
      { id: '1', device: 'MacBook Pro - Chrome', location: 'San Francisco, CA', active: true, last_active: new Date().toISOString() },
      { id: '2', device: 'iPhone 13 - Safari', location: 'San Francisco, CA', active: false, last_active: new Date(Date.now() - 86400000).toISOString() }
    ])

    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchAllData() }, [fetchAllData])

  // --- Profile Handlers ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    const { error } = await (supabase as any).from('profiles').update({ full_name: name, company }).eq('id', user.id)
    if (error) toast.error(error.message)
    else toast.success('Profile updated')
    setSavingProfile(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true)
      if (!e.target.files || e.target.files.length === 0) return
      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      
      await (supabase as any).from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id)
      setAvatarUrl(data.publicUrl)
      toast.success('Avatar updated')
    } catch (error: any) {
      toast.error('Error uploading avatar')
      console.error(error)
    } finally {
      setUploadingAvatar(false)
    }
  }

  // --- Security Handlers ---
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingPassword(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) toast.error(error.message)
    else {
      toast.success('Password updated successfully')
      setPassword('')
    }
    setUpdatingPassword(false)
  }

  const handleStartMfaEnrollment = async () => {
    setEnrolling(true)
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
      if (error) throw error
      setFactorId(data.id)
      setQrCodeData(data.totp.qr_code)
    } catch (err: any) {
      toast.error(err.message || 'Failed to start MFA enrollment')
      setEnrolling(false)
    }
  }

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!factorId) return
    setVerifyingMfa(true)
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: mfaCode })
      if (error) throw error
      toast.success('MFA successfully enabled!')
      setIsMfaEnrolled(true)
      setEnrolling(false)
      setQrCodeData(null)
      setFactorId(null)
      setMfaCode('')
    } catch (err: any) {
      toast.error(err.message || 'Invalid code, please try again')
    } finally {
      setVerifyingMfa(false)
    }
  }

  const handleUnenrollMfa = async () => {
    if (!confirm('Are you sure you want to disable Two-Step Verification?')) return
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const verifiedFactor = factors?.totp?.find((f) => f.status === 'verified')
      if (verifiedFactor) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedFactor.id })
        if (error) throw error
        toast.success('MFA has been disabled')
        setIsMfaEnrolled(false)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to disable MFA')
    }
  }

  const handleRevokeSession = (id: string) => {
    setSessions(sessions.filter(s => s.id !== id))
    toast.success('Session revoked')
  }

  // --- Billing Handlers ---
  const handleUpgrade = async (plan: string) => {
    setUpgrading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.url) window.location.href = data.url
    } catch (err: any) {
      toast.error(err.message || 'Upgrade failed')
    } finally {
      setUpgrading(null)
    }
  }

  // --- API Handlers ---
  const handleRegenerateKey = async () => {
    if (!confirm('This will invalidate your current API key. Continue?')) return
    // In a real app, generate securely on server. We'll simulate here or use a DB function.
    // We configured DB to use gen_random_bytes(16) on insert, but for update we can do:
    const newKey = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0')).join('')
    
    const { error } = await (supabase as any).from('profiles').update({ api_key: newKey }).eq('id', user.id)
    if (error) toast.error('Failed to regenerate key')
    else {
      setApiKey(newKey)
      toast.success('API Key regenerated')
    }
  }

  const handleTestOpenRouter = async () => {
    setTestingApi(true)
    setApiStatus('idle')
    try {
      const res = await fetch('/api/settings/test-openrouter')
      if (res.ok) {
        setApiStatus('success')
        toast.success('Successfully connected to OpenRouter')
      } else {
        setApiStatus('error')
        toast.error('Failed to connect to OpenRouter')
      }
    } catch {
      setApiStatus('error')
    } finally {
      setTestingApi(false)
    }
  }

  // --- Notifications Handlers ---
  const handleSaveNotifs = async () => {
    setSavingNotifs(true)
    const { error } = await (supabase as any).from('profiles').update({ notification_prefs: notifPrefs }).eq('id', user.id)
    if (error) toast.error('Failed to save preferences')
    else toast.success('Notification preferences saved')
    setSavingNotifs(false)
  }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors'

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  )

  const isGoogleAuth = user?.app_metadata?.provider === 'google'

  return (
    <div className="fade-in space-y-8 max-w-4xl pb-10">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400 text-sm">Manage your account, security, billing, and integrations.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto no-scrollbar">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'security', label: 'Security', icon: ShieldCheck },
          { id: 'billing', label: 'Plan & Billing', icon: CreditCard },
          { id: 'api', label: 'API & Integrations', icon: Key },
          { id: 'notifications', label: 'Notifications', icon: Bell },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="pt-4">
        
        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-xl">
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-6">Personal Information</h3>
              
              <div className="flex items-center gap-6 mb-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-indigo-500/20 border-2 border-indigo-500/30 overflow-hidden flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-indigo-400" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-500 p-1.5 rounded-full cursor-pointer shadow-lg transition-colors">
                    <Upload className="w-4 h-4 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </label>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Profile Picture</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, GIF or PNG. 1MB max.</p>
                  {uploadingAvatar && <p className="text-xs text-indigo-400 mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Uploading...</p>}
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Full name</label>
                  <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Company</label>
                  <input className={inputCls} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Your company" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email {isGoogleAuth && '(Google Auth)'}</label>
                  <input className={`${inputCls} ${isGoogleAuth ? 'opacity-50 cursor-not-allowed' : ''}`} value={profile?.email || ''} disabled={isGoogleAuth} readOnly={isGoogleAuth} />
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={savingProfile} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
              {!isGoogleAuth && (
                <div className="glass rounded-2xl p-6 border border-white/5">
                  <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">New Password</label>
                      <input type="password" required className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password" minLength={6} />
                    </div>
                    <button type="submit" disabled={updatingPassword || !password} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                      {updatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                    </button>
                  </form>
                </div>
              )}

              <div className="glass rounded-2xl p-6 border border-white/5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      Two-Factor Authentication
                      {isMfaEnrolled && <CheckCircle className="w-4 h-4 text-green-400" />}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs">Secure your account with an authenticator app (TOTP).</p>
                  </div>
                </div>

                {!isMfaEnrolled && !enrolling && (
                  <button onClick={handleStartMfaEnrollment} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                    Enable 2FA
                  </button>
                )}

                {isMfaEnrolled && (
                  <button onClick={handleUnenrollMfa} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                    Disable 2FA
                  </button>
                )}

                {enrolling && qrCodeData && (
                  <div className="bg-black/20 rounded-xl p-4 mt-4 border border-white/5">
                    <p className="text-xs text-gray-400 mb-4">1. Scan this QR code with your authenticator app.</p>
                    <div className="bg-white p-3 rounded-xl inline-block mb-4">
                      <QRCodeSVG value={qrCodeData} size={150} />
                    </div>
                    <p className="text-xs text-gray-400 mb-2">2. Enter the 6-digit code to verify.</p>
                    <form onSubmit={handleVerifyMfa} className="flex gap-2">
                      <input 
                        type="text" 
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white tracking-[0.25em] font-mono focus:outline-none focus:border-indigo-500"
                      />
                      <button type="submit" disabled={verifyingMfa || mfaCode.length !== 6} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                        {verifyingMfa ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            <div className="glass rounded-2xl p-6 border border-white/5 h-fit">
              <h3 className="text-lg font-semibold text-white mb-4">Active Sessions</h3>
              <div className="space-y-4">
                {sessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${s.active ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-800 text-gray-400'}`}>
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white flex items-center gap-2">
                          {s.device}
                          {s.active && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Current</span>}
                        </p>
                        <p className="text-xs text-gray-500">{s.location} • {new Date(s.last_active).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {!s.active && (
                      <button onClick={() => handleRevokeSession(s.id)} className="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1.5 bg-red-500/10 rounded-lg">
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* BILLING TAB */}
        {activeTab === 'billing' && (
          <div className="space-y-6 max-w-2xl">
            <div className="glass rounded-2xl p-6 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-semibold text-white">Current Plan</h3>
              </div>
              <p className="text-gray-400 text-sm mb-6">
                You are currently on the <span className="text-amber-400 capitalize font-semibold">{profile?.plan}</span> plan.
                Used {profile?.optimizations_used} of {profile?.optimizations_limit === -1 ? 'Unlimited' : profile?.optimizations_limit} optimizations.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {PLANS.map((plan) => (
                  <div key={plan.key} className={`glass rounded-2xl p-6 border ${profile?.plan === plan.key ? 'border-amber-500/50 bg-amber-500/5' : 'border-white/5'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white font-bold text-lg">{plan.name}</span>
                      <span className="text-amber-400 font-bold text-lg">{plan.price}</span>
                    </div>
                    <ul className="text-gray-400 text-sm space-y-2 mb-6">
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> {plan.optimizations}</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Priority Support</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> Advanced Analytics</li>
                    </ul>
                    <button
                      onClick={() => handleUpgrade(plan.key)}
                      disabled={!!upgrading || profile?.plan === plan.key}
                      className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium transition-colors border border-white/10"
                    >
                      {upgrading === plan.key ? <Loader2 className="w-4 h-4 animate-spin" /> : profile?.plan !== plan.key ? <ExternalLink className="w-4 h-4" /> : null}
                      {profile?.plan === plan.key ? 'Current Plan' : `Upgrade to ${plan.name}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* API TAB */}
        {activeTab === 'api' && (
          <div className="space-y-6 max-w-xl">
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-2">Personal API Key</h3>
              <p className="text-xs text-gray-400 mb-6">Use this key to authenticate with our endpoints.</p>
              
              <div className="flex gap-2 mb-4">
                <input type="text" readOnly value={apiKey} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-indigo-300 font-mono text-sm focus:outline-none" />
                <button onClick={() => { navigator.clipboard.writeText(apiKey); toast.success('Copied') }} className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors">
                  Copy
                </button>
              </div>
              <button onClick={handleRegenerateKey} className="text-xs text-red-400 hover:text-red-300 font-medium">
                Regenerate Key
              </button>
            </div>

            <div className="glass rounded-2xl p-6 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">OpenRouter Integration</h3>
                  <p className="text-xs text-gray-400 mt-1">Check the status of your AI optimization engine.</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${apiStatus === 'success' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : apiStatus === 'error' ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-gray-600'}`} />
              </div>
              <button onClick={handleTestOpenRouter} disabled={testingApi} className="flex items-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/20 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                {testingApi ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Test Connection
              </button>
            </div>

            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-2">Hardware Integrations</h3>
              <p className="text-xs text-gray-400 mb-4">Endpoints for physical dimension scanners and scales.</p>
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-black/50 rounded-xl border border-white/5 text-gray-300">
                  <span className="text-green-400 font-bold mr-2">POST</span> /api/hardware/scan
                </div>
                <div className="p-3 bg-black/50 rounded-xl border border-white/5 text-gray-300">
                  <span className="text-blue-400 font-bold mr-2">GET</span> /api/hardware/status
                </div>
              </div>
              <a href="#" className="inline-block mt-4 text-sm text-indigo-400 hover:text-indigo-300">View Documentation &rarr;</a>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-6 max-w-xl">
            <div className="glass rounded-2xl p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-6">Notification Preferences</h3>
              
              <div className="space-y-6">
                {[
                  { id: 'email_optimization', label: 'Optimization Alerts', desc: 'Get an email when a large batch optimization finishes.' },
                  { id: 'weekly_report', label: 'Weekly Savings Report', desc: 'Receive a weekly summary of your packaging savings.' },
                  { id: 'system_alerts', label: 'System Alerts', desc: 'Important notices about your account or billing.' }
                ].map(setting => (
                  <div key={setting.id} className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-white">{setting.label}</h4>
                      <p className="text-xs text-gray-400 mt-1">{setting.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={notifPrefs[setting.id as keyof typeof notifPrefs]} 
                        onChange={(e) => setNotifPrefs({...notifPrefs, [setting.id]: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>
                ))}
              </div>
              
              <div className="pt-6 mt-6 border-t border-white/5">
                <button onClick={handleSaveNotifs} disabled={savingNotifs} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  {savingNotifs ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Preferences'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
