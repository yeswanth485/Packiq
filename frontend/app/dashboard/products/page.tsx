'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, Package, RefreshCw } from 'lucide-react'
import UploadZone from '@/components/dashboard/UploadZone'
import type { Product } from '@/types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '', sku: '', weight_kg: '', length_cm: '', width_cm: '', height_cm: '', fragile: false, category: '', notes: '',
  })

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/products')
    const data = await res.json()
    setProducts(data.products ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : undefined,
        length_cm: form.length_cm ? parseFloat(form.length_cm) : undefined,
        width_cm: form.width_cm ? parseFloat(form.width_cm) : undefined,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : undefined,
      }),
    })
    setShowForm(false)
    setForm({ name: '', sku: '', weight_kg: '', length_cm: '', width_cm: '', height_cm: '', fragile: false, category: '', notes: '' })
    fetchProducts()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
    setProducts((p) => p.filter((x) => x.id !== id))
  }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors'

  return (
    <div className="fade-in space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-gray-400 text-sm mt-1">{products.length} product{products.length !== 1 ? 's' : ''} in your catalog</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchProducts} className="glass border border-white/10 p-2.5 rounded-xl hover:bg-white/5 transition-colors">
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" />
            Add product
          </button>
        </div>
      </div>

      {/* Upload zone */}
      <UploadZone onSuccess={() => fetchProducts()} />

      {/* Add form */}
      {showForm && (
        <div className="glass rounded-2xl p-6 border border-indigo-500/20">
          <h2 className="text-base font-semibold text-white mb-4">New Product</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Name *</label>
              <input required className={inputCls} placeholder="e.g. Widget Pro 3000" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">SKU</label>
              <input className={inputCls} placeholder="WP-3000" value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Category</label>
              <input className={inputCls} placeholder="Electronics" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Weight (kg)</label>
              <input type="number" step="0.001" className={inputCls} placeholder="0.500" value={form.weight_kg} onChange={(e) => setForm({...form, weight_kg: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Length (cm)</label>
              <input type="number" step="0.01" className={inputCls} placeholder="20.00" value={form.length_cm} onChange={(e) => setForm({...form, length_cm: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Width (cm)</label>
              <input type="number" step="0.01" className={inputCls} placeholder="15.00" value={form.width_cm} onChange={(e) => setForm({...form, width_cm: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Height (cm)</label>
              <input type="number" step="0.01" className={inputCls} placeholder="10.00" value={form.height_cm} onChange={(e) => setForm({...form, height_cm: e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Notes</label>
              <input className={inputCls} placeholder="Fragile glass components…" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="fragile" className="accent-indigo-500" checked={form.fragile} onChange={(e) => setForm({...form, fragile: e.target.checked})} />
              <label htmlFor="fragile" className="text-sm text-gray-300">Fragile item</label>
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors">Save product</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="glass rounded-2xl p-12 border border-white/5 text-center">
          <RefreshCw className="w-8 h-8 text-indigo-400 mx-auto animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <div className="glass rounded-2xl p-12 border border-white/5 text-center">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No products yet. Add one above or import a CSV.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5">
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">SKU</th>
                <th className="px-6 py-3 text-left">Dimensions (L×W×H cm)</th>
                <th className="px-6 py-3 text-left">Weight</th>
                <th className="px-6 py-3 text-left">Category</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3 text-gray-200 font-medium">{p.name}</td>
                  <td className="px-6 py-3 text-gray-500">{p.sku ?? '—'}</td>
                  <td className="px-6 py-3 text-gray-400">
                    {p.length_cm ?? '?'} × {p.width_cm ?? '?'} × {p.height_cm ?? '?'}
                    {p.fragile && <span className="ml-2 text-xs badge-yellow px-1.5 py-0.5 rounded-full">Fragile</span>}
                  </td>
                  <td className="px-6 py-3 text-gray-400">{p.weight_kg ? `${p.weight_kg} kg` : '—'}</td>
                  <td className="px-6 py-3 text-gray-500">{p.category ?? '—'}</td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
