export default function MetricSpark({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-nb-gray">{label}</p>
      <p className="font-heading text-lg font-bold text-nb-white">{value}</p>
    </div>
  )
}
