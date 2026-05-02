'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { 
  Building2, 
  Globe, 
  UploadCloud, 
  Package, 
  Truck, 
  Leaf,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Minus,
  Plus,
  Box,
  DollarSign,
  Zap
} from 'lucide-react'

// --- Types ---
type SizeUnits = 'cm' | 'inches'
type FulfillmentType = 'In-House' | '3PL' | 'Hybrid'

interface WizardData {
  companyName: string
  industry: string
  companySize: string
  websiteUrl: string
  monthlyVolume: number
  primaryCarriers: string[]
  fulfillmentType: FulfillmentType
  warehousesCount: number
  sizeUnits: SizeUnits
  materials: string[]
  optimizationGoal: string
  sustainabilityMode: boolean
}

// --- Constants ---
const INDUSTRIES = ['Retail', 'E-Commerce', 'Manufacturing', '3PL', 'Other']
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '200+']
const CARRIERS = ['FedEx', 'DHL', 'UPS', 'Amazon', 'Maersk', 'Other']
const MATERIALS = ['Cardboard', 'Poly Mailers', 'Bubble Wrap', 'Custom Inserts']
const FULFILLMENT_TYPES: FulfillmentType[] = ['In-House', '3PL', 'Hybrid']
const OPTIMIZATION_GOALS = [
  { id: 'void', label: 'Minimize Void Space', icon: Box },
  { id: 'cost', label: 'Reduce Carrier Cost', icon: DollarSign },
  { id: 'speed', label: 'Speed of Pack', icon: Zap },
]

