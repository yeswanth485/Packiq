export default function SkeletonRow() {
  return (
    <tr className="border-b border-white/[0.03]">
      <td className="px-4 py-4 w-12 text-center">
        <div className="w-4 h-4 rounded skeleton-shimmer" />
      </td>
      <td className="px-4"><div className="h-4 w-24 rounded skeleton-shimmer" /></td>
      <td className="px-4"><div className="h-4 w-32 rounded skeleton-shimmer" /></td>
      <td className="px-4"><div className="h-4 w-12 rounded skeleton-shimmer" /></td>
      <td className="px-4"><div className="h-4 w-20 rounded skeleton-shimmer" /></td>
      <td className="px-4"><div className="h-5 w-16 rounded-full skeleton-shimmer" /></td>
      <td className="px-4"><div className="h-4 w-24 rounded skeleton-shimmer" /></td>
      <td className="px-4"><div className="h-4 w-16 rounded skeleton-shimmer" /></td>
      <td className="px-4 text-right">
        <div className="flex justify-end gap-2">
          <div className="w-7 h-7 rounded skeleton-shimmer" />
          <div className="w-7 h-7 rounded skeleton-shimmer" />
          <div className="w-7 h-7 rounded skeleton-shimmer" />
        </div>
      </td>
    </tr>
  )
}
