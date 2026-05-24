'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function CostBarChart({ data }: { data: any[] }) {
  const chartData = data.map(run => {
    const results = run.results_json || []
    const original = results.reduce((acc: number, r: any) => acc + (r.original_box_price_inr || 0), 0)
    const optimized = results.reduce((acc: number, r: any) => acc + (r.optimized_box_price_inr || 0), 0)

    return {
      name: new Date(run.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      original,
      optimized
    }
  })

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} barGap={8}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="#94A3B8"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tick={{ fontWeight: 700 }}
        />
        <YAxis
          stroke="#94A3B8"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `₹${v}`}
          tick={{ fontWeight: 700 }}
        />
        <Tooltip
          cursor={{ fill: 'rgba(255,255,255,0.02)' }}
          contentStyle={{
            backgroundColor: '#0D1427',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            fontSize: '12px'
          }}
        />
        <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
        <Bar name="Original Cost" dataKey="original" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={24} />
        <Bar name="Optimized Cost" dataKey="optimized" fill="#2563EB" radius={[6, 6, 0, 0]} barSize={24} />
      </BarChart>
    </ResponsiveContainer>
  )
}
