'use client'

import { Camera, Brain, BarChart3 } from 'lucide-react'
import { StaggerContainer, StaggerItem, DataFlowLine } from '@/components/animations'

const STEPS = [
  {
    icon: Camera,
    title: "Install",
    desc: "Camera + sensor setup in 48 hours. Plug-and-play integration with your existing line."
  },
  {
    icon: Brain,
    title: "Train",
    desc: "AI learns your product in 72 hours. No data science team needed — just sample data."
  },
  {
    icon: BarChart3,
    title: "Inspect",
    desc: "Live defect detection, real-time dashboard, and instant ejector signal for bad units."
  }
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 px-6 relative bg-white/[0.01]">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-bold font-syne">How It Works</h2>
          <p className="text-gray-500 mt-4 max-w-xl mx-auto">Deploying enterprise-grade AI should be simple. We made it a 3-step process.</p>
        </div>

        <StaggerContainer className="grid md:grid-cols-3 gap-12 relative">
          {STEPS.map((step, i) => (
            <StaggerItem key={i} className="relative flex flex-col items-center text-center">
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-12 left-1/2 w-full z-0 opacity-50">
                  <DataFlowLine />
                </div>
              )}
              
              <div className="w-24 h-24 rounded-full bg-[#00FFD1]/5 border border-[#00FFD1]/20 flex items-center justify-center mb-8 relative z-10 group overflow-hidden">
                <div className="absolute inset-0 bg-[#00FFD1]/5 group-hover:animate-pulse" />
                <step.icon className="w-10 h-10 text-[#00FFD1]" />
              </div>

              <h3 className="text-2xl font-bold text-white mb-4">Step {i + 1}: {step.title}</h3>
              <p className="text-gray-400 leading-relaxed px-4">{step.desc}</p>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
