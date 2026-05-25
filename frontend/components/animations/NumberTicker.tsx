'use client'

import { useEffect, useRef } from 'react'
import { useMotionValue, useSpring, motion, useTransform } from 'framer-motion'

export function NumberTicker({ 
  value, 
  direction = "up" 
}: { 
  value: number, 
  direction?: "up" | "down" 
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 30,
  })
  const displayValue = useTransform(springValue, (latest) => Math.round(latest).toLocaleString())

  useEffect(() => {
    motionValue.set(value)
  }, [motionValue, value])

  return (
    <motion.span
      ref={ref}
      className={direction === "up" ? "text-[#00FFD1]" : "text-red-500"}
    >
      {displayValue}
    </motion.span>
  )
}
