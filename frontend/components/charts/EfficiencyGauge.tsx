'use client'

import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'

export default function EfficiencyGauge({ score }: { score: number }) {
  const data = [
    { name: 'bg', value: 100, fill: 'rgba(255,255,255,0.06)' },
    { name: 'score', value: score, fill: score >= 80 ? '#6366f1' : score >= 60 ? '#f59e0b' : '#ef4444' },
  ]

  return (
    <div className="relative flex flex-col items-center justify-center">
      <ResponsiveContainer width={160} height={160}>
        <RadialBarChart
          cx="50%" cy="50%"
          innerRadius="60%" outerRadius="90%"
          startAngle={220} endAngle={-40}
          data={data}
          barSize={14}
        >
          <RadialBar dataKey="value" cornerRadius={8} background={false} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-white">{score.toFixed(0)}</span>
        <span className="text-xs text-gray-400">Efficiency</span>
      </div>
    </div>
  )
}
