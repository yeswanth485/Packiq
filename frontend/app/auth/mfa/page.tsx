'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Loader2, Smartphone, ArrowRight, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function OTPPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    const storedPhone = sessionStorage.getItem('pending_verification_phone')
    if (!storedPhone) {
      toast.error('No pending verification found')
      router.push('/auth/login')
      return
    }
    setPhoneNumber(storedPhone)
  }, [router])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!phoneNumber || code.length !== 6) return

    setLoading(true)
    try {
      const response = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', phoneNumber, code })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Verification failed')

      toast.success('Identity verified successfully')
      sessionStorage.removeItem('pending_verification_phone')
      
      // Redirect to dashboard
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (!phoneNumber || countdown > 0) return
    setResending(true)
    try {
      const response = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', phoneNumber })
      })

      if (!response.ok) throw new Error('Failed to resend code')

      toast.success('New verification code sent')
      setCountdown(60) // 60 seconds cooldown
    } catch (err: unknown) {
      toast.error('Could not resend code. Please try again later.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#00E5CC]/10 blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 blur-[120px] -z-10" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-8 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00E5CC] to-[#3B82F6] p-[1px]">
              <div className="w-full h-full bg-[#0A0A0F] rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-[#00E5CC]" />
              </div>
            </div>
            <span className="font-bold text-white text-2xl tracking-tighter">Secure Access</span>
          </Link>
          <h1 className="text-3xl font-black text-white mb-3">Check Your Device</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            We've sent a 6-digit verification code to <br />
            <span className="text-white font-bold">{phoneNumber || 'your mobile number'}</span>
          </p>
        </div>

        <div className="glass rounded-3xl p-10 border-white/5 shadow-2xl relative z-10">
          <form onSubmit={handleVerify} className="space-y-8">
            <div className="space-y-4">
              <label className="block text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] text-center">
                Enter Verification Code
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000 000"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-5 text-center text-white text-4xl tracking-[0.4em] font-black placeholder-gray-800 focus:outline-none focus:border-[#00E5CC] transition-all"
              />
            </div>

            <button
              type="submit" disabled={loading || code.length !== 6}
              className="w-full bg-[#00E5CC] hover:bg-[#00c2ad] disabled:opacity-50 text-[#0A0A0F] py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(0,229,204,0.2)]"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Verify Identity <ArrowRight className="w-5 h-5" /></>}
            </button>

            <div className="text-center space-y-4">
              <p className="text-xs text-gray-500">
                Didn't receive the code?
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || countdown > 0}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#00E5CC] hover:text-white disabled:text-gray-600 transition-colors"
              >
                {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-10 text-center text-xs text-gray-600 uppercase font-black tracking-widest">
          Powered by Twilio Verify & PackIQ Security
        </p>
      </motion.div>
    </div>
  )
}
