'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = ['#00E5CC', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444']

export default function BoxUsageChart({ data }: { data: any[] }) {
  // Expected data format: [{ name: 'Small Box', value: 40 }, ...]
  
  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
            itemStyle={{ fontSize: '12px' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-gray-400 text-xs">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
