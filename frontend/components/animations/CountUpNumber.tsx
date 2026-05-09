'use client'

import { useEffect, useState, useRef } from 'react'
import { animate, useInView } from 'framer-motion'

interface CountUpNumberProps {
  value: number
  duration?: number
  decimals?: number
  prefix?: string
  suffix?: string
  className?: string
}

export function CountUpNumber({
  value,
  duration = 2,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = ''
}: CountUpNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration,
        ease: "easeOut",
        onUpdate(v) {
          setDisplayValue(v)
        }
      })
      return () => controls.stop()
    }
  }, [value, isInView, duration])

  const formatted = displayValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  )
}
