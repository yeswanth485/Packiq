import { createClient } from '@/lib/supabase/server'
import StatCard from '@/components/dashboard/StatCard'
import SavingsChart from '@/components/charts/SavingsChart'
import { DollarSign, Package, Zap, Percent, UploadCloud } from 'lucide-react'
import type { Optimization } from '@/types'
import Link from 'next/link'

function buildChartData(optimizations: Optimization[]) {
  // Group by week instead of day
  const byWeek: Record<string, number> = {}
  optimizations.forEach((o) => {
    // Get week string (e.g. "2026-W18")
    const d = new Date(o.created_at)
    const year = d.getFullYear()
    const week = Math.ceil(Math.floor((d.getTime() - new Date(year, 0, 1).getTime()) / (24 * 60 * 60 * 1000)) / 7)
    const weekStr = `${year}-W${week.toString().padStart(2, '0')}`
    
    if (!byWeek[weekStr]) byWeek[weekStr] = 0
    byWeek[weekStr] += o.cost_savings_usd ?? 0
  })

  // Cumulative sum
  let cumulative = 0
  return Object.entries(byWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12) // last 12 weeks
    .map(([week, savings]) => {
      cumulative += savings
      return {
        date: week,
        savings: parseFloat(cumulative.toFixed(2)),
      }
    })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: products }, { data: optimizations }, { data: profile }] = await Promise.all([
    supabase.from('products').select('*').eq('user_id', user!.id),
    supabase.from('optimizations').select(`*, product:product_id(*)`).eq('user_id', user!.id).eq('status', 'completed').order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
  ])

  const totalSavings = ((optimizations as any) ?? []).reduce((acc: number, o: any) => acc + (o.cost_savings_usd ?? 0), 0)
  const productsCount = (products as any)?.length ?? 0
  const optimizationsCount = (optimizations as any)?.length ?? 0
  const avgEff = (optimizations as any)?.length
    ? ((optimizations as any) ?? []).reduce((acc: number, o: any) => acc + (o.efficiency_score ?? 0), 0) / (optimizations as any).length
    : 0

  const chartData = buildChartData((optimizations as any) ?? [])
  const recent = ((optimizations as any) ?? []).slice(0, 10)

  return (
    <div className="fade-in space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-medium text-gray-300">Welcome back, {(profile as any)?.full_name ?? user?.email?.split('@')[0]}</h2>
          <p className="text-gray-400 text-sm mt-1">
            <span className="text-indigo-400 capitalize">{(profile as any)?.plan} plan</span>
            {' '}·{' '}
            {(profile as any)?.optimizations_used}/{(profile as any)?.optimizations_limit === -1 ? '∞' : (profile as any)?.optimizations_limit} optimizations used
          </p>
        </div>
        <Link href="/dashboard/upload" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20">
          <UploadCloud className="w-4 h-4" />
          Quick Upload
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Savings"         value={`$${totalSavings.toFixed(2)}`}                  icon={<DollarSign className="w-5 h-5 text-green-400" />} color="green" isCurrency />
        <StatCard label="Products Processed"    value={productsCount}                                  icon={<Package className="w-5 h-5 text-indigo-400" />}  color="indigo" isNumber />
        <StatCard label="Boxes Optimized"       value={optimizationsCount}                             icon={<Zap className="w-5 h-5 text-cyan-400" />}        color="cyan"   isNumber />
        <StatCard label="Packaging Efficiency"  value={`${avgEff.toFixed(1)}%`}                        icon={<Percent className="w-5 h-5 text-amber-400" />}       color="amber"  isPercentage />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Savings Over Time (Cumulative by Week)</h2>
          <SavingsChart data={chartData} />
        </div>
      )}

      {/* Recent optimizations */}
      {recent.length > 0 && (
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-gray-300">Recent Optimizations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-widest border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-3 text-left">Product Name</th>
                  <th className="px-6 py-3 text-left">Old Box</th>
                  <th className="px-6 py-3 text-left">New Box</th>
                  <th className="px-6 py-3 text-right">Savings</th>
                  <th className="px-6 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o: any) => {
                  const product = o.product as any
                  const oldBox = product?.current_box_size || ((o.product_snapshot as any)?.current_box_size) || 'Unknown'
                  return (
                    <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3 text-gray-200 font-medium">
                        {product?.name || (o.product_snapshot as any)?.name || '—'}
                      </td>
                      <td className="px-6 py-3 text-gray-400">{oldBox}</td>
                      <td className="px-6 py-3 text-indigo-400">{o.recommended_box ?? '—'}</td>
                      <td className="px-6 py-3 text-right text-green-400 font-medium">+${(o.cost_savings_usd ?? 0).toFixed(2)}</td>
                      <td className="px-6 py-3 text-right text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {recent.length === 0 && (
        <div className="glass rounded-2xl p-12 border border-white/5 text-center">
          <Zap className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">No optimizations yet</h2>
          <p className="text-gray-400 text-sm mb-6">Add some products and run your first AI optimization.</p>
          <Link href="/dashboard/upload" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20">
            <UploadCloud className="w-4 h-4" />
            Upload Products
          </Link>
        </div>
      )}
    </div>
  )
}
