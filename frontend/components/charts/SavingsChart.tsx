'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DataPoint {
  date: string
  savings: number
  co2?: number
}

export default function SavingsChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00FFD1" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#00FFD1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
        <XAxis 
          dataKey="date" 
          tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 600 }} 
          axisLine={false} 
          tickLine={false}
          dy={10}
        />
        <YAxis 
          tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 600 }} 
          axisLine={false} 
          tickLine={false}
          dx={-10}
        />
        <Tooltip
          contentStyle={{ 
            background: 'rgba(10, 10, 15, 0.85)', 
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)', 
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
          }}
          labelStyle={{ color: '#9CA3AF', fontSize: '11px', fontWeight: 'bold' }}
          itemStyle={{ fontSize: '12px' }}
        />
        <Area 
          type="monotone" 
          dataKey="savings" 
          stroke="#00FFD1" 
          fill="url(#savingsGrad)" 
          strokeWidth={2} 
          name="Savings ($)" 
          dot={{ r: 3, fill: '#00FFD1', strokeWidth: 1, stroke: '#0A0A0F' }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
        <Area 
          type="monotone" 
          dataKey="co2" 
          stroke="#8B5CF6" 
          fill="url(#co2Grad)" 
          strokeWidth={2} 
          name="CO₂ Saved (kg)" 
          dot={{ r: 3, fill: '#8B5CF6', strokeWidth: 1, stroke: '#0A0A0F' }}
          activeDot={{ r: 5, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
