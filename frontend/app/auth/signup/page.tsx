'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock, ArrowRight, CheckCircle2, Eye, EyeOff, Box, User, Building, Phone, ArrowLeft, Factory, Zap } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Inter, Syne } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const syne = Syne({ subsets: ['latin'] })

const INDUSTRIES = ["Food & Beverage", "Pharma", "FMCG", "Textiles", "Electronics", "Auto Parts", "Logistics", "Manufacturing"]
const LINE_SPEEDS = ["<100 units/min", "100-500 units/min", "500-1000 units/min", ">1000 units/min"]

const FloatingElements = () => {
  const [elements, setElements] = useState<any[]>([])
  useEffect(() => {
    const newElements = Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 40 + 20,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 5
    }))
    setElements(newElements)
  }, [])
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {elements.map((p) => (
        <motion.div
          key={p.id}
          className="absolute border border-[#00FFD1]/10 bg-[#00FFD1]/5 backdrop-blur-[2px] rounded-lg flex items-center justify-center"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ 
            y: [0, -120, 0], 
            rotateX: [0, 360], 
            rotateY: [0, 360],
            opacity: [0.05, 0.15, 0.05] 
          }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        >
           <Box className="w-1/2 h-1/2 text-[#00FFD1]/20" />
        </motion.div>
      ))}
    </div>
  )
}

