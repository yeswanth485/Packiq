import { Upload, Cpu, CheckCircle, Truck } from 'lucide-react'
import { StaggerContainer, StaggerItem } from '@/components/animations'

const STEPS = [
  {
    icon: Upload,
    title: "Upload Product Data",
    desc: "Import your product catalog via CSV/Excel with dimensions, weight, and SKU details."
  },
  {
    icon: Cpu,
    title: "AI FFD Optimization",
    desc: "Our First Fit Decreasing engine powered by Claude AI finds the perfect box for every product."
  },
  {
    icon: CheckCircle,
    title: "Review & Pack",
    desc: "Compare results in 3D, follow step-by-step packing instructions for your team."
  },
  {
    icon: Truck,
    title: "Ship & Track",
    desc: "Ship orders with auto-generated tracking IDs and monitor delivery performance."
  }
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-32 px-6 relative bg-[#0A0A0F]">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-24">
          <div className="text-[10px] font-black text-[#00FFD1] uppercase tracking-[0.4em] mb-4">How it works</div>
          <h2 className="text-4xl md:text-7xl font-bold font-syne tracking-tighter leading-tight">
            Four steps to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FFD1] to-[#185FA5]">smarter packaging</span>
          </h2>
          <p className="text-xl text-gray-500 mt-6 max-w-2xl mx-auto leading-relaxed">
            Our FFD engine and Claude AI work together to find the perfect box for every product.
          </p>
        </div>

        <StaggerContainer className="grid md:grid-cols-4 gap-8 relative">
          {STEPS.map((step, i) => (
            <StaggerItem key={i} className="group relative">
              <div className="p-10 bg-white/[0.02] border border-white/5 rounded-[32px] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 h-full flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-8 relative group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                  <div className="absolute inset-0 bg-[#00FFD1]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <step.icon className="w-10 h-10 text-[#00FFD1]" />
                </div>

                <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4">Step 0{i + 1}</div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[#00FFD1] transition-colors">{step.title}</h3>
                <p className="text-base text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
              
              {i < STEPS.length - 1 && (
                <div className="hidden xl:block absolute top-1/2 -right-4 w-8 h-px bg-white/5 z-20" />
              )}
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
