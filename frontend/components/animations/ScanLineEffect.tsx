'use client'

import { motion } from 'framer-motion'

export function ScanLineEffect({ duration = 2 }: { duration?: number }) {
  return (
    <motion.div
      className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00FFD1] to-transparent z-10 shadow-[0_0_8px_#00FFD1]"
      animate={{
        top: ['-2%', '102%']
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear"
      }}
      style={{ willChange: 'top' }}
    />
  )
}
