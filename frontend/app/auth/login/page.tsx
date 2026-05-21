'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock, ArrowRight, CheckCircle2, Eye, EyeOff, Box, Zap, Brain, ShieldCheck, Boxes, Building } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Inter, Syne } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const syne = Syne({ subsets: ['latin'] })

const FEATURES = [
  { icon: Zap, text: "Save up to 32% on DIM weight", color: "#00FFD1" },
  { icon: Boxes, text: "AI FFD Spatial Optimization", color: "#4361EE" },
  { icon: ShieldCheck, text: "Automated Box Selection", color: "#22c55e" }
]

const FloatingElements = () => {
  const [elements, setElements] = useState<any[]>([])
  useEffect(() => {
    const newElements = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 40 + 20,
      duration: Math.random() * 10 + 10,
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
            y: [0, -100, 0], 
            rotateX: [0, 360], 
            rotateY: [0, 360],
            opacity: [0.05, 0.2, 0.05] 
          }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        >
           <Box className="w-1/2 h-1/2 text-[#00FFD1]/20" />
        </motion.div>
      ))}
    </div>
  )
}

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [featureIndex, setFeatureIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setFeatureIndex((prev) => (prev + 1) % FEATURES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })
      if (error) throw error

      // Check onboarding status
      let { data: profile } = await (supabase.from('profiles') as any)
        .select('onboarding_complete, company')
        .eq('id', data.user.id)
        .single()

      // If profile is missing (trigger failure), create it
      if (!profile) {
        const { data: newProfile, error: createError } = await (supabase.from('profiles') as any).insert({
          id: data.user.id,
          email: data.user.email,
          onboarding_complete: true
        }).select().single()
        profile = newProfile
      }

      setIsSuccess(true)
      await new Promise(r => setTimeout(r, 800))

      if (profile && !profile.onboarding_complete) {
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      let msg = err.message
      if (msg.includes('Email not confirmed')) {
        msg = 'Please check your inbox and verify your email address to log in.'
      }
      setError(msg)
      toast.error(msg)
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!formData.email) {
      setError("Please enter your email to reset password.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) throw error
      setResetSent(true)
      toast.success("Password reset link sent to your email.")
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  return (
    <div className={`${inter.className} min-h-screen flex w-full bg-[#0A0A0F] overflow-hidden`}>
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-[60%] relative flex-col items-center justify-center border-r border-white/5">
        <div className="absolute inset-0 grid-overlay opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00FFD1]/5 rounded-full blur-[140px]" />
        <FloatingElements />
        
        <div className="relative z-10 text-center px-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-20 h-20 bg-[#00FFD1] rounded-[24px] flex items-center justify-center mb-12 mx-auto shadow-[0_0_50px_rgba(0,255,209,0.3)]"
          >
            <Boxes className="w-12 h-12 text-[#0A0A0F]" />
          </motion.div>

          <h1 className={`${syne.className} text-white font-bold text-[64px] tracking-tighter leading-tight mb-14`}>
            Pack<span className="text-[#00FFD1]">IQ.</span>
          </h1>

          <div className="h-24 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={featureIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center gap-5 bg-white/[0.04] backdrop-blur-2xl border border-white/10 p-6 rounded-[28px] min-w-[360px] shadow-2xl"
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: `${FEATURES[featureIndex].color}20` }}>
                  {(() => {
                    const Icon = FEATURES[featureIndex].icon;
                    return <Icon className="w-6 h-6" style={{ color: FEATURES[featureIndex].color }} />
                  })()}
                </div>
                <span className="text-gray-200 font-bold text-base tracking-tight">{FEATURES[featureIndex].text}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-[#0A0A0F]">
        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-[440px] glass p-12 rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.5)]"
        >
          <div className="text-center mb-12">
            <h2 className={`${syne.className} text-5xl font-bold text-white mb-4 tracking-tighter`}>Sign In</h2>
            <p className="text-gray-500 text-lg font-medium">Access your AI command center.</p>
          </div>

          <div className="space-y-8">
            {/* Google Sign In AT THE TOP */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-16 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-white rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 group"
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google Sign In
            </button>

            <div className="flex items-center gap-6">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[10px] text-gray-700 font-black uppercase tracking-[0.4em]">or manual</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-bold text-center">
                {error}
              </div>
            )}
            {resetSent && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-2xl text-xs font-bold text-center">
                Check your email for a reset link.
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-1">Work Email</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 group-focus-within:text-[#00FFD1] transition-colors" />
                  <input
                    type="email" required
                    className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl pl-14 pr-5 text-white text-sm focus:border-[#00FFD1] focus:bg-white/[0.04] transition-all outline-none"
                    placeholder="name@company.com"
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Password</label>
                  <button type="button" onClick={handleResetPassword} className="text-[10px] text-[#00FFD1] hover:underline font-black uppercase tracking-[0.2em]">Forgot?</button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 group-focus-within:text-[#00FFD1] transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"} required
                    className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl pl-14 pr-14 text-white text-sm focus:border-[#00FFD1] focus:bg-white/[0.04] transition-all outline-none"
                    placeholder="••••••••"
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-700 hover:text-white transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>



              <button
                type="submit" disabled={loading || isSuccess}
                className="w-full h-16 bg-[#00FFD1] hover:scale-[1.02] active:scale-[0.98] text-[#0A0A0F] rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-[0_0_40px_rgba(0,255,209,0.25)] flex items-center justify-center gap-4 mt-4"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : isSuccess ? <CheckCircle2 className="w-8 h-8" /> : "Authorize Session"}
              </button>
            </form>
          </div>

          <div className="mt-12 text-center">
            <Link href="/auth/signup" className="text-gray-600 text-xs hover:text-white transition-colors font-medium">
              New to PackIQ? <span className="text-[#00FFD1] font-black uppercase tracking-widest ml-1">Register Hub</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
