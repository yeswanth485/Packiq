'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Lock, ArrowRight, CheckCircle2, Box, Zap, ShieldCheck, Boxes } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Inter, Syne } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })
const syne = Syne({ subsets: ['latin'] })

const FEATURES = [
  { icon: Zap, text: "Save up to 32% on DIM weight", color: "#00FFD1" },
  { icon: Boxes, text: "AI FFD Spatial Optimization", color: "#4361EE" },
  { icon: ShieldCheck, text: "Automated Box Selection", color: "#22c55e" }
]

const FloatingElements = () => {
  const [elements, setElements] = useState<any[]>([])
  useState(() => {
    const newElements = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 40 + 20,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5
    }))
    setElements(newElements)
  })
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

export default function ResetPasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.")
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      })
      if (error) throw error

      setIsSuccess(true)
      toast.success("Password updated successfully!")
      await new Promise(r => setTimeout(r, 1500))

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
      setLoading(false)
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
            <h2 className={`${syne.className} text-4xl font-bold text-white mb-4 tracking-tighter`}>Reset Password</h2>
            <p className="text-gray-500 text-sm font-medium">Enter your new secure password.</p>
          </div>

          <div className="space-y-8">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-bold text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-1">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 group-focus-within:text-[#00FFD1] transition-colors" />
                  <input
                    type="password" required
                    className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl pl-14 pr-5 text-white text-sm focus:border-[#00FFD1] focus:bg-white/[0.04] transition-all outline-none"
                    placeholder="••••••••"
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] ml-1">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-700 group-focus-within:text-[#00FFD1] transition-colors" />
                  <input
                    type="password" required
                    className="w-full h-14 bg-white/[0.02] border border-white/10 rounded-2xl pl-14 pr-5 text-white text-sm focus:border-[#00FFD1] focus:bg-white/[0.04] transition-all outline-none"
                    placeholder="••••••••"
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading || isSuccess}
                className="w-full h-16 bg-[#00FFD1] hover:scale-[1.02] active:scale-[0.98] text-[#0A0A0F] rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-[0_0_40px_rgba(0,255,209,0.25)] flex items-center justify-center gap-4 mt-4"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : isSuccess ? <CheckCircle2 className="w-8 h-8" /> : "Update Password"}
              </button>
            </form>
          </div>

          <div className="mt-12 text-center">
             <Link href="/auth/login" className="text-gray-600 text-xs hover:text-white transition-colors font-medium">
               Back to <span className="text-[#00FFD1] font-black uppercase tracking-widest ml-1">Login</span>
             </Link>
           </div>
        </motion.div>
      </div>
    </div>
  )
}
