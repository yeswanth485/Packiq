'use client'

import { CountUpNumber } from '@/components/animations'

const METRICS = [
  { label: "Detection Accuracy", value: 99.3, suffix: "%" },
  { label: "Throughput", value: 1200, suffix: "/min" },
  { label: "False Positive Rate", value: 0.4, suffix: "%" },
  { label: "Inference Time", value: 18, suffix: "ms" },
  { label: "Uptime SLA", value: 99.8, suffix: "%" },
  { label: "Defect Classes", value: 24, suffix: "" }
]

export function MetricsShowcase() {
  return (
    <section className="py-24 px-6 bg-[#0A0A0F]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {METRICS.map((metric, i) => (
            <div key={i} className="glass p-6 rounded-2xl flex flex-col items-center text-center group hover:border-[#00FFD1]/30 transition-all">
              <div className="text-2xl md:text-3xl font-bold font-mono text-[#00FFD1] mb-2">
                <CountUpNumber value={metric.value} suffix={metric.suffix} decimals={metric.value % 1 !== 0 ? 1 : 0} />
              </div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-tight">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
