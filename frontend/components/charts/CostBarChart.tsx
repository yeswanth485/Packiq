'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function CostBarChart({ data }: { data: any[] }) {
  // Aggregate orders by date
  const aggregatedData = (data || []).reduce((acc: any, order: any) => {
    const dateStr = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!acc[dateStr]) {
      acc[dateStr] = { name: dateStr, original: 0, optimized: 0 }
    }
    acc[dateStr].original += (order.baseline_cost || 0)
    acc[dateStr].optimized += (order.total_cost || 0)
    return acc
  }, {})

  const chartData = Object.values(aggregatedData)

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
