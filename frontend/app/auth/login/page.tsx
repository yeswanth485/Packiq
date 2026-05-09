'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock, ArrowRight, CheckCircle2, Eye, EyeOff, Box, Zap, Brain, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Inter, Syne } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const syne = Syne({ subsets: ['latin'] })

const FEATURES = [
  { icon: Zap, text: "99.3% defect detection accuracy", color: "#00FFD1" },
  { icon: Brain, text: "AI training in under 72 hours", color: "#4361EE" },
  { icon: ShieldCheck, text: "BIS & ISO compliance ready", color: "#22c55e" }
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

  useEffect(() => {
    const interval = setInterval(() => {
      setFeatureIndex((prev) => (prev + 1) % FEATURES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword(formData)
      if (error) throw error
      setIsSuccess(true)
      await new Promise(r => setTimeout(r, 800))
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  return (
    <div className={`${inter.className} min-h-screen flex w-full bg-[#0A0A0F] overflow-hidden`}>
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-[60%] relative flex-col items-center justify-center border-r border-white/5">
        <div className="absolute inset-0 grid-overlay opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00FFD1]/5 rounded-full blur-[120px]" />
        <FloatingElements />
        
        <div className="relative z-10 text-center px-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-16 h-16 bg-[#00FFD1] rounded-2xl flex items-center justify-center mb-10 mx-auto shadow-[0_0_30px_rgba(0,255,209,0.3)]"
          >
            <Box className="w-10 h-10 text-[#0A0A0F]" />
          </motion.div>

          <h1 className={`${syne.className} text-white font-bold text-[56px] leading-tight mb-12`}>
            Precision at <br /><span className="text-[#00FFD1]">Scale.</span>
          </h1>

          <div className="h-20 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={featureIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-4 bg-white/[0.03] backdrop-blur-md border border-white/5 p-5 rounded-2xl min-w-[320px]"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${FEATURES[featureIndex].color}20` }}>
                  {(() => {
                    const Icon = FEATURES[featureIndex].icon;
                    return <Icon className="w-5 h-5" style={{ color: FEATURES[featureIndex].color }} />
                  })()}
                </div>
                <span className="text-gray-300 font-bold text-sm">{FEATURES[featureIndex].text}</span>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-6 bg-[#0A0A0F]">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-[400px] glass p-10 rounded-[32px]"
        >
          <div className="text-center mb-10">
            <h2 className={`${syne.className} text-3xl font-bold text-white mb-2`}>Sign In</h2>
            <p className="text-gray-500 text-sm">Access your production control center.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="email" required
                  className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-4 text-white text-sm focus:border-[#00FFD1] transition-all"
                  placeholder="name@company.com"
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Password</label>
                <Link href="#" className="text-[10px] text-[#00FFD1] hover:underline font-bold uppercase tracking-widest">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type={showPassword ? "text" : "password"} required
                  className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl pl-12 pr-12 text-white text-sm focus:border-[#00FFD1] transition-all"
                  placeholder="••••••••"
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading || isSuccess}
              className="w-full h-14 bg-[#00FFD1] hover:scale-[1.02] active:scale-[0.98] text-[#0A0A0F] rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,255,209,0.2)] flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isSuccess ? <CheckCircle2 className="w-6 h-6" /> : "Authorize Access"}
            </button>

            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">or SSO</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <button
              type="button"
              className="w-full h-12 bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google Workspace
            </button>
          </form>

          <div className="mt-10 text-center">
            <Link href="/auth/signup" className="text-gray-500 text-xs hover:text-white transition-colors">
              New to PackIQ? <span className="text-[#00FFD1] font-bold">Create Account</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
