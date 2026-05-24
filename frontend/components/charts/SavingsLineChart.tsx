'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function SavingsLineChart({ data }: { data: any[] }) {
  const chartData = data.map(run => ({
    date: new Date(run.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    savings: run.total_savings_inr
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
            <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
        <XAxis
          dataKey="date"
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
          contentStyle={{
            backgroundColor: '#0D1427',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            fontSize: '12px',
            fontWeight: 700
          }}
          itemStyle={{ color: '#fff' }}
        />
        <Line
          type="monotone"
          dataKey="savings"
          stroke="#2563EB"
          strokeWidth={4}
          dot={{ fill: '#2563EB', strokeWidth: 2, r: 4, stroke: '#0D1427' }}
          activeDot={{ r: 6, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
