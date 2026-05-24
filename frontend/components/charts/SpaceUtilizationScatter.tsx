'use client'

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell } from 'recharts'

export default function SpaceUtilizationScatter({ data }: { data: any[] }) {
  const chartData = data.map(r => ({
    name: r.product_name,
    volume: r.original_length_cm * r.original_width_cm * r.original_height_cm,
    utilization: r.space_utilization_percent,
    fragility: r.fragility
  }))

  const getFragilityColor = (f: string) => {
    if (f === 'high') return '#EF4444'
    if (f === 'medium') return '#F59E0B'
    return '#10B981'
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
        <XAxis
          type="number"
          dataKey="volume"
          name="Volume"
          unit="cm³"
          stroke="#94A3B8"
          fontSize={10}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="number"
          dataKey="utilization"
          name="Utilization"
          unit="%"
          stroke="#94A3B8"
          fontSize={10}
          tickLine={false}
          axisLine={false}
        />
        <ZAxis type="number" range={[100, 100]} />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          contentStyle={{
            backgroundColor: '#0D1427',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            fontSize: '12px'
          }}
        />
        <Scatter name="Products" data={chartData}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getFragilityColor(entry.fragility)} />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  )
}
