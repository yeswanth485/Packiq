'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  User, Building, Key, Bell, Shield, 
  Save, Eye, EyeOff, RefreshCw, Smartphone,
  Link as LinkIcon, Palette, AlertTriangle, 
  Mail, Phone, Globe, Trash2, LogOut, 
  ChevronRight, CheckCircle2, ShieldCheck,
  Smartphone as PhoneIcon, Plus, Info, X, Upload
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// --- CATEGORIES ---
const CATEGORIES = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'company', label: 'Company', icon: Building },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: LinkIcon },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, color: 'text-red-400' },
]

// --- COMPONENTS ---

function Toggle({ checked, onChange, label, description }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-all">
      <div>
        <p className="text-sm font-bold text-white mb-0.5">{label}</p>
        <p className="text-xs text-gray-500 font-medium">{description}</p>
      </div>
      <button 
        onClick={() => onChange(!checked)}
        className={`w-12 h-6 rounded-full relative transition-all duration-300 ${checked ? 'bg-[#4361EE]' : 'bg-gray-800'}`}
      >
        <motion.div 
          animate={{ x: checked ? 26 : 4 }}
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  )
}

function SaveButton({ saving, saved, onClick, label = 'Save Changes' }: any) {
  return (
    <button 
      onClick={onClick}
      disabled={saving || saved}
      className={`min-w-[160px] flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl ${
        saved 
          ? 'bg-green-500 text-white cursor-default' 
          : 'bg-[#4361EE] hover:bg-[#344FDA] text-white shadow-[#4361EE]/20'
      } ${saving ? 'opacity-80' : ''}`}
    >
      {saving ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : saved ? (
        <><CheckCircle2 className="w-4 h-4" /> Saved</>
      ) : (
        <><Save className="w-4 h-4" /> {label}</>
      )}
    </button>
  )
}

