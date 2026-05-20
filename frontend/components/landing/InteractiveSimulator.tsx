'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Zap, Shield, Check, Scale, Box as BoxIcon, Info } from 'lucide-react'

// Mock database box catalog for the simulator
const SIMULATOR_BOXES = [
  { name: 'Micro Cube XS', l: 10, w: 10, h: 10, cost: 0.25, mat: 'Corrugated', eco: true },
  { name: 'Mini Cube Box S', l: 15, w: 15, h: 15, cost: 0.32, mat: 'Corrugated', eco: true },
  { name: 'Courier Box S2', l: 20, w: 20, h: 15, cost: 0.44, mat: 'Corrugated', eco: true },
  { name: 'Fulfillment Box M1', l: 25, w: 20, h: 15, cost: 0.48, mat: 'Corrugated', eco: true },
  { name: 'Standard Cube M2', l: 25, w: 25, h: 25, cost: 0.58, mat: 'Corrugated', eco: true },
  { name: 'Fulfillment Box M3', l: 30, w: 25, h: 20, cost: 0.62, mat: 'Corrugated', eco: true },
  { name: 'Enterprise Box L2', l: 35, w: 30, h: 25, cost: 0.80, mat: 'Corrugated', eco: true },
  { name: 'Master Box XL1', l: 45, w: 40, h: 30, cost: 1.25, mat: 'Corrugated', eco: true },
]

