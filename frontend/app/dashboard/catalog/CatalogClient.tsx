'use client'

import { useState } from 'react'
import { Search, Filter, Plus, Box as BoxIcon, DollarSign, Ruler, Tag, Factory, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function CatalogClient({ initialBoxes }: { initialBoxes: any[] }) {
  const [boxes, setBoxes] = useState(initialBoxes)
  const [searchTerm, setSearchTerm] = useState('')
  const [materialFilter, setMaterialFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '',
    supplier: '',
    sku: '',
    length_cm: '',
    width_cm: '',
    height_cm: '',
    max_weight_kg: '',
    cost_usd: '',
    material: '',
    eco_certified: false,
    in_stock: true
  })

  // Extract unique materials for filter
  const materials = ['all', ...Array.from(new Set(boxes.map(b => b.material).filter(Boolean)))]

  const filteredBoxes = boxes.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (b.sku && b.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesMaterial = materialFilter === 'all' || b.material === materialFilter
    return matchesSearch && matchesMaterial
  })

  const handleAddBox = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const { data, error } = await (supabase as any)
        .from('box_catalog')
        .insert({
          name: formData.name,
          supplier: formData.supplier,
          sku: formData.sku || undefined,
          length_cm: parseFloat(formData.length_cm),
          width_cm: parseFloat(formData.width_cm),
          height_cm: parseFloat(formData.height_cm),
          max_weight_kg: formData.max_weight_kg ? parseFloat(formData.max_weight_kg) : null,
          cost_usd: formData.cost_usd ? parseFloat(formData.cost_usd) : null,
          material: formData.material,
          eco_certified: formData.eco_certified,
          in_stock: formData.in_stock
        })
        .select()
        .single()

      if (error) throw error

      setBoxes([data, ...boxes])
      setIsModalOpen(false)
      toast.success('Box added to catalog')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to add box')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search by name or SKU..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select 
              value={materialFilter}
              onChange={e => setMaterialFilter(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-xl pl-10 pr-8 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer capitalize"
            >
              {materials.map(m => (
                <option key={m} value={m}>{m === 'all' ? 'All Materials' : m}</option>
              ))}
            </select>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Add Box
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredBoxes.map((box) => (
          <div key={box.id} className="glass rounded-2xl border border-white/5 overflow-hidden card-hover flex flex-col group">
            <div className="p-5 border-b border-white/5 bg-gradient-to-br from-indigo-500/10 to-transparent relative">
              <div className="absolute top-4 right-4">
                {box.in_stock ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-green-400 bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">
                    <CheckCircle2 className="w-3 h-3" /> In Stock
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-red-400 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
                    <XCircle className="w-3 h-3" /> Out of Stock
                  </span>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
                <BoxIcon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">{box.name}</h3>
              <p className="text-xs text-gray-500 font-mono">SKU: {box.sku || 'N/A'}</p>
            </div>
            
            <div className="p-5 flex-1 flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <Ruler className="w-4 h-4 text-gray-500 shrink-0" />
                <span>{box.length_cm} × {box.width_cm} × {box.height_cm} cm</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <Tag className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="capitalize">{box.material || 'Standard'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <Factory className="w-4 h-4 text-gray-500 shrink-0" />
                <span>{box.supplier || 'Generic'}</span>
              </div>
              
              <div className="mt-auto pt-4 flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Unit Cost</p>
                  <div className="flex items-center gap-1 text-green-400 font-bold text-lg">
                    ${Number(box.cost_usd || 0).toFixed(2)}
                  </div>
                </div>
                {box.eco_certified && (
                  <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                    Eco Certified
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredBoxes.length === 0 && (
        <div className="glass p-12 rounded-2xl border border-white/5 text-center">
          <BoxIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">No boxes found</h3>
          <p className="text-sm text-gray-400">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Add Box Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-6">Add New Box</h2>
            <form onSubmit={handleAddBox} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Supplier</label>
                  <input type="text" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">SKU</label>
                  <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">L (cm)</label>
                  <input required type="number" step="0.1" value={formData.length_cm} onChange={e => setFormData({...formData, length_cm: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">W (cm)</label>
                  <input required type="number" step="0.1" value={formData.width_cm} onChange={e => setFormData({...formData, width_cm: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">H (cm)</label>
                  <input required type="number" step="0.1" value={formData.height_cm} onChange={e => setFormData({...formData, height_cm: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Cost (USD)</label>
                  <input required type="number" step="0.01" value={formData.cost_usd} onChange={e => setFormData({...formData, cost_usd: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Max Weight (kg)</label>
                  <input type="number" step="0.1" value={formData.max_weight_kg} onChange={e => setFormData({...formData, max_weight_kg: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Material</label>
                <input type="text" placeholder="e.g. corrugated" value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={formData.eco_certified} onChange={e => setFormData({...formData, eco_certified: e.target.checked})} className="rounded bg-white/5 border-white/10 text-indigo-500 focus:ring-indigo-500" />
                  Eco Certified
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={formData.in_stock} onChange={e => setFormData({...formData, in_stock: e.target.checked})} className="rounded bg-white/5 border-white/10 text-indigo-500 focus:ring-indigo-500" />
                  In Stock
                </label>
              </div>
              
              <div className="flex gap-3 pt-4 mt-4 border-t border-white/5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors">
                  {isSubmitting ? 'Saving...' : 'Save Box'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
