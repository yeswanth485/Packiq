'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const DATA = [
  { year: '2025', market: 2.84 },
  { year: '2026', market: 3.25 },
  { year: '2027', market: 3.80 },
  { year: '2028', market: 4.45 },
  { year: '2029', market: 5.10 },
  { year: '2030', market: 5.37 },
  { year: '2032', market: 7.20 },
  { year: '2034', market: 9.03 }
]

export function MarketChart() {
  return (
    <section className="py-24 px-6 bg-white/[0.01]">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-16">
          <div className="md:w-1/2">
            <h2 className="text-3xl md:text-5xl font-bold font-syne mb-6">Riding a $9B Wave</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="text-xl font-bold text-[#00FFD1] font-mono shrink-0">29%</div>
                <p className="text-gray-400">CAGR in QC inspection segment for automated packaging lines.</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-xl font-bold text-[#00FFD1] font-mono shrink-0">50%</div>
                <p className="text-gray-400">of packaging operations predicted to be fully automated by 2027.</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-xl font-bold text-[#00FFD1] font-mono shrink-0">&lt;2y</div>
                <p className="text-gray-400">Payback period for AI-driven visual inspection systems.</p>
              </div>
            </div>
          </div>

          <div className="md:w-1/2 w-full h-[300px] md:h-[400px] glass p-6 rounded-3xl relative overflow-hidden">
            <div className="absolute top-6 left-6 z-10">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Global AI Packaging Market</h3>
              <p className="text-xl font-bold text-white">Billions USD ($)</p>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DATA} margin={{ top: 80, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMarket" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FFD1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00FFD1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis hide domain={[0, 10]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#00FFD1' }}
                />
                <Area type="monotone" dataKey="market" stroke="#00FFD1" fillOpacity={1} fill="url(#colorMarket)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  )
}
