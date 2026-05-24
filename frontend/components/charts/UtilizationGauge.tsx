'use client'

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export default function UtilizationGauge({ value }: { value: number }) {
  const data = [
    { value: value, color: value > 70 ? '#10B981' : value > 50 ? '#F59E0B' : '#EF4444' },
    { value: 100 - value, color: 'rgba(255,255,255,0.05)' },
  ]

  return (
    <div className="relative w-64 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius={80}
            outerRadius={110}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
        <span className="text-5xl font-black font-space-grotesk text-white">{Math.round(value)}%</span>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-2">Avg Efficiency</span>
      </div>
    </div>
  )
}
