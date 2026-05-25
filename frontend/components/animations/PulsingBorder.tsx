'use client'

import { motion } from 'framer-motion'

interface PulsingBorderProps {
  state?: 'idle' | 'active' | 'alert'
  className?: string
  children: React.ReactNode
}

export function PulsingBorder({ state = 'idle', className = '', children }: PulsingBorderProps) {
  const colors = {
    idle: 'rgba(0, 255, 209, 0.2)',
    active: 'rgba(0, 255, 209, 0.6)',
    alert: 'rgba(255, 68, 68, 0.6)'
  }

  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        boxShadow: [
          `0 0 0 0 ${colors[state]}`,
          `0 0 0 8px rgba(0, 0, 0, 0)`,
        ]
      }}
      transition={{
        duration: state === 'alert' ? 1 : 2,
        repeat: Infinity,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  )
}
