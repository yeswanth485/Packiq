'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function CarrierDistributionDonut({ data }: { data: any[] }) {
  // Aggregate carriers from orders data if provided
  let chartData = []
  
  if (data && data.length > 0) {
    const carrierCount: Record<string, number> = {}
    data.forEach(d => {
      // The backend saves carrier/optimized_box. Let's infer carrier from optimized_box.
      const box = d.optimized_box || ''
      let carrier = 'Other'
      if (box.toLowerCase().includes('fedex')) carrier = 'FedEx'
      else if (box.toLowerCase().includes('ups')) carrier = 'UPS'
      else if (box.toLowerCase().includes('usps')) carrier = 'USPS'
      else if (box.toLowerCase().includes('dhl')) carrier = 'DHL'
      
      carrierCount[carrier] = (carrierCount[carrier] || 0) + 1
    })
    
    chartData = Object.keys(carrierCount).map(k => ({ name: k, value: carrierCount[k] }))
  } else {
    chartData = [
      { name: 'FedEx', value: 400 },
      { name: 'UPS', value: 300 },
      { name: 'USPS', value: 300 },
      { name: 'DHL', value: 200 }
    ] // Fallback
  }

  const COLORS = ['#4D148C', '#FFB500', '#333366', '#D40511', '#8884d8']

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={120}
          paddingAngle={5}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: '#0D1427', borderColor: '#ffffff20', color: '#fff', borderRadius: '16px' }}
        />
        <Legend verticalAlign="bottom" height={36} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  )
}
