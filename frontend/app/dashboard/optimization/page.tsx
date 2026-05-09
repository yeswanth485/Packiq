'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, Clock, Plus, Trash2, Box, ArrowRight, X, FileSpreadsheet, 
  UploadCloud, CheckCircle2, AlertCircle, Shield, ChevronDown, ChevronRight, Bookmark, Download, Brain, Package
} from 'lucide-react'
import { toast } from 'sonner'
import { useOptimizationStore } from '@/lib/store/optimizationStore'
import Box3DViewer from '@/components/dashboard/Box3DViewer'

export default function OptimizationPage() {
  const [activeTab, setActiveTab] = useState<'manual' | 'bulk'>('manual')
  const [isOptimizing, setIsOptimizing] = useState(false)
  const { results, addBatchResults, setRunning } = useOptimizationStore()

  const runOptimization = async () => {
    setIsOptimizing(true)
    setRunning()
    await new Promise(r => setTimeout(r, 2000))
    setIsOptimizing(false)
    toast.success('Optimization analysis complete!')
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">AI Optimization</h1>
          <p className="text-gray-500 text-sm font-medium">Configure spatial parameters for your production run.</p>
        </div>
        <button 
          onClick={runOptimization}
          disabled={isOptimizing}
          className="bg-[#00FFD1] text-[#0A0A0F] px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(0,255,209,0.2)] flex items-center gap-3 hover:scale-[1.02] transition-all"
        >
          {isOptimizing ? <span className="w-4 h-4 border-2 border-[#0A0A0F]/20 border-t-[#0A0A0F] rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
          Run Spatial Analysis
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="glass p-8 rounded-3xl">
            <div className="flex gap-4 p-1 bg-white/[0.03] border border-white/5 rounded-2xl w-fit mb-8">
              {['manual', 'bulk'].map((tab) => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-[#00FFD1] text-[#0A0A0F]' : 'text-gray-500 hover:text-white'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Active Batch</h3>
                <button className="text-[10px] font-black text-[#00FFD1] uppercase tracking-widest flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add Product
                </button>
              </div>
              
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-[#00FFD1]/30 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Product SKU</p>
                      <input type="text" placeholder="e.g. SKU-10294" className="bg-transparent border-none p-0 text-white text-sm focus:ring-0 w-full placeholder-gray-800" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Dims (cm)</p>
                      <input type="text" placeholder="10x10x10" className="bg-transparent border-none p-0 text-white text-sm font-mono focus:ring-0 w-full placeholder-gray-800" />
                    </div>
                    <div className="flex justify-end">
                      <button className="p-2 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="glass p-8 rounded-3xl h-full flex flex-col">
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#00FFD1]" /> Model Preview
            </h3>
            
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <div className="w-full h-64 mb-8 bg-black/20 rounded-3xl border border-white/5 overflow-hidden">
                <Box3DViewer l={20} w={20} h={15} />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
                The AI engine will calculate the optimal spatial orientation to minimize void fill and transit damage.
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                <span className="text-gray-600">Model Stability</span>
                <span className="text-[#00FFD1]">High (99.4%)</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '99%' }} className="h-full bg-[#00FFD1]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
