'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function SKUComparisonChart({ data }: { data: any[] }) {
  const chartData = data.slice(0, 15).map(r => ({
    name: r.product_name.length > 15 ? r.product_name.substring(0, 12) + '...' : r.product_name,
    original: r.original_box_price_inr,
    optimized: r.optimized_box_price_inr,
    fullName: r.product_name
  }))

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
          labelStyle={{ color: '#fff', fontWeight: 700, marginBottom: '4px' }}
          formatter={(value: any, name: any) => [
            `₹${value}`,
            name === 'original' ? 'Original Price' : 'Optimized Price'
          ]}
        />
        <Bar dataKey="original" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
        <Bar dataKey="optimized" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  )
}
