'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock, ArrowRight, CheckCircle2, Eye, EyeOff, Box, User, Building, Phone, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

// --- Particles Component ---
const Particles = () => {
  const [particles, setParticles] = useState<any[]>([])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth
      const y = e.clientY / window.innerHeight
      document.documentElement.style.setProperty('--mouse-x', x.toString())
      document.documentElement.style.setProperty('--mouse-y', y.toString())
    }
    window.addEventListener('mousemove', handleMouseMove)

    const newParticles = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5
    }))
    setParticles(newParticles)

    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div 
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
      style={{
        transform: 'translate(calc(var(--mouse-x, 0) * -20px), calc(var(--mouse-y, 0) * -20px))',
        transition: 'transform 0.1s ease-out'
      }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white opacity-20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: ['0%', '-500%'],
            opacity: [0, 0.8, 0]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  )
}

// --- CSS 3D Scene ---
const AbstractShapes = () => {
  return (
    <div 
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{
        perspective: '1000px',
        transform: 'translate(calc(var(--mouse-x, 0) * 30px), calc(var(--mouse-y, 0) * 30px))',
        transition: 'transform 0.2s ease-out'
      }}
    >
      {/* Cube */}
      <motion.div 
        animate={{ rotateX: [0, 360], rotateY: [0, 360] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="relative w-64 h-64"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="absolute inset-0 border border-[#4361EE]/40 bg-[#4361EE]/5 backdrop-blur-sm" style={{ transform: 'translateZ(128px)' }} />
        <div className="absolute inset-0 border border-[#4361EE]/40 bg-[#4361EE]/5 backdrop-blur-sm" style={{ transform: 'translateZ(-128px)' }} />
        <div className="absolute inset-0 border border-[#4361EE]/40 bg-[#4361EE]/5 backdrop-blur-sm" style={{ transform: 'rotateY(90deg) translateZ(128px)' }} />
        <div className="absolute inset-0 border border-[#4361EE]/40 bg-[#4361EE]/5 backdrop-blur-sm" style={{ transform: 'rotateY(90deg) translateZ(-128px)' }} />
        <div className="absolute inset-0 border border-[#4361EE]/40 bg-[#4361EE]/5 backdrop-blur-sm" style={{ transform: 'rotateX(90deg) translateZ(128px)' }} />
        <div className="absolute inset-0 border border-[#4361EE]/40 bg-[#4361EE]/5 backdrop-blur-sm" style={{ transform: 'rotateX(90deg) translateZ(-128px)' }} />
      </motion.div>

      {/* Inner Octahedron / abstract lines */}
      <motion.div 
        animate={{ rotateX: [360, 0], rotateY: [0, 360], rotateZ: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute w-32 h-32"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="absolute inset-0 border border-[#06b6d4]/60 rounded-full" style={{ transform: 'rotateX(45deg) rotateY(45deg)' }} />
        <div className="absolute inset-0 border border-[#06b6d4]/60 rounded-full" style={{ transform: 'rotateX(-45deg) rotateY(-45deg)' }} />
        <div className="absolute inset-0 border border-[#06b6d4]/60 rounded-full" style={{ transform: 'rotateX(90deg)' }} />
        <div className="absolute inset-0 border border-[#06b6d4]/60 rounded-full" style={{ transform: 'rotateY(90deg)' }} />
      </motion.div>
    </div>
  )
}

export default function SignupPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  })
  
  const [loading, setLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorShake, setErrorShake] = useState(false)
  
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const validatePhone = (phone: string) => /^\+[1-9]\d{1,14}$/.test(phone)

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.fullName) newErrors.fullName = 'Full Name is required'
    if (!formData.companyName) newErrors.companyName = 'Company Name is required'
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Mobile Number is required'
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Must be in E.164 format (e.g. +1234567890)'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    setTouched(prev => ({ ...prev, fullName: true, companyName: true, email: true, phone: true }))
    if (validateStep1()) {
      setDirection(1)
      setStep(2)
    } else {
      setErrorShake(true)
      setTimeout(() => setErrorShake(false), 500)
    }
  }

  const handleBackStep = () => {
    setDirection(-1)
    setStep(1)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    const val = type === 'checkbox' ? checked : value
    setFormData(prev => ({ ...prev, [name]: val }))
    setTouched(prev => ({ ...prev, [name]: true }))
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault()
    
    const newErrors: Record<string, string> = {}
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms'
    
    setTouched(prev => ({ ...prev, password: true, confirmPassword: true, agreeTerms: true }))
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setErrorShake(true)
      setTimeout(() => setErrorShake(false), 500)
      return
    }

    setLoading(true)
    setErrorShake(false)
    
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

      setIsSuccess(true)
      await new Promise(resolve => setTimeout(resolve, 800))
      
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
      setErrorShake(true)
      setTimeout(() => setErrorShake(false), 500)
      toast.error(err instanceof Error ? err.message : 'Registration failed')
      setLoading(false)
      setIsSuccess(false)
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

  // Password strength logic
  const getPasswordStrength = (pass: string) => {
    if (pass.length === 0) return { label: '', color: 'bg-transparent', score: 0, width: '0%' }
    if (pass.length < 6) return { label: 'Weak', color: 'bg-red-500', score: 1, width: '25%' }
    if (pass.length < 10) return { label: 'Fair', color: 'bg-yellow-500', score: 2, width: '50%' }
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) return { label: 'Excellent', color: 'bg-green-500', score: 4, width: '100%' }
    return { label: 'Strong', color: 'bg-blue-500', score: 3, width: '75%' }
  }

  const strength = getPasswordStrength(formData.password)
  const passwordsMatch = formData.password.length > 0 && formData.password === formData.confirmPassword

  const stepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  }

  const formVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const }
    })
  }

  const Field = ({ label, name, type, icon: Icon, placeholder, value, onChange, error, touched }: any) => (
    <div className="mb-4">
      <label className="block text-[12px] text-[#64748b] mb-1.5 font-medium">{label}</label>
      <div className="relative">
        <Icon className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${touched && error ? 'text-[#f59e0b]' : 'text-[#64748b]'}`} />
        <input
          type={type} name={name} value={value} onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-[#1a1a2e] border ${touched && error ? 'border-[#f59e0b]' : 'border-[rgba(255,255,255,0.1)]'} rounded-[10px] pl-10 pr-4 py-3 text-white text-[14px] focus:outline-none focus:border-[#4361EE] focus:shadow-[0_0_15px_rgba(67,97,238,0.2)] transition-all`}
        />
      </div>
      <AnimatePresence>
        {touched && error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[#f59e0b] text-[11px] mt-1.5 flex items-center gap-1 overflow-hidden">
            <AlertCircle className="w-3 h-3" /> {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  return (
    <div className={`${inter.className} min-h-screen flex w-full bg-[#05050a] overflow-hidden`}>
      
      {/* LEFT PANEL - 3D ANIMATED SCENE */}
      <div className="hidden lg:flex w-[60%] relative flex-col items-center justify-center border-r border-[rgba(255,255,255,0.05)]">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4361EE]/10 rounded-full blur-[150px] pointer-events-none" />
        
        <Particles />
        <AbstractShapes />

        <div className="relative z-10 text-center px-12 mt-[-50px]">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-white font-bold text-[48px] leading-[1.1] mb-6"
          >
            Scale Your <br />Fulfillment Effortlessly.
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-wrap justify-center gap-4 max-w-xl mx-auto"
          >
            {[
              { text: "AI Spatial Reasoning", icon: Box },
              { text: "Real-time OTP Security", icon: Lock },
              { text: "Enterprise Analytics", icon: CheckCircle2 }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-[#0f0f1a]/80 backdrop-blur-md border border-[#4361EE]/30 px-4 py-2.5 rounded-full text-[#f1f5f9] text-[13px] font-medium shadow-[0_0_15px_rgba(67,97,238,0.15)]">
                <item.icon className="w-4 h-4 text-[#06b6d4]" />
                {item.text}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* RIGHT PANEL - SIGNUP FORM */}
      <div className="w-full lg:w-[40%] bg-[#0f0f1a] flex flex-col items-center justify-center p-8 sm:p-12 relative z-20">
        
        {/* Step Indicator */}
        <div className="w-full max-w-[400px] mb-8">
          <div className="flex items-center justify-center relative w-[250px] mx-auto mb-2">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-[rgba(255,255,255,0.1)] z-0" />
            <motion.div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#4361EE] z-0" 
              initial={{ width: '0%' }}
              animate={{ width: step === 2 ? '100%' : '0%' }}
              transition={{ duration: 0.4 }}
            />
            
            <div className="flex justify-between w-full z-10 relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300 ${step >= 1 ? 'bg-[#4361EE] text-white shadow-[0_0_10px_rgba(67,97,238,0.5)]' : 'bg-[#1a1a2e] text-[#64748b] border border-[rgba(255,255,255,0.1)]'}`}>
                {step > 1 ? <CheckCircle2 className="w-4 h-4 text-white" /> : '1'}
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300 ${step === 2 ? 'bg-[#4361EE] text-white shadow-[0_0_10px_rgba(67,97,238,0.5)]' : 'bg-[#1a1a2e] text-[#64748b] border border-[rgba(255,255,255,0.1)]'}`}>
                2
              </div>
            </div>
          </div>
          <div className="flex justify-between w-[270px] mx-auto text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            <span className={step >= 1 ? 'text-white' : ''}>Personal</span>
            <span className={step === 2 ? 'text-white' : ''}>Security</span>
          </div>
        </div>

        <div className="w-full max-w-[400px] relative">
          {/* Logo & Header outside of animation so it doesn't move */}
          <div className="flex flex-col items-center mb-8">
            <Link href="/" className="flex items-center gap-2 group mb-6">
              <div className="w-8 h-8 rounded-[8px] bg-[#4361EE]/20 border border-[#4361EE]/50 flex items-center justify-center">
                <Box className="w-5 h-5 text-[#4361EE]" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-white">PackIQ</span>
            </Link>
            <h2 className="text-[28px] font-bold text-white mb-2">Create Account</h2>
            <p className="text-[#64748b] text-[14px]">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-[#4361EE] hover:underline font-medium">Sign in</Link>
            </p>
          </div>

          <div className="relative overflow-visible">
            <AnimatePresence custom={direction} mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
                  className="w-full"
                >
                  <motion.div custom={0} variants={formVariants} initial="hidden" animate="visible">
                    <Field label="Full Name" name="fullName" type="text" icon={User} placeholder="John Doe" value={formData.fullName} onChange={handleChange} error={errors.fullName} touched={touched.fullName} />
                  </motion.div>
                  <motion.div custom={1} variants={formVariants} initial="hidden" animate="visible">
                    <Field label="Company Name" name="companyName" type="text" icon={Building} placeholder="Acme Inc" value={formData.companyName} onChange={handleChange} error={errors.companyName} touched={touched.companyName} />
                  </motion.div>
                  <motion.div custom={2} variants={formVariants} initial="hidden" animate="visible">
                    <Field label="Business Email" name="email" type="email" icon={Mail} placeholder="name@company.com" value={formData.email} onChange={handleChange} error={errors.email} touched={touched.email} />
                  </motion.div>
                  <motion.div custom={3} variants={formVariants} initial="hidden" animate="visible">
                    <Field label="Mobile Number (E.164)" name="phone" type="tel" icon={Phone} placeholder="+1234567890" value={formData.phone} onChange={handleChange} error={errors.phone} touched={touched.phone} />
                  </motion.div>

                  <motion.div custom={4} variants={formVariants} initial="hidden" animate="visible">
                    <button
                      type="button" onClick={handleNextStep}
                      className="w-full h-[48px] mt-2 bg-[#4361EE] hover:bg-[#344FDA] text-white rounded-[10px] font-bold text-[15px] transition-all flex items-center justify-center gap-2 hover:scale-[1.01] hover:shadow-[0_4px_20px_rgba(67,97,238,0.3)]"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>

                  <motion.div custom={5} variants={formVariants} initial="hidden" animate="visible">
                    <div className="flex items-center gap-4 py-6">
                      <div className="flex-1 h-px bg-[rgba(255,255,255,0.07)]" />
                      <span className="text-[12px] text-[#64748b]">or sign up with</span>
                      <div className="flex-1 h-px bg-[rgba(255,255,255,0.07)]" />
                    </div>

                    <button
                      type="button" onClick={handleGoogle}
                      className="w-full h-[48px] flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-[#0f0f1a] rounded-[10px] text-[15px] font-bold transition-all hover:shadow-[0_4px_14px_rgba(255,255,255,0.1)] border border-transparent"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google Account
                    </button>
                  </motion.div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
                  className="w-full"
                >
                  <form onSubmit={handleEmailSignup} className="space-y-4">
                    <motion.div custom={0} variants={formVariants} initial="hidden" animate="visible">
                      <div className="mb-4">
                        <label className="block text-[12px] text-[#64748b] mb-1.5 font-medium">Password</label>
                        <div className="relative">
                          <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${touched.password && errors.password ? 'text-[#f59e0b]' : 'text-[#64748b]'}`} />
                          <input
                            type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange}
                            placeholder="••••••••"
                            className={`w-full bg-[#1a1a2e] border ${touched.password && errors.password ? 'border-[#f59e0b]' : 'border-[rgba(255,255,255,0.1)]'} rounded-[10px] pl-10 pr-10 py-3 text-white text-[14px] focus:outline-none focus:border-[#4361EE] focus:shadow-[0_0_15px_rgba(67,97,238,0.2)] transition-all`}
                          />
                          <button 
                            type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {formData.password.length > 0 && (
                          <div className="mt-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] text-[#64748b]">Strength</span>
                              <span className="text-[11px] font-medium" style={{ color: strength.score > 1 ? '#fff' : '#f59e0b' }}>{strength.label}</span>
                            </div>
                            <div className="h-1 w-full bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                              <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: strength.width }} />
                            </div>
                          </div>
                        )}
                        <AnimatePresence>
                          {touched.password && errors.password && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[#f59e0b] text-[11px] mt-1.5 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {errors.password}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>

                    <motion.div custom={1} variants={formVariants} initial="hidden" animate="visible">
                      <div className="mb-4">
                        <label className="block text-[12px] text-[#64748b] mb-1.5 font-medium">Confirm Password</label>
                        <div className="relative">
                          <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${touched.confirmPassword && errors.confirmPassword ? 'text-[#f59e0b]' : 'text-[#64748b]'}`} />
                          <input
                            type={showConfirmPassword ? "text" : "password"} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                            placeholder="••••••••"
                            className={`w-full bg-[#1a1a2e] border ${touched.confirmPassword && errors.confirmPassword ? 'border-[#f59e0b]' : passwordsMatch ? 'border-[#22c55e]' : 'border-[rgba(255,255,255,0.1)]'} rounded-[10px] pl-10 pr-10 py-3 text-white text-[14px] focus:outline-none focus:border-[#4361EE] focus:shadow-[0_0_15px_rgba(67,97,238,0.2)] transition-all`}
                          />
                          {passwordsMatch && (
                            <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#22c55e]" />
                          )}
                        </div>
                        <AnimatePresence>
                          {touched.confirmPassword && errors.confirmPassword && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[#f59e0b] text-[11px] mt-1.5 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> {errors.confirmPassword}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>

                    <motion.div custom={2} variants={formVariants} initial="hidden" animate="visible">
                      <div className="mb-6 flex items-start gap-3">
                        <div className="mt-0.5 relative flex items-center justify-center">
                          <input
                            type="checkbox"
                            name="agreeTerms"
                            checked={formData.agreeTerms}
                            onChange={handleChange}
                            className="w-4 h-4 appearance-none border border-[rgba(255,255,255,0.2)] rounded-[4px] bg-[#1a1a2e] checked:bg-[#4361EE] checked:border-[#4361EE] cursor-pointer transition-colors"
                          />
                          {formData.agreeTerms && <CheckCircle2 className="w-3 h-3 text-white absolute pointer-events-none" />}
                        </div>
                        <div>
                          <label className="text-[13px] text-[#64748b] cursor-pointer" onClick={() => handleChange({ target: { name: 'agreeTerms', type: 'checkbox', checked: !formData.agreeTerms } } as any)}>
                            I agree to the <a href="#" className="text-[#4361EE] hover:underline">Terms of Service</a> and <a href="#" className="text-[#4361EE] hover:underline">Privacy Policy</a>
                          </label>
                          <AnimatePresence>
                            {touched.agreeTerms && errors.agreeTerms && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[#f59e0b] text-[11px] mt-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> {errors.agreeTerms}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div custom={3} variants={formVariants} initial="hidden" animate="visible" className="flex gap-3">
                      <button
                        type="button" onClick={handleBackStep} disabled={loading}
                        className="h-[48px] px-4 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white rounded-[10px] font-bold text-[15px] transition-all flex items-center justify-center border border-[rgba(255,255,255,0.1)] disabled:opacity-60"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="submit" disabled={loading || isSuccess}
                        className="flex-1 h-[48px] bg-[#4361EE] hover:bg-[#344FDA] disabled:opacity-80 text-white rounded-[10px] font-bold text-[15px] transition-all flex items-center justify-center gap-2 hover:scale-[1.01] hover:shadow-[0_4px_20px_rgba(67,97,238,0.3)] relative overflow-hidden"
                      >
                        <AnimatePresence mode="wait">
                          {loading && !isSuccess ? (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                              <Loader2 className="w-5 h-5 animate-spin" />
                            </motion.div>
                          ) : isSuccess ? (
                            <motion.div key="success" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                              <CheckCircle2 className="w-6 h-6 text-white" />
                            </motion.div>
                          ) : (
                            <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                              Create Account
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    </motion.div>

                    <AnimatePresence>
                      {errorShake && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center mt-4">
                           <span className="text-[#f59e0b] text-[12px]">Please fix the errors above to continue.</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  )
}
