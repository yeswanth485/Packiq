export default function DashboardLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">
      {/* KPI Skeletons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="glass p-5 rounded-2xl border-l-4 border-white/5 h-24" />
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        {/* Main Feed Skeleton */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass p-6 rounded-3xl h-[320px]" />
          <div className="glass p-6 rounded-3xl h-[220px]" />
          <div className="glass rounded-3xl h-[400px]" />
        </div>

        {/* Sidebar Skeleton */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-8 rounded-3xl h-[300px]" />
          <div className="glass p-8 rounded-3xl h-[400px]" />
          <div className="glass p-8 rounded-3xl h-[200px]" />
        </div>
      </div>
    </div>
  )
}