export default function SignupPage() {
  const supabase = createClient()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    industry: '',
    lineSpeed: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [serverError, setServerError] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleGoogleSignup = async () => {
    try {
      console.log('[Signup] Initiating Google signup...')
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      console.error('[Signup] Google signup error:', err)
      toast.error(err.message)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setServerError(null)
    setErrors({})

    const newErrors: Record<string, string> = {}
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match."
    }
    if (formData.phone && !/^\+?[1-9]\d{1,14}$/.test(formData.phone)) {
      newErrors.phone = "Please use a valid E.164 format (e.g., +1234567890)."
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            company_name: formData.companyName,
            industry: formData.industry,
            line_speed_range: formData.lineSpeed,
            phone_number: formData.phone
          }
        }
      })
      if (error) throw error

      if (data.user) {
        // Create profile explicitly
        await (supabase.from('user_profiles') as any).insert({
          id: data.user.id,
          full_name: formData.fullName,
          company_name: formData.companyName,
          industry: formData.industry,
          mobile: formData.phone,
          onboarding_completed: false
        })
      }

      toast.success('Account created! Let us set up your workspace.')
      router.push('/onboarding')
    } catch (err: any) {
      setServerError(err.message)
      toast.error(err.message)
      setLoading(false)
    }
  }

  return (
    <div className={`${inter.className} min-h-screen flex w-full bg-[#0A0A0F] overflow-hidden`}>
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-[50%] relative flex-col items-center justify-center border-r border-white/5">
        <div className="absolute inset-0 grid-overlay opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00FFD1]/5 rounded-full blur-[140px]" />
        <FloatingElements />
        
        <div className="relative z-10 text-center px-12">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 className={`${syne.className} text-white font-bold text-[64px] tracking-tighter leading-[0.9] mb-10`}>
              Build the <br /><span className="text-[#00FFD1]">Next Grid.</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-md mx-auto mb-16 font-medium">Join 500+ global brands using PackIQ to eliminate logistics waste.</p>
          </motion.div>
          
          <div className="space-y-6 max-w-sm mx-auto">
            {["Real-time 3D Spatial Analysis", "AI-Powered Box Selection", "Global Logistics Integration"].map((item, i) => (
              <div key={i} className="flex items-center gap-5 bg-white/[0.03] p-5 rounded-[24px] border border-white/10 backdrop-blur-md">
                <div className="w-10 h-10 rounded-xl bg-[#00FFD1]/10 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-5 h-5 text-[#00FFD1]" />
                </div>
                <span className="text-base font-bold text-gray-300 tracking-tight">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[50%] flex items-center justify-center p-8 bg-[#0A0A0F]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[520px] glass p-12 rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.5)]"
        >
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className={`${syne.className} text-4xl font-bold text-white mb-2 tracking-tighter`}>Sign Up</h2>
              <p className="text-gray-500 text-base font-medium">Step {step} of 2</p>
            </div>
            <div className="flex gap-3">
              <div className={`w-14 h-2 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-[#00FFD1]' : 'bg-white/5'}`} />
              <div className={`w-14 h-2 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-[#00FFD1]' : 'bg-white/5'}`} />
            </div>
          </div>

          <div className="space-y-8">
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="w-full h-16 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-white rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 group"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google Account
            </button>

            <div className="flex items-center gap-6">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[10px] text-gray-700 font-black uppercase tracking-[0.4em]">or manual</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2) } : handleSignup} className="space-y-8">
              {serverError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-bold text-center">
                  {serverError}
                </div>
              )}
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="s1" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 group-focus-within:text-[#00FFD1] transition-colors" />
                      <input type="text" required placeholder="John Doe" className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl pl-14 text-white text-sm focus:border-[#00FFD1] outline-none" onChange={e => setFormData({...formData, fullName: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-1">Company Name</label>
                    <div className="relative group">
                      <Building className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 group-focus-within:text-[#00FFD1] transition-colors" />
                      <input type="text" required placeholder="Acme Global" className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl pl-14 text-white text-sm focus:border-[#00FFD1] outline-none" onChange={e => setFormData({...formData, companyName: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-1">Work Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 group-focus-within:text-[#00FFD1] transition-colors" />
                      <input type="email" required placeholder="name@company.com" className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl pl-14 text-white text-sm focus:border-[#00FFD1] outline-none" onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-1">Industry</label>
                      <select required className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl px-5 text-white text-sm focus:border-[#00FFD1] outline-none" onChange={e => setFormData({...formData, industry: e.target.value})}>
                        <option value="">Select...</option>
                        {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-1">Line Speed</label>
                      <select required className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl px-5 text-white text-sm focus:border-[#00FFD1] outline-none" onChange={e => setFormData({...formData, lineSpeed: e.target.value})}>
                        <option value="">Select...</option>
                        {LINE_SPEEDS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-1">Mobile Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 group-focus-within:text-[#00FFD1] transition-colors" />
                      <input type="tel" required placeholder="+91 98765 43210" className={`w-full h-14 bg-white/[0.02] border ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-[#00FFD1]'} rounded-2xl pl-14 text-white text-sm outline-none`} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    {errors.phone && <p className="text-[10px] text-red-400 font-bold px-1">{errors.phone}</p>}
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-1">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 group-focus-within:text-[#00FFD1] transition-colors" />
                      <input type="password" required placeholder="••••••••" className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl pl-14 text-white text-sm focus:border-[#00FFD1] outline-none" onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-1">Confirm Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 group-focus-within:text-[#00FFD1] transition-colors" />
                      <input type="password" required placeholder="••••••••" className={`w-full h-14 bg-white/[0.02] border ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-[#00FFD1]'} rounded-2xl pl-14 text-white text-sm outline-none`} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
                    </div>
                    {errors.confirmPassword && <p className="text-[10px] text-red-400 font-bold px-1">{errors.confirmPassword}</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-5 pt-6">
              {step === 2 && (
                <button type="button" onClick={() => setStep(1)} className="h-16 px-8 border border-white/10 rounded-2xl hover:bg-white/5 transition-all">
                  <ArrowLeft className="w-6 h-6" />
                </button>
              )}
              <button
                type="submit" disabled={loading}
                className="flex-1 h-16 bg-[#00FFD1] text-[#0A0A0F] rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-[0_0_40px_rgba(0,255,209,0.25)]"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : step === 1 ? <>Next Phase <ArrowRight className="w-5 h-5" /></> : "Establish Account"}
              </button>
            </div>
          </form>
          </div>

          <div className="mt-12 text-center">
            <Link href="/auth/login" className="text-gray-600 text-xs hover:text-white transition-colors font-medium">
              Already have an account? <span className="text-[#00FFD1] font-black uppercase tracking-widest ml-1">Sign In</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
