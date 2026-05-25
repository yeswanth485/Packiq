'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function CO2AreaChart({ data }: { data: any[] }) {
  const chartData = data.map(run => ({
    date: new Date(run.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    co2: run.co2_saved_kg
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="#94A3B8"
          fontSize={10}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#94A3B8"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}kg`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0D1427',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            fontSize: '12px'
          }}
        />
        <Area
          type="monotone"
          dataKey="co2"
          stroke="#06B6D4"
          fillOpacity={1}
          fill="url(#colorCo2)"
          strokeWidth={3}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
