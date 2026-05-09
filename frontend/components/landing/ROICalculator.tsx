'use client'

import React, { useState, useMemo } from 'react'

export function ROICalculator() {
  const [unitsPerShift, setUnitsPerShift] = useState(10000)
  const [defectRate, setDefectRate] = useState(5)
  const [costPerDefect, setCostPerDefect] = useState(500)

  const annualSavings = useMemo(() => {
    // formula: savings = (units_per_shift × 2 shifts × 300 days × defect_rate/100 × cost_per_defect) × 0.92
    const totalUnits = unitsPerShift * 2 * 300
    const totalDefects = totalUnits * (defectRate / 100)
    const rawSavings = totalDefects * costPerDefect
    return Math.floor(rawSavings * 0.92)
  }, [unitsPerShift, defectRate, costPerDefect])

  return (
    <section className="py-24 px-6 bg-[#0A0A0F]">
      <div className="max-w-[1000px] mx-auto bg-white/[0.02] border border-white/5 rounded-[32px] p-8 md:p-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold font-syne mb-4">Calculate Your Savings</h2>
          <p className="text-gray-500">See how much you lose to manual inspection each year.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Units per shift</label>
                <span className="text-lg font-mono font-bold text-white">{unitsPerShift.toLocaleString()}</span>
              </div>
              <input 
                type="range" min="500" max="50000" step="500" value={unitsPerShift}
                onChange={(e) => setUnitsPerShift(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00FFD1]"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Current defect rate (%)</label>
                <span className="text-lg font-mono font-bold text-white">{defectRate}%</span>
              </div>
              <input 
                type="range" min="1" max="15" step="0.5" value={defectRate}
                onChange={(e) => setDefectRate(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00FFD1]"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Avg cost per defect (₹)</label>
                <span className="text-lg font-mono font-bold text-white">₹{costPerDefect.toLocaleString()}</span>
              </div>
              <input 
                type="range" min="100" max="5000" step="100" value={costPerDefect}
                onChange={(e) => setCostPerDefect(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00FFD1]"
              />
            </div>
          </div>

          <div className="bg-[#00FFD1]/5 border border-[#00FFD1]/20 rounded-3xl p-10 text-center flex flex-col justify-center">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Estimated annual savings</p>
            <div className="text-4xl md:text-5xl font-black text-[#00FFD1] font-mono mb-6">
              ₹{annualSavings.toLocaleString('en-IN')}
            </div>
            <p className="text-[10px] text-gray-600 italic">Based on 92% defect reduction factor and 300 operational days.</p>
            <button className="mt-10 bg-[#00FFD1] text-[#0A0A0F] py-4 rounded-xl font-bold hover:scale-105 transition-transform">
              Claim Your ROI Report
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
