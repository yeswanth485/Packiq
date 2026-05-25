'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function VoidPercentageLineChart({ data }: { data: any[] }) {
  const chartData = data && data.length > 0 ? data.map((d, index) => ({
    name: `Run ${index + 1}`,
    void_pct: 100 - (d.optimization_rate || 80)
  })) : [
    { name: 'Run 1', void_pct: 35 },
    { name: 'Run 2', void_pct: 28 },
    { name: 'Run 3', void_pct: 20 },
    { name: 'Run 4', void_pct: 15 },
    { name: 'Run 5', void_pct: 8 }
  ] // Fallback

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" vertical={false} />
        <XAxis dataKey="name" stroke="#ffffff60" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="#ffffff60" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
        <Tooltip
          contentStyle={{ backgroundColor: '#0D1427', borderColor: '#ffffff20', color: '#fff', borderRadius: '16px' }}
          itemStyle={{ color: '#F59E0B' }}
        />
        <Line type="monotone" dataKey="void_pct" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B', strokeWidth: 0 }} name="Void %" />
      </LineChart>
    </ResponsiveContainer>
  )
}
