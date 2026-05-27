export default function AnalyticsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-24 rounded-2xl border border-white/10 bg-white/[0.04] nb-shimmer" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-32 rounded-2xl border border-white/10 bg-white/[0.04] nb-shimmer" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-80 rounded-2xl border border-white/10 bg-white/[0.04] nb-shimmer" />
        ))}
      </div>
    </div>
  )
}
