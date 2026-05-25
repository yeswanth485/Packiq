'use client'

import { useState } from 'react'
import { useOptimizationStore } from '@/lib/store/optimizationStore'
import { Badge } from '@/components/ui/Badge'
import { Search, ArrowUpDown, Box, Download, MoreHorizontal, Eye } from 'lucide-react'
import OrderDetailsModal from './OrderDetailsModal'
import { AnimatePresence } from 'framer-motion'
import Papa from 'papaparse'

interface OrdersTableProps {
  data?: any[]
}

export default function OrdersTable({ data }: OrdersTableProps = {}) {
  const store = useOptimizationStore()
  const results = data || store.results
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState('product_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  if (!results || results.length === 0) return null

  const filtered = results.filter(r =>
    r.product_name?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    const valA = (a as any)[sortKey]
    const valB = (b as any)[sortKey]
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const exportToCSV = () => {
    const csv = Papa.unparse(results)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shipzi_optimization_${new Date().getTime()}.csv`
    a.click()
  }

  const totals = {
    savings: results.reduce((acc, r) => acc + (r.savings_inr || 0), 0),
    avgUtilization: results.reduce((acc, r) => acc + (r.space_utilization_percent || 0), 0) / results.length
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-white/[0.03] border border-white/10 px-6 py-3 rounded-2xl text-zinc-300 font-bold hover:bg-white/5 transition-all"
        >
          <Download className="w-4 h-4" />
          Export All (CSV)
        </button>
      </div>

      <div className="bg-[#0D1427] border border-white/10 rounded-[32px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">#</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 cursor-pointer" onClick={() => handleSort('product_name')}>
                  Product Name <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">Original Dims</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">Optimized Box</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 cursor-pointer" onClick={() => handleSort('original_box_price_inr')}>
                  Orig. Price <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 cursor-pointer" onClick={() => handleSort('optimized_box_price_inr')}>
                  Opt. Price <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 cursor-pointer" onClick={() => handleSort('savings_inr')}>
                  Savings <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 cursor-pointer" onClick={() => handleSort('fragility_score')}>
                  Fragility <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 cursor-pointer" onClick={() => handleSort('risk_score')}>
                  Risk <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 cursor-pointer" onClick={() => handleSort('space_utilization_percent')}>
                  Space Used <ArrowUpDown className="w-3 h-3 inline ml-1" />
                </th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-zinc-500">3D View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginated.map((row: any, i) => (
                <tr key={row.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-zinc-600">{(currentPage - 1) * pageSize + i + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white font-bold">{row.product_name}</span>
                      <span className="text-[10px] text-zinc-600 font-black uppercase tracking-tighter">SKU: {row.sku || 'SZ-1024'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">{row.original_length_cm}x{row.original_width_cm}x{row.original_height_cm}</td>
                  <td className="px-6 py-4">
                     <div className="flex flex-col">
                        <span className="text-blue-400 text-sm font-bold">{row.optimized_box_name}</span>
                        <span className="text-[10px] text-blue-400/50 font-black tracking-tighter">{row.optimized_length_cm}x{row.optimized_width_cm}x{row.optimized_height_cm}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-400 text-sm font-bold">₹{row.original_box_price_inr.toFixed(2)}</td>
                  <td className="px-6 py-4 text-white text-sm font-bold">₹{row.optimized_box_price_inr.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <Badge variant="green">
                      ₹{row.savings_inr.toFixed(2)} ({Math.round(row.savings_percent)}%)
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={row.fragility_score >= 70 ? 'red' : row.fragility_score >= 40 ? 'yellow' : 'green'}>
                      {row.fragility_score}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={row.risk_score?.includes('High') ? 'red' : row.risk_score?.includes('Medium') ? 'yellow' : 'green'}>
                      {row.risk_score || (row.fragility === 'high' ? 'High Risk' : row.fragility === 'medium' ? 'Medium Risk' : 'Low Risk')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-white text-sm font-black">{Math.round(row.space_utilization_percent)}%</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedOrder(row)}
                      className="p-2 bg-white/5 hover:bg-blue-500/20 text-zinc-400 hover:text-blue-400 rounded-xl transition-all"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
               <tr className="bg-white/5 font-bold">
                  <td colSpan={6} className="px-6 py-5 text-zinc-400 uppercase tracking-widest text-[10px]">TOTALS</td>
                  <td className="px-6 py-5 text-emerald-400">₹{totals.savings.toLocaleString()}</td>
                  <td></td>
                  <td></td>
                  <td className="px-6 py-5 text-white">{Math.round(totals.avgUtilization)}% AVG</td>
                  <td></td>
               </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`w-10 h-10 rounded-xl font-bold transition-all ${
                currentPage === i + 1
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
