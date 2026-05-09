'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, TrendingDown, ShieldAlert } from 'lucide-react'
import { StaggerContainer, StaggerItem } from '@/components/animations'

const PAIN_POINTS = [
  {
    icon: AlertTriangle,
    title: "Manual Inaccuracy",
    desc: "Manual inspection catches only 60–65% of defects, leading to massive downstream failures.",
    stat: "60-65%"
  },
  {
    icon: ShieldAlert,
    title: "Compliance Risk",
    desc: "BIS raids and standard violations can lead to seizure of thousands of items in a single sweep.",
    stat: "3,376+"
  },
  {
    icon: TrendingDown,
    title: "Financial Loss",
    desc: "Defective packaging costs India ₹890Cr+ annually in returns, recalls, and brand damage.",
    stat: "₹890Cr+"
  }
]

export function ProblemSection() {
  return (
    <section className="py-24 px-6 bg-[#0A0A0F]">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-syne mb-6">
            BIS Raids. Customer Returns. Recalls. <br />
            <span className="text-red-500">The Cost of Manual QA.</span>
          </h2>
        </div>

        <StaggerContainer className="grid md:grid-cols-3 gap-8">
          {PAIN_POINTS.map((point, i) => (
            <StaggerItem key={i}>
              <div className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-red-500/30 transition-all">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                  <point.icon className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-2xl font-bold font-mono text-red-500 mb-4">{point.stat}</div>
                <h3 className="text-lg font-bold text-white mb-2">{point.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{point.desc}</p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
