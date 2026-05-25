'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Box, Plus, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'

const STANDARD_BOXES = [
  { id: 'std-1', name: 'Micro Box', length_cm: 10, width_cm: 10, height_cm: 10, cost: 8, weight_limit_kg: 2, material: 'Corrugated', isStandard: true },
  { id: 'std-2', name: 'Mini Box S', length_cm: 15, width_cm: 15, height_cm: 15, cost: 12, weight_limit_kg: 5, material: 'Corrugated', isStandard: true },
  { id: 'std-3', name: 'Small Box', length_cm: 25, width_cm: 20, height_cm: 15, cost: 18, weight_limit_kg: 10, material: 'Corrugated', isStandard: true },
  { id: 'std-4', name: 'Medium Box', length_cm: 35, width_cm: 30, height_cm: 25, cost: 35, weight_limit_kg: 15, material: 'Double Wall', isStandard: true },
  { id: 'std-5', name: 'Large Box', length_cm: 50, width_cm: 40, height_cm: 35, cost: 65, weight_limit_kg: 25, material: 'Double Wall', isStandard: true },
  { id: 'std-6', name: 'Jumbo Box XL', length_cm: 80, width_cm: 60, height_cm: 60, cost: 145, weight_limit_kg: 40, material: 'Heavy Duty', isStandard: true }
]

export default function BoxCatalogPage() {
  const supabase = createClient() as any
  const [boxes, setBoxes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBoxes = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase.from('box_catalog').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      if (error) {
        toast.error('Failed to fetch boxes')
      } else {
        setBoxes([...STANDARD_BOXES, ...(data || [])])
      }
    } else {
      setBoxes(STANDARD_BOXES)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchBoxes()
  }, [fetchBoxes])

  // Very simplified 3D box renderer using CSS transforms
  const render3DBox = (box: any) => {
    const l = Math.min(box.length_cm, 50)
    const w = Math.min(box.width_cm, 50)
    const h = Math.min(box.height_cm, 50)
    
    // Scale factor to make it fit
    const maxDim = Math.max(l, w, h)
    const scale = 100 / maxDim

    return (
      <div className="relative w-32 h-32 flex items-center justify-center perspective-[800px]">
        <motion.div 
          className="relative preserve-3d"
          animate={{ rotateY: [0, 360] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          style={{ width: w * scale, height: h * scale }}
        >
          <div className="absolute inset-0 bg-[#cd853f]/80 border border-[#8b4513] shadow-inner" style={{ transform: `translateZ(${l * scale / 2}px)` }} />
          <div className="absolute inset-0 bg-[#cd853f]/90 border border-[#8b4513] shadow-inner" style={{ transform: `rotateY(180deg) translateZ(${l * scale / 2}px)` }} />
          <div className="absolute inset-0 bg-[#cd853f]/70 border border-[#8b4513] shadow-inner" style={{ transform: `rotateY(90deg) translateZ(${w * scale / 2}px)`, width: l * scale }} />
          <div className="absolute inset-0 bg-[#cd853f]/70 border border-[#8b4513] shadow-inner" style={{ transform: `rotateY(-90deg) translateZ(${w * scale / 2}px)`, width: l * scale }} />
          <div className="absolute inset-0 bg-[#cd853f] border border-[#8b4513] shadow-inner" style={{ transform: `rotateX(90deg) translateZ(${h * scale / 2}px)`, height: l * scale }} />
          <div className="absolute inset-0 bg-[#cd853f]/60 border border-[#8b4513] shadow-inner" style={{ transform: `rotateX(-90deg) translateZ(${h * scale / 2}px)`, height: l * scale }} />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk text-white">Box Catalog</h1>
          <p className="text-zinc-500">Manage your custom box sizes and dimensions.</p>
        </div>
        <button className="bg-[#00FFD1] text-[#0A0A0F] px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,255,209,0.3)]">
          <Plus className="w-5 h-5" />
          Add Box
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-white/5 animate-pulse rounded-[32px]" />)}
        </div>
      ) : boxes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-white/5 rounded-[40px] border-dashed">
          <Box className="w-16 h-16 text-zinc-600 mb-4" />
          <h3 className="text-xl font-bold text-white">No boxes found</h3>
          <p className="text-zinc-500">Add your custom box sizes to use them in optimizations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boxes.map((box) => (
            <div key={box.id} className="bg-white/[0.03] border border-white/10 rounded-[32px] p-6 hover:border-[#00FFD1]/30 transition-all group overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {box.name}
                    {box.isStandard && <span className="ml-2 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-bold uppercase">Standard</span>}
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{box.material || 'Corrugated'}</p>
                </div>
                {!box.isStandard && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 bg-white/5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-white/5 rounded-xl hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-center mb-6 h-40">
                {render3DBox(box)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-3 rounded-2xl">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Dimensions</span>
                  <p className="text-sm font-bold text-white">{box.length_cm} × {box.width_cm} × {box.height_cm} cm</p>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Cost</span>
                  <p className="text-sm font-bold text-white">₹{box.cost}</p>
                </div>
                <div className="col-span-2 bg-white/5 p-3 rounded-2xl">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Weight Limit</span>
                  <p className="text-sm font-bold text-white">{box.weight_limit_kg} kg</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
