'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import Step1Welcome from './Step1Welcome'
import Step2CompanyDetails from './Step2CompanyDetails'
import Step3LogoUpload from './Step3LogoUpload'
import Step4Review from './Step4Review'
import Step5Success from './Step5Success'

const STEPS_COUNT = 5

export default function OnboardingWizard() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already onboarded
  useEffect(() => {
    const checkOnboarding = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await (supabase as any)
          .from('user_profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .maybeSingle()

        if ((profile as any)?.onboarding_completed) {
          router.push('/dashboard')
        }
      }
    }
    checkOnboarding()
  }, [supabase, router])
  const [formData, setFormData] = useState({
    companyName: '',
    industry: '',
    address: '',
    phone: '',
    website: '',
    logoFile: null as File | null,
    logoPreview: null as string | null,
  })

  // Auto-scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  const updateFormData = (updates: any) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    if (step === 2) {
      if (!formData.companyName || !formData.industry || !formData.address) {
        toast.error('Please fill in all required fields')
        return
      }
    }
    setStep(prev => Math.min(prev + 1, STEPS_COUNT))
  }

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1))
  }

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      let logoUrl = null

      // 1. Upload Logo if exists
      if (formData.logoFile) {
        const ext = formData.logoFile.name.split('.').pop()
        const fileName = `logos/${user.id}_${Date.now()}.${ext}`

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('company-assets')
          .upload(fileName, formData.logoFile, {
            cacheControl: '3600',
            upsert: true
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('company-assets')
          .getPublicUrl(uploadData.path)

        logoUrl = publicUrl
      }

      // 2. Atomic Upsert Company
      const { data: company, error: companyError } = await (supabase as any)
        .from('companies')
        .upsert({
          owner_user_id: user.id,
          company_name: formData.companyName,
          industry: formData.industry,
          address: formData.address,
          phone: formData.phone,
          website: formData.website,
          logo_url: logoUrl,
          updated_at: new Date().toISOString()
        }, { onConflict: 'owner_user_id' })
        .select()
        .single()

      if (companyError) throw companyError

      // 3. Upsert User Profile to ensure it exists
      const { error: profileError } = await (supabase as any)
        .from('user_profiles')
        .upsert({
          id: user.id,
          company_id: company.id,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })

      if (profileError) throw profileError

      // 4. Success State
      setStep(5)

      // Force a refresh to ensure middleware sees the updated profile
      router.refresh()

      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2500)

    } catch (error: any) {
      console.error('Onboarding Error:', error)
      toast.error(error.message || 'Something went wrong during setup')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white py-12 px-4 flex items-center justify-center">
      <div className="max-w-3xl w-full">
        {/* Progress Bar */}
        {step > 1 && step < 5 && (
          <div className="mb-12 space-y-4">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-500">
              <span>Step {step} of 4</span>
              <span>{Math.round((step / 4) * 100)}% Complete</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${(step / 4) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        <div className="bg-[#0D1427]/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-12 shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {step === 1 && <Step1Welcome onNext={handleNext} />}
              {step === 2 && <Step2CompanyDetails data={formData} updateData={updateFormData} />}
              {step === 3 && <Step3LogoUpload data={formData} updateData={updateFormData} />}
              {step === 4 && <Step4Review data={formData} onEdit={setStep} />}
              {step === 5 && <Step5Success companyName={formData.companyName} />}
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          {step > 1 && step < 5 && (
            <div className="mt-12 flex items-center justify-between pt-8 border-t border-white/5">
              <button
                onClick={handleBack}
                disabled={isLoading}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-medium px-6 py-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              {step === 4 ? (
                <button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-10 py-3 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="bg-white text-[#0A0F1E] px-10 py-3 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