export default function OnboardingWizard() {
  const router = useRouter()
  const supabase = createClient()
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<WizardData>({
    companyName: '',
    industry: '',
    companySize: '',
    websiteUrl: '',
    monthlyVolume: 1000,
    primaryCarriers: [],
    fulfillmentType: 'In-House',
    warehousesCount: 1,
    sizeUnits: 'cm',
    materials: [],
    optimizationGoal: '',
    sustainabilityMode: false,
  })

  // Prefill from signup
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // You could try fetching existing profile data here if needed
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('company')
          .eq('id', user.id)
          .single()
        
        if (profile?.company) {
          setData(prev => ({ ...prev, companyName: profile.company }))
        }
      }
    }
    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleLaunch = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { error } = await (supabase as any).from('profiles').upsert({
        id: user.id,
        email: user.email,
        company: data.companyName,
        company_domain: data.websiteUrl,
        onboarding_completed: true
      })

      if (error) {
        console.error('Failed to update profile:', error)
        alert('Failed to save profile: ' + error.message)
        setLoading(false)
        return
      }

      // Confetti Burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00E5CC', '#3B82F6', '#FFFFFF']
      })

      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } else {
      setLoading(false)
    }
  }

  // Variants for Framer Motion
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05050a] p-4 font-sans text-white overflow-hidden relative">
      
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#00E5CC]/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[680px] bg-[#0f0f1a] border border-white/[0.08] p-6 sm:p-8 rounded-[20px] shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20">
            <Package className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Setup your workspace</h1>
          <p className="text-zinc-400 text-sm mt-1">Let's tailor PackIQ to your business needs.</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-10 relative">
          <div className="absolute top-4 left-[10%] right-[10%] h-[2px] bg-white/[0.05] -z-10" />
          <motion.div 
            className="absolute top-4 left-[10%] h-[2px] bg-blue-500 -z-10 origin-left"
            initial={{ width: '0%' }}
            animate={{ width: `${((step - 1) / 3) * 80}%` }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          />
          
          <div className="flex justify-between">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    step === i 
                      ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] ring-2 ring-blue-500/30' 
                      : step > i 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {step > i ? <CheckCircle2 className="w-4 h-4" /> : i}
                </div>
                <span className={`text-[10px] sm:text-xs mt-2 font-medium ${step >= i ? 'text-zinc-300' : 'text-zinc-600'}`}>
                  {i === 1 && 'Company'}
                  {i === 2 && 'Scale'}
                  {i === 3 && 'Preferences'}
                  {i === 4 && 'Review'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Area */}
        <div className="min-h-[380px] relative">
          <AnimatePresence mode="wait" custom={step}>
            <motion.div
              key={step}
              custom={step}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute inset-0 w-full"
            >
              {/* STEP 1: Company Profile */}
              {step === 1 && (
                <div className="space-y-6">
                  {/* Logo Upload */}
                  <div className="flex flex-col items-center justify-center w-full">
                    <div className="w-full h-32 border-2 border-dashed border-zinc-700 rounded-xl bg-zinc-900/50 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800/50 hover:border-zinc-500 transition-all group">
                      <UploadCloud className="w-8 h-8 text-zinc-500 group-hover:text-blue-400 mb-2 transition-colors" />
                      <p className="text-sm text-zinc-400 font-medium">Click to upload company logo</p>
                      <p className="text-xs text-zinc-600 mt-1">SVG, PNG, JPG (max 2MB)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-zinc-500" />
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={data.companyName}
                        onChange={e => updateData({ companyName: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        placeholder="Acme Corp"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-zinc-500" />
                        Website URL
                      </label>
                      <input
                        type="url"
                        value={data.websiteUrl}
                        onChange={e => updateData({ websiteUrl: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        placeholder="https://acme.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-300">Industry</label>
                    <div className="relative">
                      <select
                        value={data.industry}
                        onChange={e => updateData({ industry: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none transition-all"
                      >
                        <option value="" disabled>Select your primary industry</option>
                        {INDUSTRIES.map(ind => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-300">Company Size</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {COMPANY_SIZES.map(size => (
                        <button
                          key={size}
                          onClick={() => updateData({ companySize: size })}
                          className={`py-3 px-2 rounded-lg border text-sm font-medium transition-all ${
                            data.companySize === size 
                              ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)]' 
                              : 'bg-black/30 border-white/5 text-zinc-400 hover:border-white/20'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Business Type & Scale */}
              {step === 2 && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-zinc-300">Monthly Shipment Volume</label>
                      <span className="text-blue-400 font-semibold bg-blue-500/10 px-3 py-1 rounded-full text-sm">
                        {data.monthlyVolume >= 100000 ? '100,000+' : data.monthlyVolume.toLocaleString()} / mo
                      </span>
                    </div>
                    <input 
                      type="range" 
                      min="100" 
                      max="100000" 
                      step="100"
                      value={data.monthlyVolume}
                      onChange={e => updateData({ monthlyVolume: parseInt(e.target.value) })}
                      className="w-full accent-blue-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-zinc-500" />
                      Primary Carriers
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CARRIERS.map(carrier => {
                        const isSelected = data.primaryCarriers.includes(carrier)
                        return (
                          <button
                            key={carrier}
                            onClick={() => {
                              if (isSelected) {
                                updateData({ primaryCarriers: data.primaryCarriers.filter(c => c !== carrier) })
                              } else {
                                updateData({ primaryCarriers: [...data.primaryCarriers, carrier] })
                              }
                            }}
                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                              isSelected 
                                ? 'bg-blue-500/20 border-blue-500 text-white' 
                                : 'bg-black/50 border-white/10 text-zinc-400 hover:border-white/20'
                            }`}
                          >
                            {carrier}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-zinc-300">Fulfillment Type</label>
                      <div className="flex bg-black/50 p-1 rounded-lg border border-white/5">
                        {FULFILLMENT_TYPES.map(type => (
                          <button
                            key={type}
                            onClick={() => updateData({ fulfillmentType: type })}
                            className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-md transition-all ${
                              data.fulfillmentType === type 
                                ? 'bg-[#1a1a24] text-white shadow-sm' 
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-zinc-300">Warehouses Count</label>
                      <div className="flex items-center gap-4 bg-black/50 p-2 rounded-lg border border-white/5">
                        <button 
                          onClick={() => updateData({ warehousesCount: Math.max(1, data.warehousesCount - 1) })}
                          className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                        >
                          <Minus className="w-4 h-4 text-white" />
                        </button>
                        <span className="flex-1 text-center font-semibold text-lg">{data.warehousesCount}</span>
                        <button 
                          onClick={() => updateData({ warehousesCount: data.warehousesCount + 1 })}
                          className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
                        >
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Packaging Preferences */}
              {step === 3 && (
                <div className="space-y-8">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-zinc-300">Default Size Units</label>
                      <div className="flex bg-black/50 p-1 rounded-lg border border-white/5">
                        {(['cm', 'inches'] as SizeUnits[]).map(unit => (
                          <button
                            key={unit}
                            onClick={() => updateData({ sizeUnits: unit })}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                              data.sizeUnits === unit 
                                ? 'bg-[#1a1a24] text-white shadow-sm' 
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            {unit.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium text-zinc-300">Sustainability</label>
                      <button 
                        onClick={() => updateData({ sustainabilityMode: !data.sustainabilityMode })}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                          data.sustainabilityMode 
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                            : 'bg-black/50 border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <Leaf className="w-4 h-4" />
                          Eco-Optimization Mode
                        </span>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${data.sustainabilityMode ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                          <motion.div 
                            layout
                            className={`w-4 h-4 bg-white rounded-full absolute top-[2px] ${data.sustainabilityMode ? 'right-[2px]' : 'left-[2px]'}`} 
                          />
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-300">Packaging Materials Used</label>
                    <div className="flex flex-wrap gap-2">
                      {MATERIALS.map(material => {
                        const isSelected = data.materials.includes(material)
                        return (
                          <button
                            key={material}
                            onClick={() => {
                              if (isSelected) {
                                updateData({ materials: data.materials.filter(m => m !== material) })
                              } else {
                                updateData({ materials: [...data.materials, material] })
                              }
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                              isSelected 
                                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' 
                                : 'bg-black/50 border-white/10 text-zinc-400 hover:border-white/20'
                            }`}
                          >
                            {material}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-zinc-300">Primary Optimization Goal</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {OPTIMIZATION_GOALS.map(goal => {
                        const Icon = goal.icon
                        return (
                          <button
                            key={goal.id}
                            onClick={() => updateData({ optimizationGoal: goal.id })}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-3 text-center transition-all ${
                              data.optimizationGoal === goal.id 
                                ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                                : 'bg-black/30 border-white/5 hover:bg-black/50 hover:border-white/10'
                            }`}
                          >
                            <div className={`p-3 rounded-full ${data.optimizationGoal === goal.id ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-400'}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className={`text-sm font-medium ${data.optimizationGoal === goal.id ? 'text-white' : 'text-zinc-400'}`}>
                              {goal.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* STEP 4: Review & Launch */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="bg-black/40 border border-white/5 rounded-xl p-5 space-y-4 text-sm backdrop-blur-sm">
                    <h3 className="font-semibold text-white border-b border-white/10 pb-2 flex justify-between">
                      Company Profile
                      <button onClick={() => setStep(1)} className="text-blue-400 text-xs hover:underline">Edit</button>
                    </h3>
                    <div className="grid grid-cols-2 gap-y-3 text-zinc-400">
                      <span className="text-zinc-500">Name:</span> <span className="text-white font-medium">{data.companyName || 'Not set'}</span>
                      <span className="text-zinc-500">Industry:</span> <span className="text-white font-medium">{data.industry || 'Not set'}</span>
                      <span className="text-zinc-500">Size:</span> <span className="text-white font-medium">{data.companySize || 'Not set'}</span>
                    </div>

                    <h3 className="font-semibold text-white border-b border-white/10 pb-2 pt-2 flex justify-between">
                      Scale & Logistics
                      <button onClick={() => setStep(2)} className="text-blue-400 text-xs hover:underline">Edit</button>
                    </h3>
                    <div className="grid grid-cols-2 gap-y-3 text-zinc-400">
                      <span className="text-zinc-500">Volume:</span> <span className="text-white font-medium">{data.monthlyVolume.toLocaleString()} / mo</span>
                      <span className="text-zinc-500">Fulfillment:</span> <span className="text-white font-medium">{data.fulfillmentType} ({data.warehousesCount} WH)</span>
                      <span className="text-zinc-500">Carriers:</span> <span className="text-white font-medium">{data.primaryCarriers.join(', ') || 'None'}</span>
                    </div>

                    <h3 className="font-semibold text-white border-b border-white/10 pb-2 pt-2 flex justify-between">
                      Preferences
                      <button onClick={() => setStep(3)} className="text-blue-400 text-xs hover:underline">Edit</button>
                    </h3>
                    <div className="grid grid-cols-2 gap-y-3 text-zinc-400">
                      <span className="text-zinc-500">Units:</span> <span className="text-white font-medium">{data.sizeUnits.toUpperCase()}</span>
                      <span className="text-zinc-500">Goal:</span> <span className="text-white font-medium">
                        {OPTIMIZATION_GOALS.find(g => g.id === data.optimizationGoal)?.label || 'Not set'}
                      </span>
                      <span className="text-zinc-500">Eco-Mode:</span> <span className={data.sustainabilityMode ? "text-emerald-400 font-medium" : "text-white font-medium"}>
                        {data.sustainabilityMode ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="mt-10 pt-6 border-t border-white/10 flex justify-between items-center gap-4 relative z-20">
          <button
            onClick={handleBack}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors ${step === 1 ? 'invisible' : ''}`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          
          {step < 4 ? (
            <button
              onClick={handleNext}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-medium shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] flex-1 sm:flex-none"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleLaunch}
              disabled={loading}
              className="relative overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-[#00E5CC] hover:from-blue-500 hover:to-[#14f3da] text-white px-8 py-3 rounded-lg font-bold shadow-[0_0_20px_rgba(0,229,204,0.3)] transition-all w-full sm:w-auto flex-1 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="relative z-10">Launch My Dashboard</span>
                  <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                </>
              )}
            </button>
          )}
        </div>
        
      </motion.div>
    </div>
  )
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  )
}
