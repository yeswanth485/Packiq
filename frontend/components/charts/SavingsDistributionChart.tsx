'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function SavingsDistributionChart({ data }: { data: any[] }) {
  const buckets = [
    { range: '0-10%', min: 0, max: 10, count: 0 },
    { range: '10-20%', min: 10, max: 20, count: 0 },
    { range: '20-30%', min: 20, max: 30, count: 0 },
    { range: '30%+', min: 30, max: 1000, count: 0 },
  ]

  data.forEach(r => {
    const p = r.savings_percent
    const bucket = buckets.find(b => p >= b.min && p < b.max)
    if (bucket) bucket.count++
  })

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={buckets}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
        <XAxis
          dataKey="range"
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
          tick={{ fontWeight: 700 }}
        />
        <Tooltip
          cursor={{ fill: 'rgba(37,99,235,0.05)' }}
          contentStyle={{
            backgroundColor: '#0D1427',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            fontSize: '12px'
          }}
        />
        <Bar dataKey="count" fill="#2563EB" radius={[8, 8, 0, 0]} barSize={60} />
      </BarChart>
    </ResponsiveContainer>
  )
}
