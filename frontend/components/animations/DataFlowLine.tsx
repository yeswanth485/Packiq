'use client'

import { motion } from 'framer-motion'

export function DataFlowLine({ 
  className = "", 
  direction = "horizontal" 
}: { 
  className?: string, 
  direction?: "horizontal" | "vertical" 
}) {
  return (
    <div className={`relative ${className} ${direction === 'horizontal' ? 'h-[2px] w-full' : 'w-[2px] h-full'}`}>
      <div className={`absolute inset-0 bg-white/10 ${direction === 'horizontal' ? 'h-full w-full' : 'w-full h-full'}`} />
      <motion.div
        className={`absolute rounded-full bg-[#00FFD1] shadow-[0_0_8px_#00FFD1] ${direction === 'horizontal' ? 'w-2 h-2 top-1/2 -translate-y-1/2' : 'w-2 h-2 left-1/2 -translate-x-1/2'}`}
        animate={direction === 'horizontal' ? {
          left: ['0%', '100%'],
          opacity: [0, 1, 0]
        } : {
          top: ['0%', '100%'],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  )
}
