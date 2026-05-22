'use client'

import { useState } from 'react'
import { Search, Filter, Plus, Package, Ruler, Tag, Zap, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function ProductsClient({ initialProducts }: { initialProducts: any[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'general',
    length_cm: '',
    width_cm: '',
    height_cm: '',
    weight_kg: '',
    fragility_level: 'low'
  })

  // Extract unique categories for filter
  const categories = ['all', 'general', 'electronics', 'clothing', 'books', 'cosmetics', 'food', 'toys', 'fragile', 'medical', 'automotive']

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          sku: formData.sku,
          category: formData.category,
          length_cm: parseFloat(formData.length_cm),
          width_cm: parseFloat(formData.width_cm),
          height_cm: parseFloat(formData.height_cm),
          weight_kg: parseFloat(formData.weight_kg),
          fragility_level: formData.fragility_level,
          fragile: formData.fragility_level !== 'low'
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add product')

      setProducts([data.product, ...products])
      setIsModalOpen(false)
      toast.success('Product saved to catalog')
      
      // Reset form
      setFormData({
        name: '', sku: '', category: 'general',
        length_cm: '', width_cm: '', height_cm: '', weight_kg: '', fragility_level: 'low'
      })
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const navigateToOptimize = (p: any) => {
    const params = new URLSearchParams()
    if (p.name) params.set('name', p.name)
    if (p.sku) params.set('sku', p.sku)
    if (p.category) params.set('category', p.category)
    if (p.length_cm) params.set('l', p.length_cm.toString())
    if (p.width_cm) params.set('w', p.width_cm.toString())
    if (p.height_cm) params.set('h', p.height_cm.toString())
    if (p.weight_kg) params.set('weight', p.weight_kg.toString())
    if (p.fragility) params.set('fragility', p.fragility)
    
    router.push(`/dashboard/optimization?${params.toString()}`)
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-wrap gap-4 items-center justify-between glass p-4 rounded-2xl border border-white/5">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search by name or SKU..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#00FFD1] transition-colors"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select 
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="appearance-none bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-8 py-2 text-sm text-white focus:outline-none focus:border-[#00FFD1] transition-colors cursor-pointer capitalize [&>option]:bg-[#0A0A0F]"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>
              ))}
            </select>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#00FFD1] hover:scale-[1.02] text-[#0A0A0F] px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,255,209,0.2)]"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((p) => (
          <div key={p.id} className="glass rounded-3xl border border-white/5 overflow-hidden card-hover flex flex-col group">
            <div className="p-6 border-b border-white/5 bg-gradient-to-br from-[#185FA5]/10 to-transparent relative">
              <div className="absolute top-4 right-4">
                <span className={`flex items-center gap-1 text-[8px] font-black tracking-widest uppercase px-2 py-1 rounded-md border ${
                  p.fragility === 'extreme' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                  p.fragility === 'high' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' :
                  p.fragility === 'medium' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
                  'text-green-400 bg-green-500/10 border-green-500/20'
                }`}>
                  {p.fragility} Risk
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#185FA5]/20 flex items-center justify-center mb-4 text-[#00FFD1]">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#00FFD1] transition-colors">{p.name}</h3>
              <p className="text-[10px] text-gray-500 font-mono tracking-tighter uppercase">{p.sku || 'N/A'}</p>
            </div>
            
            <div className="p-6 flex-1 flex flex-col gap-4">
              <div className="flex items-center gap-3 text-xs text-gray-300">
                <Ruler className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="font-mono">{p.length_cm} × {p.width_cm} × {p.height_cm} cm</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-300">
                <Zap className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="font-mono">{p.weight_kg} kg</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-300">
                <Tag className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="capitalize">{p.category}</span>
              </div>
              
              <div className="mt-auto pt-4 border-t border-white/5">
                <button
                  onClick={() => navigateToOptimize(p)}
                  className="w-full py-2.5 bg-white/[0.03] hover:bg-[#00FFD1]/10 text-white hover:text-[#00FFD1] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/5 hover:border-[#00FFD1]/30 group/btn"
                >
                  Optimize Now <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="glass p-12 rounded-2xl border border-white/5 text-center">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">No products found</h3>
          <p className="text-sm text-gray-400">Save products to optimize them instantly.</p>
        </div>
      )}

      {/* Add Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-2xl border border-white/10 shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-6">Add Product to Catalog</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Product Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFD1]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">SKU</label>
                  <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFD1]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFD1] [&>option]:bg-[#0A0A0F]">
                    {categories.filter(c => c !== 'all').map(c => (
                      <option key={c} value={c} className="capitalize">{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">L (cm)</label>
                  <input required type="number" step="0.1" value={formData.length_cm} onChange={e => setFormData({...formData, length_cm: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFD1]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">W (cm)</label>
                  <input required type="number" step="0.1" value={formData.width_cm} onChange={e => setFormData({...formData, width_cm: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFD1]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">H (cm)</label>
                  <input required type="number" step="0.1" value={formData.height_cm} onChange={e => setFormData({...formData, height_cm: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFD1]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Weight (kg)</label>
                  <input required type="number" step="0.01" value={formData.weight_kg} onChange={e => setFormData({...formData, weight_kg: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFD1]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Fragility</label>
                  <select required value={formData.fragility_level} onChange={e => setFormData({...formData, fragility_level: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00FFD1] [&>option]:bg-[#0A0A0F]">
                    <option value="low">Low Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="high">High Risk</option>
                    <option value="extreme">Extreme Risk</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 mt-4 border-t border-white/5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white/5 hover:bg-white/10 transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#0A0A0F] bg-[#00FFD1] hover:scale-[1.02] disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(0,255,209,0.2)]">
                  {isSubmitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
