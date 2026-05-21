'use client'

import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts'

export default function EfficiencyGauge({ score }: { score: number }) {
  // We format data so that we only have one radial bar that fills up to the score, 
  // and we use PolarAngleAxis to draw the track/background circle.
  const data = [{ name: 'Efficiency', value: score }]

  // Pick color based on score
  const color = score >= 85 ? '#00FFD1' : score >= 65 ? '#F59E0B' : '#EF4444'

  return (
    <div className="relative flex flex-col items-center justify-center">
      <ResponsiveContainer width={160} height={160}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="75%"
          outerRadius="95%"
          barSize={10}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background={{ fill: 'rgba(255, 255, 255, 0.04)' }}
            dataKey="value"
            cornerRadius={10}
            fill={color}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute flex flex-col items-center">
        <span 
          className="text-3xl font-black font-mono tracking-tighter"
          style={{ color, textShadow: `0 0 20px ${color}40` }}
        >
          {score.toFixed(0)}%
        </span>
        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black mt-0.5">Efficiency</span>
      </div>
    </div>
  )
}
