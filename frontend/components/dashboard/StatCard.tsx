'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: ReactNode
  color?: 'indigo' | 'cyan' | 'green' | 'amber'
  isCurrency?: boolean
  isNumber?: boolean
  isPercentage?: boolean
}

const colorMap = {
  indigo: 'from-indigo-600/20 to-indigo-600/5 border-indigo-500/20 text-indigo-400',
  cyan:   'from-cyan-600/20 to-cyan-600/5 border-cyan-500/20 text-cyan-400',
  green:  'from-green-600/20 to-green-600/5 border-green-500/20 text-green-400',
  amber:  'from-amber-600/20 to-amber-600/5 border-amber-500/20 text-amber-400',
}

export default function StatCard({ label, value, sub, icon, color = 'indigo', isCurrency, isNumber, isPercentage }: StatCardProps) {
  const colors = colorMap[color]
  
  // Parse numeric value
  let numericValue = 0
  if (typeof value === 'number') {
    numericValue = value
  } else if (typeof value === 'string') {
    numericValue = parseFloat(value.replace(/[^0-9.-]+/g,""))
  }

  const [mounted, setMounted] = useState(false)
  const [displayValue, setDisplayValue] = useState<string | number>(value)
  const springValue = useSpring(0, { bounce: 0, duration: 1500 })
  
  useEffect(() => {
    setMounted(true)
    const controls = springValue.on('change', (current) => {
      let formatted: string | number = current
      if (isCurrency) {
        formatted = `$${current.toFixed(2)}`
      } else if (isPercentage) {
        formatted = `${current.toFixed(1)}%`
      } else if (isNumber) {
        formatted = Math.round(current)
      }
      setDisplayValue(formatted)
    })
    springValue.set(numericValue || 0)
    return () => controls()
  }, [numericValue, springValue, isCurrency, isPercentage, isNumber])

  return (
    <div className={`glass rounded-2xl p-5 bg-gradient-to-br card-hover border ${colors}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">
            {displayValue}
          </p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors} bg-gradient-to-br`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
