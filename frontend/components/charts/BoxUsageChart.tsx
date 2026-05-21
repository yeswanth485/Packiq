'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const GRADIENTS = [
  { id: 'cyanTeal', stop1: '#00FFD1', stop2: '#185FA5' },
  { id: 'violetPink', stop1: '#8B5CF6', stop2: '#EC4899' },
  { id: 'greenEmerald', stop1: '#10B981', stop2: '#059669' },
  { id: 'orangeAmber', stop1: '#F59E0B', stop2: '#D97706' },
  { id: 'roseRed', stop1: '#F43F5E', stop2: '#BE123C' }
]

export default function BoxUsageChart({ data }: { data: any[] }) {
  // Expected data format: [{ name: 'Small Box', value: 40 }, ...]
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-[300px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {GRADIENTS.map((g) => (
              <linearGradient id={g.id} key={g.id} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={g.stop1} />
                <stop offset="100%" stopColor={g.stop2} />
              </linearGradient>
            ))}
          </defs>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={85}
            paddingAngle={6}
            dataKey="value"
            cornerRadius={4}
          >
            {data.map((entry, index) => {
              const g = GRADIENTS[index % GRADIENTS.length]
              return <Cell key={`cell-${index}`} fill={`url(#${g.id})`} stroke="rgba(255, 255, 255, 0.05)" strokeWidth={1} />
            })}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(10, 10, 15, 0.8)', 
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)', 
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
            }}
            itemStyle={{ fontSize: '11px', color: '#FFF' }}
            labelStyle={{ display: 'none' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value, entry: any, index) => {
              const color = GRADIENTS[index % GRADIENTS.length].stop1;
              return (
                <span className="text-xs font-medium tracking-wide" style={{ color }}>
                  {value}
                </span>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
