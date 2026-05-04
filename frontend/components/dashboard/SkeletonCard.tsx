export default function SkeletonCard() {
  return (
    <div className="bg-[#0f0f1a] border border-white/[0.06] rounded-[28px] p-6 shadow-xl overflow-hidden relative">
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 rounded-2xl skeleton-shimmer" />
        <div className="w-16 h-4 rounded-full skeleton-shimmer" />
      </div>
      
      <div className="h-5 w-3/4 rounded skeleton-shimmer mb-2" />
      <div className="h-4 w-1/2 rounded skeleton-shimmer mb-6" />
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="h-3 w-16 rounded skeleton-shimmer" />
          <div className="h-3 w-20 rounded skeleton-shimmer" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-12 rounded skeleton-shimmer" />
          <div className="h-3 w-24 rounded skeleton-shimmer" />
        </div>
      </div>
      
      <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
        <div className="flex gap-2">
          <div className="w-8 h-8 rounded-lg skeleton-shimmer" />
          <div className="w-8 h-8 rounded-lg skeleton-shimmer" />
        </div>
        <div className="h-8 w-24 rounded-lg skeleton-shimmer" />
      </div>
    </div>
  )
}
