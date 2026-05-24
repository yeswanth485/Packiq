'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, PartyPopper } from 'lucide-react'

interface Step5Props {
  companyName: string
}

export default function Step5Success({ companyName }: Step5Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center space-y-8 py-10"
    >
      <div className="relative">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
          className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)]"
        >
          <CheckCircle2 className="w-12 h-12 text-white" />
        </motion.div>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-4 -right-4"
        >
          <PartyPopper className="w-8 h-8 text-yellow-400" />
        </motion.div>
      </div>

      <div className="space-y-3">
        <h2 className="text-3xl font-bold font-space-grotesk text-white">You're all set!</h2>
        <p className="text-xl text-zinc-400">
          Welcome to the future of logistics, <span className="text-white font-bold">{companyName}</span>.
        </p>
      </div>

      <div className="flex items-center gap-3 text-zinc-500 font-medium">
        <div className="w-5 h-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
        Redirecting to your dashboard...
      </div>
    </motion.div>
  )
}