// --- MAIN PAGE ---

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  const [formData, setFormData] = useState<any>({
    full_name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 (555) 000-0000',
    company_name: 'Acme Logistics',
    industry: 'Logistics',
    website: 'https://acme.com',
    notifications: { email: true, sms: false, orders: true, costs: true, reports: false },
    appearance: { theme: 'dark', color: 'blue', compact: false }
  })

  useEffect(() => {
    // Simulate initial load
    setTimeout(() => setLoading(false), 500)
  }, [])

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setIsDirty(false)
      setTimeout(() => setSaved(false), 2000)
    }, 1000)
  }

  const updateForm = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  const updateNested = (category: string, key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [category]: { ...prev[category], [key]: value }
    }))
    setIsDirty(true)
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 pb-24 px-4 md:px-0 relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
          <p className="text-gray-400 text-sm">Manage your profile, organization, and preferences.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 min-h-[600px]">
        
        {/* Sidebar */}
        <div className="w-full md:w-[240px] flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
          {CATEGORIES.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-bold transition-all shrink-0 md:shrink ${
                activeTab === cat.id 
                  ? 'bg-white/10 text-white border-l-2 border-[#4361EE]' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5 border-l-2 border-transparent'
              } ${cat.color || ''}`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            
            {/* Unsaved Changes Bar */}
            {isDirty && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="absolute -top-4 left-0 right-0 z-20 flex justify-center"
              >
                <div className="bg-amber-500/90 backdrop-blur-md text-[#0A0A0F] px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl">
                  <Info className="w-3 h-3" /> You have unsaved changes
                </div>
              </motion.div>
            )}

            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="bg-[#0f0f1a] border border-white/[0.06] rounded-[32px] p-8 md:p-10 shadow-2xl h-fit"
            >
              {/* Profile Panel */}
              {activeTab === 'profile' && (
                <div className="space-y-10">
                  <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-[#4361EE]/10 flex items-center justify-center overflow-hidden border-2 border-dashed border-white/10 group-hover:border-[#4361EE]/50 transition-all cursor-pointer">
                        <User className="w-10 h-10 text-[#4361EE]" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                           <RefreshCw className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <p className="text-center text-[10px] font-bold text-gray-500 mt-2">Change Avatar</p>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Personal Profile</h3>
                      <p className="text-xs text-gray-500">Update your account information and how people see you.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 pt-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-1">Full Name</label>
                        <input 
                          type="text" 
                          value={formData.full_name} 
                          onChange={(e) => updateForm('full_name', e.target.value)}
                          className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#4361EE]/50 transition-all font-bold text-sm" 
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-1">Email Address</label>
                        <input 
                          type="email" 
                          value={formData.email} 
                          readOnly 
                          className="w-full bg-white/[0.01] border border-white/5 rounded-2xl px-5 py-4 text-gray-500 font-bold text-sm cursor-not-allowed opacity-60" 
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-1">Phone Number</label>
                        <input 
                          type="text" 
                          value={formData.phone} 
                          onChange={(e) => updateForm('phone', e.target.value)}
                          className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#4361EE]/50 transition-all font-bold text-sm" 
                        />
                     </div>
                  </div>

                  <div className="flex justify-end pt-8 border-t border-white/5">
                     <SaveButton saving={saving} saved={saved} onClick={handleSave} />
                  </div>
                </div>
              )}

              {/* Company Panel */}
              {activeTab === 'company' && (
                <div className="space-y-10">
                  <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 relative group cursor-pointer">
                       <Building className="w-10 h-10 text-gray-600" />
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl">
                           <Upload className="w-5 h-5 text-white" />
                       </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Company Information</h3>
                      <p className="text-xs text-gray-500">Manage your organization details and team members.</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-1">Legal Entity Name</label>
                        <input 
                          type="text" 
                          value={formData.company_name} 
                          onChange={(e) => updateForm('company_name', e.target.value)}
                          className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#4361EE]/50 transition-all font-bold text-sm" 
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-1">Industry</label>
                        <select 
                          value={formData.industry} 
                          onChange={(e) => updateForm('industry', e.target.value)}
                          className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#4361EE]/50 transition-all font-bold text-sm appearance-none"
                        >
                          <option>Logistics</option>
                          <option>Retail</option>
                          <option>Manufacturing</option>
                          <option>Other</option>
                        </select>
                     </div>
                  </div>

                  <div className="pt-8 space-y-6">
                     <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <h4 className="text-sm font-bold text-white">Team Members</h4>
                        <button 
                          onClick={() => setIsInviteModalOpen(true)}
                          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#4361EE] hover:text-white transition-colors"
                        >
                           <Plus className="w-3.5 h-3.5" /> Invite Member
                        </button>
                     </div>
                     <div className="space-y-3">
                        {[
                          { name: 'John Doe', role: 'Owner', email: 'john@acme.com' },
                          { name: 'Jane Smith', role: 'Admin', email: 'jane@acme.com' },
                          { name: 'Bob Wilson', role: 'Viewer', email: 'bob@acme.com' }
                        ].map((member, i) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-xs text-gray-400">
                                   {member.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-white">{member.name}</p>
                                   <p className="text-xs text-gray-500">{member.email}</p>
                                </div>
                             </div>
                             <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${member.role === 'Owner' ? 'bg-[#4361EE]/10 text-[#4361EE]' : 'bg-white/5 text-gray-500'}`}>
                                {member.role}
                             </span>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="flex justify-end pt-4">
                     <SaveButton saving={saving} saved={saved} onClick={handleSave} />
                  </div>
                </div>
              )}

              {/* Security Panel */}
              {activeTab === 'security' && (
                <div className="space-y-10">
                  <h3 className="text-xl font-bold text-white mb-6">Security & Authentication</h3>

                  <div className="space-y-6 bg-white/[0.02] border border-white/5 rounded-3xl p-8">
                     <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                        <Key className="w-4 h-4 text-[#4361EE]" /> Change Password
                     </h4>
                     <div className="grid gap-6">
                        <div className="grid md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">New Password</label>
                              <input type="password" placeholder="••••••••" className="w-full bg-[#0A0A0F] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#4361EE]/50 transition-all" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Confirm Password</label>
                              <input type="password" placeholder="••••••••" className="w-full bg-[#0A0A0F] border border-white/10 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-[#4361EE]/50 transition-all" />
                           </div>
                        </div>
                        <button className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-xl text-xs font-bold w-fit transition-all border border-white/10">
                           Update Password
                        </button>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                        <Smartphone className="w-4 h-4 text-purple-400" /> Two-Factor Authentication
                     </h4>
                     <Toggle 
                       label="Enable 2FA" 
                       description="Add an extra layer of security to your account with authenticator apps." 
                       checked={false} 
                       onChange={() => toast.info('2FA setup flow triggered')} 
                     />
                  </div>

                  <div className="space-y-6 pt-6">
                     <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <h4 className="text-sm font-bold text-white">Active Sessions</h4>
                        <button className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors">Sign Out All Devices</button>
                     </div>
                     <div className="space-y-3">
                        {[
                          { device: 'MacBook Pro — Chrome', location: 'San Francisco, CA', last: 'Active Now', current: true },
                          { device: 'iPhone 15 — Safari', location: 'San Jose, CA', last: '2h ago' }
                        ].map((session, i) => (
                          <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500">
                                   {session.device.includes('iPhone') ? <PhoneIcon className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                                </div>
                                <div>
                                   <div className="flex items-center gap-2">
                                      <p className="text-sm font-bold text-white">{session.device}</p>
                                      {session.current && <span className="text-[8px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full uppercase tracking-widest">Current</span>}
                                   </div>
                                   <p className="text-xs text-gray-500">{session.location} • {session.last}</p>
                                </div>
                             </div>
                             {!session.current && (
                               <button className="text-[10px] font-bold text-gray-600 hover:text-red-400 transition-colors uppercase tracking-widest">Revoke</button>
                             )}
                          </div>
                        ))}
                     </div>
                  </div>
                </div>
              )}

              {/* Notifications Panel */}
              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <h3 className="text-xl font-bold text-white mb-6">Notification Preferences</h3>
                  
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-1">General Alerts</h4>
                    <Toggle 
                      label="Email Notifications" 
                      description="Receive weekly summaries and important account updates via email."
                      checked={formData.notifications.email}
                      onChange={(val: any) => updateNested('notifications', 'email', val)}
                    />
                    <Toggle 
                      label="SMS Alerts" 
                      description="Get high-priority alerts directly to your mobile phone."
                      checked={formData.notifications.sms}
                      onChange={(val: any) => updateNested('notifications', 'sms', val)}
                    />
                  </div>

                  <div className="space-y-4 pt-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-1">Logistics & Costs</h4>
                    <Toggle 
                      label="Order Updates" 
                      description="Real-time status changes for your active shipments."
                      checked={formData.notifications.orders}
                      onChange={(val: any) => updateNested('notifications', 'orders', val)}
                    />
                    <Toggle 
                      label="Cost Alerts" 
                      description="Get notified if shipping costs exceed your weekly budget threshold."
                      checked={formData.notifications.costs}
                      onChange={(val: any) => updateNested('notifications', 'costs', val)}
                    />
                  </div>

                  <div className="flex justify-end pt-8">
                     <SaveButton saving={saving} saved={saved} onClick={handleSave} />
                  </div>
                </div>
              )}

              {/* Integrations Panel */}
              {activeTab === 'integrations' && (
                <div className="space-y-10">
                  <h3 className="text-xl font-bold text-white mb-6">Connected Apps</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {[
                      { name: 'Shopify', status: 'Connected', logo: 'S', color: 'bg-[#95BF47]' },
                      { name: 'WooCommerce', status: 'Available', logo: 'W', color: 'bg-[#96588A]' },
                      { name: 'FedEx API', status: 'Connected', logo: 'F', color: 'bg-[#4D148C]' },
                      { name: 'ShipStation', status: 'Available', logo: 'SS', color: 'bg-[#00385F]' }
                    ].map((app, i) => (
                      <div key={i} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 group hover:border-white/10 transition-all">
                        <div className="flex justify-between items-start mb-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl ${app.color}`}>
                             {app.logo}
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${app.status === 'Connected' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-500'}`}>
                             {app.status}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-1">{app.name}</h4>
                        <p className="text-xs text-gray-500 mb-6">Sync orders and inventory in real-time.</p>
                        <button className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all border ${app.status === 'Connected' ? 'bg-white/5 border-white/5 text-gray-400 hover:text-red-400 hover:border-red-400/20' : 'bg-[#4361EE] border-[#4361EE] text-white hover:bg-[#344FDA]'}`}>
                           {app.status === 'Connected' ? 'Disconnect' : 'Connect App'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appearance Panel */}
              {activeTab === 'appearance' && (
                <div className="space-y-10">
                  <h3 className="text-xl font-bold text-white mb-6">Interface Settings</h3>

                  <div className="space-y-6">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-1">Theme Preferences</h4>
                     <div className="grid grid-cols-3 gap-4">
                        {['light', 'dark', 'system'].map((t) => (
                          <button 
                            key={t}
                            onClick={() => updateNested('appearance', 'theme', t)}
                            className={`p-4 rounded-2xl border transition-all text-center ${formData.appearance.theme === t ? 'bg-[#4361EE]/10 border-[#4361EE] text-white' : 'bg-white/[0.02] border-white/5 text-gray-500 hover:border-white/10'}`}
                          >
                             <div className={`h-12 w-full rounded-lg mb-3 ${t === 'light' ? 'bg-gray-100' : t === 'dark' ? 'bg-[#0A0A0F]' : 'bg-gradient-to-r from-gray-100 to-[#0A0A0F]'}`} />
                             <span className="text-[10px] font-black uppercase tracking-widest">{t}</span>
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-6 pt-6">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-1">Accent Color</h4>
                     <div className="flex gap-4">
                        {['blue', 'purple', 'green', 'orange', 'pink', 'red'].map((c) => (
                          <button 
                            key={c}
                            onClick={() => updateNested('appearance', 'color', c)}
                            className={`w-10 h-10 rounded-full border-4 transition-all ${
                              formData.appearance.color === c ? 'border-white' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: c === 'blue' ? '#4361EE' : c === 'purple' ? '#8B5CF6' : c === 'green' ? '#10B981' : c === 'orange' ? '#F59E0B' : c === 'pink' ? '#EC4899' : '#EF4444' }}
                          />
                        ))}
                     </div>
                  </div>

                  <div className="pt-8 flex justify-end">
                     <SaveButton saving={saving} saved={saved} onClick={handleSave} />
                  </div>
                </div>
              )}

              {/* Danger Zone Panel */}
              {activeTab === 'danger' && (
                <div className="space-y-10">
                  <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-3xl space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                           <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                           <h3 className="text-xl font-bold text-white">Danger Zone</h3>
                           <p className="text-xs text-red-400/70 font-medium">Be careful. These actions are destructive and cannot be undone.</p>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                           <div>
                              <p className="text-sm font-bold text-white mb-0.5">Reset Company Data</p>
                              <p className="text-xs text-gray-500">Clear all optimizations, orders, and catalog items.</p>
                           </div>
                           <button onClick={() => toast.error('Resetting requires typed confirmation')} className="bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all">
                              Reset Data
                           </button>
                        </div>
                        <div className="flex items-center justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                           <div>
                              <p className="text-sm font-bold text-white mb-0.5">Delete Account</p>
                              <p className="text-xs text-gray-500">Permanently remove your account and all associated data.</p>
                           </div>
                           <button onClick={() => toast.error('Deleting requires typed confirmation')} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all">
                              Delete Account
                           </button>
                        </div>
                     </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* Invite Modal (Simulated) */}
      <AnimatePresence>
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-[#0f0f1a] border border-white/10 rounded-[32px] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-bold text-white">Invite Team Member</h3>
                 <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-6 mb-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</label>
                    <input type="email" placeholder="colleague@company.com" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#4361EE]/50 transition-all" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Select Role</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-[#4361EE]/50 appearance-none">
                       <option>Admin</option>
                       <option>Manager</option>
                       <option>Viewer</option>
                    </select>
                 </div>
              </div>
              <button onClick={() => { setIsInviteModalOpen(false); toast.success('Invite sent!'); }} className="w-full bg-[#4361EE] hover:bg-[#344FDA] text-white py-4 rounded-2xl font-bold shadow-xl shadow-[#4361EE]/20 transition-all">
                 Send Invitation
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
