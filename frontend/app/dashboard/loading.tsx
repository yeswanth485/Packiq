import SkeletonCard from '@/components/dashboard/SkeletonCard'

export default function DashboardLoading() {
  return (
    <div className="max-w-[1400px] mx-auto space-y-8 p-4 relative w-full overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 w-48 rounded skeleton-shimmer mb-2" />
          <div className="h-4 w-72 rounded skeleton-shimmer" />
        </div>
        <div className="h-10 w-32 rounded-lg skeleton-shimmer" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 rounded-xl skeleton-shimmer border border-white/5" />
        ))}
      </div>

      <div className="h-12 w-full rounded-xl skeleton-shimmer mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
