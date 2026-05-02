'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Package, Loader2, Mail, Lock, User, Building, Phone, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

export default function SignupPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (!formData.phone.startsWith('+')) {
      toast.error('Please enter phone number in E.164 format (e.g., +1234567890)')
      return
    }

    setLoading(true)
    
    try {
      // 1. Sign up user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          data: {
            full_name: formData.fullName,
            company_name: formData.companyName,
            phone_number: formData.phone,
          }
        },
      })
      
      if (error) throw error
      
      // 2. Trigger real-time OTP via Twilio
      const otpResponse = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', phoneNumber: formData.phone })
      })

      const otpData = await otpResponse.json()
      if (!otpResponse.ok) throw new Error(otpData.error || 'Failed to send verification code')

      toast.success('Registration successful! Sending verification code...')
      
      // 3. Store phone in session storage for the MFA page
      sessionStorage.setItem('pending_verification_phone', formData.phone)
      
      // 4. Redirect to OTP page
      router.push('/auth/mfa')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/api/auth/callback` },
      })
      if (error) throw error
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Google Auth failed')
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#00E5CC]/10 blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 blur-[120px] -z-10" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl grid lg:grid-cols-2 gap-12 items-center"
      >
        <div className="hidden lg:block">
           <Link href="/" className="inline-flex items-center gap-3 mb-8 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00E5CC] to-[#3B82F6] p-[1px]">
              <div className="w-full h-full bg-[#0A0A0F] rounded-2xl flex items-center justify-center">
                <Package className="w-6 h-6 text-[#00E5CC]" />
              </div>
            </div>
            <span className="font-bold text-white text-2xl tracking-tighter">PackIQ</span>
          </Link>
          <h1 className="text-4xl font-black text-white mb-6 leading-tight">Scale Your <br />Fulfillment <br /><span className="gradient-teal">Effortlessly.</span></h1>
          <ul className="space-y-4">
            {['AI Spatial Reasoning', 'Real-time OTP Security', 'Enterprise Analytics'].map((feat, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-400">
                <CheckCircle2 className="w-5 h-5 text-[#00E5CC]" />
                <span className="text-sm font-medium">{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass rounded-3xl p-8 border-white/5 relative z-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-[#00E5CC] hover:underline">Sign in</Link>
            </p>
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-bold uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="text" required name="fullName" value={formData.fullName} onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#00E5CC] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-bold uppercase tracking-wider">Company</label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="text" required name="companyName" value={formData.companyName} onChange={handleChange}
                    placeholder="Acme Inc"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#00E5CC] transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-bold uppercase tracking-wider">Business Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="email" required name="email" value={formData.email} onChange={handleChange}
                  placeholder="name@company.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#00E5CC] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-bold uppercase tracking-wider">Mobile Number (E.164)</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="tel" required name="phone" value={formData.phone} onChange={handleChange}
                  placeholder="+1234567890"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#00E5CC] transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-bold uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="password" required name="password" value={formData.password} onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#00E5CC] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-bold uppercase tracking-wider">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input
                    type="password" required name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#00E5CC] transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full mt-6 bg-[#00E5CC] hover:bg-[#00c2ad] disabled:opacity-60 text-[#0A0A0F] py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(0,229,204,0.2)]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[10px] text-gray-600 uppercase font-bold tracking-widest">or sign up with</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <button
              type="button" onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 glass border border-white/10 hover:bg-white/5 text-white py-4 rounded-2xl text-sm font-bold transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google Account
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