export function InteractiveSimulator() {
  const [length, setLength] = useState(12)
  const [width, setWidth] = useState(10)
  const [height, setHeight] = useState(8)
  const [weight, setWeight] = useState(1.5)
  const [fragility, setFragility] = useState<'low' | 'medium' | 'high'>('low')
  const [triggerPulse, setTriggerPulse] = useState(false)

  // Trigger pulse animation when inputs change
  useEffect(() => {
    setTriggerPulse(true)
    const t = setTimeout(() => setTriggerPulse(false), 300)
    return () => clearTimeout(t)
  }, [length, width, height, weight, fragility])

  const scoringResults = useMemo(() => {
    const prodVolume = length * width * height
    
    // Find best fitting box: must fit the dimensions
    let bestBox = SIMULATOR_BOXES[SIMULATOR_BOXES.length - 1]
    let minCost = Infinity
    
    // Sort box candidates by volume/cost
    SIMULATOR_BOXES.forEach(box => {
      // Check if product fits inside (simplistic sorted fit check)
      const fits = (length <= box.l && width <= box.w && height <= box.h) ||
                   (length <= box.l && width <= box.h && height <= box.w) ||
                   (length <= box.w && width <= box.l && height <= box.h) ||
                   (length <= box.w && width <= box.h && height <= box.l) ||
                   (length <= box.h && width <= box.l && height <= box.w) ||
                   (length <= box.h && width <= box.w && height <= box.l)

      if (fits && box.cost < minCost) {
        minCost = box.cost
        bestBox = box
      }
    })

    const boxVolume = bestBox.l * bestBox.w * bestBox.h
    const volumeUtilization = Math.round((prodVolume / boxVolume) * 100)

    // XGBoost-inspired score breakdown
    // Space Score (higher utilization = higher score, but penalty if too close to 100% or fits tight)
    const spaceScore = Math.max(10, Math.min(100, Math.round(volumeUtilization * 1.1 - (volumeUtilization > 95 ? (volumeUtilization - 95) * 5 : 0))))
    
    // Cost Score (cheaper box = higher score)
    const costScore = Math.max(10, Math.round(100 - (bestBox.cost * 65)))

    // Fragility Protection Score
    // High fragility requires thicker box or cushion, if it fits nicely it gets high score
    let fragilityScore = 95
    if (fragility === 'high') {
      fragilityScore = volumeUtilization < 75 ? 90 : 50 // Too tight = high damage risk
    } else if (fragility === 'medium') {
      fragilityScore = volumeUtilization < 85 ? 95 : 70
    }

    // Sustainability Score: Eco certified and minimized void space
    const sustainabilityScore = Math.round((bestBox.eco ? 95 : 60) * 0.7 + (100 - volumeUtilization) * 0.3)

    // Final Weighted XGBoost Score
    const finalScore = Math.round(
      spaceScore * 0.35 +
      costScore * 0.25 +
      fragilityScore * 0.20 +
      sustainabilityScore * 0.20
    )

    // Baseline calculation (if they used standard over-sized box)
    const baselineBox = SIMULATOR_BOXES[5] // standard M3 box as baseline
    const baselineCost = baselineBox.cost + (weight * 0.65)
    const optimizedCost = bestBox.cost + (weight * 0.54) // reduced shipping rate due to size reduction
    const savings = Math.max(0.1, baselineCost - optimizedCost)

    return {
      bestBox,
      volumeUtilization,
      spaceScore,
      costScore,
      fragilityScore,
      sustainabilityScore,
      finalScore,
      savings,
      boxVolume,
      prodVolume
    }
  }, [length, width, height, weight, fragility])

  return (
    <section id="ai-simulator" className="py-32 px-6 bg-[#0B0B10] border-y border-white/[0.04] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00FFD1]/5 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#4361EE]/5 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-[1200px] mx-auto relative z-10">
        
        {/* Title Block */}
        <div className="text-center mb-20">
          <span className="text-[10px] font-black text-[#00FFD1] uppercase tracking-[0.5em] bg-[#00FFD1]/10 px-4 py-1.5 rounded-full border border-[#00FFD1]/20">
            Interactive ML Demo
          </span>
          <h2 className="text-4xl md:text-7xl font-bold font-syne mt-6 mb-8 tracking-tighter leading-[0.9]">
            AI Box Recommender<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
              Live Simulator
            </span>
          </h2>
          <p className="text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
            Adjust the sliders below to see our XGBoost ML scoring engine evaluate void space, carrier pricing rates, fragility risk, and choose the optimal package.
          </p>
        </div>

        {/* Dashboard Frame */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Inputs Panel */}
          <div className="lg:col-span-5 bg-[#0f0f1a] border border-white/[0.06] rounded-[40px] p-8 space-y-8 shadow-2xl relative overflow-hidden">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BoxIcon className="w-5 h-5 text-[#00FFD1]" /> Product Dimensions
            </h3>
            
            <div className="space-y-6">
              {/* Length Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-400">
                  <span>LENGTH (cm)</span>
                  <span className="text-white font-mono">{length} cm</span>
                </div>
                <input 
                  type="range" min="5" max="40" step="1" 
                  value={length} 
                  onChange={(e) => setLength(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00FFD1]"
                />
              </div>

              {/* Width Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-400">
                  <span>WIDTH (cm)</span>
                  <span className="text-white font-mono">{width} cm</span>
                </div>
                <input 
                  type="range" min="5" max="40" step="1" 
                  value={width} 
                  onChange={(e) => setWidth(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00FFD1]"
                />
              </div>

              {/* Height Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-400">
                  <span>HEIGHT (cm)</span>
                  <span className="text-white font-mono">{height} cm</span>
                </div>
                <input 
                  type="range" min="3" max="30" step="1" 
                  value={height} 
                  onChange={(e) => setHeight(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00FFD1]"
                />
              </div>

              {/* Weight Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-400">
                  <span>WEIGHT (kg)</span>
                  <span className="text-white font-mono">{weight} kg</span>
                </div>
                <input 
                  type="range" min="0.1" max="15" step="0.1" 
                  value={weight} 
                  onChange={(e) => setWeight(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00FFD1]"
                />
              </div>

              {/* Fragility Selection */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-400 block uppercase">Fragility Level</span>
                <div className="grid grid-cols-3 gap-3">
                  {['low', 'medium', 'high'].map((level) => (
                    <button
                      key={level}
                      onClick={() => setFragility(level as any)}
                      className={`py-3 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all ${
                        fragility === level 
                          ? 'bg-[#00FFD1]/10 border-[#00FFD1] text-[#00FFD1] shadow-[0_0_15px_rgba(0,255,209,0.15)]'
                          : 'bg-white/[0.02] border-white/5 text-gray-500 hover:text-white hover:bg-white/[0.05]'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE: 3D Visualization */}
          <div className="lg:col-span-3 h-[420px] bg-[#0A0A0F] border border-white/[0.04] rounded-[40px] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest absolute top-6 left-6">
              AI 3D Fit Model Projection
            </span>
            
            {/* Box Rendering representation */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Outer Box */}
              <motion.div 
                animate={{ 
                  scale: 0.8 + (scoringResults.bestBox.l / 50) * 0.2,
                  rotateX: 60,
                  rotateZ: 45
                }}
                transition={{ type: 'spring', damping: 20 }}
                className="w-36 h-36 border-2 border-[#00FFD1]/40 bg-[#00FFD1]/5 rounded-xl absolute transform flex items-center justify-center shadow-2xl"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Inner Product representation */}
                <motion.div 
                  animate={{
                    width: `${(length / scoringResults.bestBox.l) * 90}%`,
                    height: `${(width / scoringResults.bestBox.w) * 90}%`,
                  }}
                  className="bg-[#4361EE] opacity-60 rounded-md shadow-inner border border-white/20"
                  style={{ height: '70%', width: '70%' }}
                />
              </motion.div>
            </div>

            {/* Box Labels */}
            <div className="w-full text-center mt-6 z-10">
              <p className="text-xs text-gray-500 font-bold mb-1">RECOMMENDED BOX</p>
              <h4 className="text-base font-black text-white">{scoringResults.bestBox.name}</h4>
              <p className="text-[10px] font-mono text-[#00FFD1] mt-1">
                {scoringResults.bestBox.l} x {scoringResults.bestBox.w} x {scoringResults.bestBox.h} cm
              </p>
            </div>
          </div>

          {/* RIGHT: Scoring Breakdown */}
          <div className="lg:col-span-4 bg-[#0f0f1a] border border-white/[0.06] rounded-[40px] p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest">XGBoost Scoring Engine</span>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            </div>

            {/* Score Big Display */}
            <div className="text-center py-4 relative">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">MATCH FITNESS SCORE</p>
              <motion.div 
                animate={{ scale: triggerPulse ? 1.1 : 1 }}
                className="text-6xl font-black text-[#00FFD1] font-syne tracking-tighter"
              >
                {scoringResults.finalScore}<span className="text-lg text-gray-600 font-bold">/100</span>
              </motion.div>
            </div>

            {/* Progress Bar Factors */}
            <div className="space-y-4">
              
              {/* Space utilization score */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-400">Space Utilization</span>
                  <span className="text-white">{scoringResults.spaceScore}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: `${scoringResults.spaceScore}%` }}
                    className="h-full bg-[#00FFD1]"
                  />
                </div>
              </div>

              {/* Cost Minimization score */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-400">Cost Optimization</span>
                  <span className="text-white">{scoringResults.costScore}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: `${scoringResults.costScore}%` }}
                    className="h-full bg-indigo-500"
                  />
                </div>
              </div>

              {/* Fragility Safety score */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-400">Damage Protection</span>
                  <span className="text-white">{scoringResults.fragilityScore}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: `${scoringResults.fragilityScore}%` }}
                    className="h-full bg-yellow-500"
                  />
                </div>
              </div>

              {/* Sustainability eco score */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gray-400">Eco Sustainability</span>
                  <span className="text-white">{scoringResults.sustainabilityScore}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: `${scoringResults.sustainabilityScore}%` }}
                    className="h-full bg-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Savings projection */}
            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">SAVINGS PER SHIFT</p>
                <p className="text-xl font-black text-[#00FFD1] font-mono mt-0.5">
                  +${scoringResults.savings.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">VOID SPACE</p>
                <p className="text-base font-bold text-red-400 font-mono mt-0.5">
                  {100 - scoringResults.volumeUtilization}%
                </p>
              </div>
            </div>

          </div>
          
        </div>
      </div>
    </section>
  )
}
