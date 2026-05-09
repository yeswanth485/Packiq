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
    password: ''
  })

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
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
      toast.success('Account created! Please check your email.')
      router.push('/onboarding')
    } catch (err: any) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  return (
    <div className={`${inter.className} min-h-screen flex w-full bg-[#0A0A0F] overflow-hidden`}>
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-[50%] relative flex-col items-center justify-center border-r border-white/5">
        <div className="absolute inset-0 grid-overlay opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#00FFD1]/5 rounded-full blur-[120px]" />
        
        <div className="relative z-10 text-center px-12">
          <h1 className={`${syne.className} text-white font-bold text-[56px] leading-tight mb-8`}>
            Build the <br /><span className="text-[#00FFD1]">Perfect Line.</span>
          </h1>
          <p className="text-gray-400 max-w-md mx-auto mb-12">Join 500+ manufacturers using PackIQ to eliminate defects and optimize yield.</p>
          
          <div className="space-y-6 max-w-sm mx-auto">
            {["48-hour deployment guarantee", "Dedicated account manager", "24/7 technical support"].map((item, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-[#00FFD1]/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[#00FFD1]" />
                </div>
                <span className="text-sm font-medium text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[50%] flex items-center justify-center p-6 bg-[#0A0A0F]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[480px] glass p-10 rounded-[32px]"
        >
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className={`${syne.className} text-3xl font-bold text-white mb-1`}>Sign Up</h2>
              <p className="text-gray-500 text-sm">Step {step} of 2</p>
            </div>
            <div className="flex gap-2">
              <div className={`w-12 h-1.5 rounded-full ${step >= 1 ? 'bg-[#00FFD1]' : 'bg-white/5'}`} />
              <div className={`w-12 h-1.5 rounded-full ${step >= 2 ? 'bg-[#00FFD1]' : 'bg-white/5'}`} />
            </div>
          </div>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2) } : handleSignup} className="space-y-6">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="s1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input type="text" required placeholder="John Doe" className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl pl-12 text-white text-sm focus:border-[#00FFD1]" onChange={e => setFormData({...formData, fullName: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Company Name</label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input type="text" required placeholder="Acme Inc." className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl pl-12 text-white text-sm focus:border-[#00FFD1]" onChange={e => setFormData({...formData, companyName: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Work Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input type="email" required placeholder="name@company.com" className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl pl-12 text-white text-sm focus:border-[#00FFD1]" onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Industry</label>
                      <select required className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-white text-sm focus:border-[#00FFD1]" onChange={e => setFormData({...formData, industry: e.target.value})}>
                        <option value="">Select...</option>
                        {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Line Speed</label>
                      <select required className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-white text-sm focus:border-[#00FFD1]" onChange={e => setFormData({...formData, lineSpeed: e.target.value})}>
                        <option value="">Select...</option>
                        {LINE_SPEEDS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Mobile Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input type="tel" required placeholder="+91 98765 43210" className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl pl-12 text-white text-sm focus:border-[#00FFD1]" onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input type="password" required placeholder="••••••••" className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl pl-12 text-white text-sm focus:border-[#00FFD1]" onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-4 pt-4">
              {step === 2 && (
                <button type="button" onClick={() => setStep(1)} className="h-14 px-6 border border-white/10 rounded-xl hover:bg-white/5 transition-all">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <button
                type="submit" disabled={loading}
                className="flex-1 h-14 bg-[#00FFD1] text-[#0A0A0F] rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : step === 1 ? <>Next Step <ArrowRight className="w-4 h-4" /></> : "Create Account"}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <Link href="/auth/login" className="text-gray-500 text-xs hover:text-white transition-colors">
              Already have an account? <span className="text-[#00FFD1] font-bold">Sign In</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
