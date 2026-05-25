'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

export default function FragilityDonut({ data }: { data: any[] }) {
  const counts = (data || []).reduce((acc: any, r: any) => {
    const f = r.fragility?.toLowerCase() || 'low'
    acc[f] = (acc[f] || 0) + 1
    return acc
  }, { low: 0, medium: 0, high: 0 })

  const chartData = [
    { name: 'Low', value: counts.low, color: '#10B981' },
    { name: 'Medium', value: counts.medium, color: '#F59E0B' },
    { name: 'High', value: counts.high, color: '#EF4444' },
  ].filter(d => d.value > 0)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip
          contentStyle={{
            backgroundColor: '#0D1427',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            fontSize: '12px'
          }}
        />
        <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }} />
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={120}
          paddingAngle={8}
          dataKey="value"
          stroke="none"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}
