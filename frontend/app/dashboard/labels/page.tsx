'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tag, Plus, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'

const STANDARD_LABELS = [
  { id: 'lbl-1', name: 'Fragile - Handle With Care', price: 2.50, width_cm: 10, length_cm: 7, image_url: null, color: '#EF4444', icon: '⚠️', isStandard: true },
  { id: 'lbl-2', name: 'This Side Up', price: 1.80, width_cm: 8, length_cm: 8, image_url: null, color: '#3B82F6', icon: '⬆️', isStandard: true },
  { id: 'lbl-3', name: 'Do Not Stack', price: 2.00, width_cm: 10, length_cm: 7, image_url: null, color: '#F59E0B', icon: '🚫', isStandard: true },
  { id: 'lbl-4', name: 'Keep Dry', price: 1.50, width_cm: 8, length_cm: 6, image_url: null, color: '#06B6D4', icon: '💧', isStandard: true },
  { id: 'lbl-5', name: 'Recyclable', price: 1.20, width_cm: 6, length_cm: 6, image_url: null, color: '#10B981', icon: '♻️', isStandard: true },
  { id: 'lbl-6', name: 'Heavy Package', price: 2.80, width_cm: 12, length_cm: 8, image_url: null, color: '#8B5CF6', icon: '🏋️', isStandard: true },
  { id: 'lbl-7', name: 'Express Shipping', price: 3.50, width_cm: 15, length_cm: 5, image_url: null, color: '#EC4899', icon: '⚡', isStandard: true },
  { id: 'lbl-8', name: 'Return Label', price: 4.00, width_cm: 15, length_cm: 10, image_url: null, color: '#6366F1', icon: '↩️', isStandard: true },
  { id: 'lbl-9', name: 'Barcode / SKU', price: 0.80, width_cm: 10, length_cm: 3, image_url: null, color: '#78716C', icon: '📊', isStandard: true },
  { id: 'lbl-10', name: 'Shipped via PackIQ', price: 1.00, width_cm: 12, length_cm: 4, image_url: null, color: '#00FFD1', icon: '📦', isStandard: true },
]

export default function LabelsPage() {
  const supabase = createClient() as any
  const [labels, setLabels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLabels = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase.from('packaging_labels').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      if (error) {
        toast.error('Failed to fetch labels')
      } else {
        setLabels([...STANDARD_LABELS, ...(data || [])])
      }
    } else {
      setLabels(STANDARD_LABELS)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchLabels()
  }, [fetchLabels])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const toastId = toast.loading('Uploading label...')

    try {
      const ext = file.name.split('.').pop()
      const fileName = `labels/${user.id}_${Date.now()}.${ext}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(uploadData.path)

      const { error: dbError } = await supabase.from('packaging_labels').insert({
        user_id: user.id,
        name: file.name.replace(`.${ext}`, ''),
        image_url: publicUrl,
        price: 5.00, // Default price
        width_cm: 10,
        length_cm: 15
      })

      if (dbError) throw dbError

      toast.success('Label uploaded successfully', { id: toastId })
      fetchLabels()
    } catch (error: any) {
      toast.error(error.message, { id: toastId })
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-space-grotesk text-white">Packaging Labels</h1>
          <p className="text-zinc-500">Upload and manage labels to apply to your shipments.</p>
        </div>
        <div className="relative">
          <input type="file" id="label-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
          <button onClick={() => document.getElementById('label-upload')?.click()} className="bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-400 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <Upload className="w-5 h-5" />
            Upload Label
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-white/5 animate-pulse rounded-[32px]" />)}
        </div>
      ) : labels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-white/5 rounded-[40px] border-dashed">
          <Tag className="w-16 h-16 text-zinc-600 mb-4" />
          <h3 className="text-xl font-bold text-white">No labels found</h3>
          <p className="text-zinc-500">Upload your first label to attach it to boxes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {labels.map((label) => (
            <div key={label.id} className="bg-white/[0.03] border border-white/10 rounded-[32px] p-4 hover:border-indigo-500/30 transition-all group overflow-hidden flex flex-col">
              <div className="relative h-40 rounded-2xl mb-4 overflow-hidden flex items-center justify-center" style={{ backgroundColor: label.color ? `${label.color}15` : 'rgba(255,255,255,0.05)' }}>
                {label.image_url ? (
                  <img src={label.image_url} alt={label.name} className="max-w-full max-h-full object-contain" />
                ) : label.icon ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-5xl">{label.icon}</span>
                    {label.isStandard && <span className="px-2 py-0.5 bg-white/10 text-[9px] font-black uppercase tracking-widest rounded text-zinc-400">Standard</span>}
                  </div>
                ) : (
                  <Tag className="w-10 h-10 text-zinc-600" />
                )}
                {!label.isStandard && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/40 text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white tracking-tight truncate">{label.name}</h3>
                <p className="text-xs text-zinc-500">{label.width_cm}×{label.length_cm} cm</p>
              </div>
              <div className="mt-3 bg-white/5 p-3 rounded-2xl flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Cost</span>
                <span className="text-sm font-bold text-emerald-400">₹{label.price}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
