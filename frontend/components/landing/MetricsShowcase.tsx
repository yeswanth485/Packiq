import { CountUpNumber } from '@/components/animations'

const METRICS = [
  { label: "Brands Trust PackAI", value: 10000, suffix: "+" },
  { label: "Labels Generated", value: 50, suffix: "M+" },
  { label: "Platform Uptime", value: 99.9, suffix: "%" },
  { label: "Avg. Generation Time", value: 2, prefix: "< ", suffix: "s" }
]

export function MetricsShowcase() {
  return (
    <section className="py-32 px-6 bg-[#0A0A0F] border-y border-white/5">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {METRICS.map((metric, i) => (
            <div key={i} className="flex flex-col items-center text-center group">
              <div className="text-4xl md:text-6xl font-bold font-syne text-[#00FFD1] mb-4 tracking-tighter group-hover:scale-110 transition-transform duration-500">
                {metric.prefix}<CountUpNumber value={metric.value} suffix={metric.suffix} />
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em]">{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
