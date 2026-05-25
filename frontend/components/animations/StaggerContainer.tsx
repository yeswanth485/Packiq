'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface StaggerContainerProps {
  children: ReactNode
  className?: string
  staggerDelay?: number
  delayChildren?: number
  viewportAmount?: number
}

export function StaggerContainer({ 
  children, 
  className = "", 
  staggerDelay = 0.1,
  delayChildren = 0,
  viewportAmount = 0.2
}: StaggerContainerProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: delayChildren,
      }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: viewportAmount }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ children, className = "" }: { children: ReactNode, className?: string }) {
  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 40, 
      rotateX: 15,
      z: -50,
      filter: 'blur(8px)'
    },
    show: { 
      opacity: 1, 
      y: 0,
      rotateX: 0,
      z: 0,
      filter: 'blur(0px)',
      transition: { type: "spring" as const, stiffness: 120, damping: 18 }
    }
  }

  return (
    <motion.div 
      variants={itemVariants} 
      className={className}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </motion.div>
  )
}
