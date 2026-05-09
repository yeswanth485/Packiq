'use client'

import { CheckCircle2 } from 'lucide-react'
import { StaggerContainer, StaggerItem } from '@/components/animations'

const FEATURES = [
  "Real-time edge inference (<20ms)",
  "Active learning feedback loop",
  "PLC / SCADA integration",
  "REST API for external WMS",
  "Cloud + On-premise deployment",
  "Supabase real-time dashboard"
]

export function TechStackSection() {
  return (
    <section className="py-24 px-6 bg-[#0A0A0F]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold font-syne mb-6">
              Enterprise-Grade AI.<br />
              <span className="text-[#00FFD1]">Startup-Speed Deployment.</span>
            </h2>
            <p className="text-gray-400 mb-10 leading-relaxed">
              We built our infrastructure on the world's most robust technologies to ensure your line never stops.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {FEATURES.map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#00FFD1]" />
                  <span className="text-sm font-medium text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-10 rounded-[32px] relative overflow-hidden">
            <div className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] mb-10 text-center">Powered By</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-10 items-center justify-items-center opacity-70 grayscale hover:grayscale-0 transition-all">
              {/* Using text for logos for now, normally would be SVGs */}
              <div className="text-xl font-bold text-white">Anthropic</div>
              <div className="text-xl font-bold text-white">OpenAI</div>
              <div className="text-xl font-bold text-white">NVIDIA</div>
              <div className="text-xl font-bold text-white">Supabase</div>
              <div className="text-xl font-bold text-white">Node.js</div>
              <div className="text-xl font-bold text-white">Next.js</div>
            </div>
            
            <div className="mt-20 p-6 bg-[#00FFD1]/5 rounded-2xl border border-[#00FFD1]/10">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
                <div className="text-[10px] font-mono text-gray-500">inspection-stream.log</div>
              </div>
              <div className="space-y-2 font-mono text-[11px]">
                <div className="text-gray-500">[14:02:21] <span className="text-green-400">PASSED</span> unit_id: B4392 confidence: 0.998</div>
                <div className="text-gray-500">[14:02:21] <span className="text-green-400">PASSED</span> unit_id: B4393 confidence: 0.994</div>
                <div className="text-gray-500">[14:02:22] <span className="text-red-500">REJECT</span> unit_id: B4394 <span className="text-white">reason: seal_breach</span></div>
                <div className="text-[#00FFD1] animate-pulse">_</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
