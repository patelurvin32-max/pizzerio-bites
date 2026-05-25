export default function CmsKeyRow({ row, onEdit }) {
  return (
    <button type="button" onClick={() => onEdit(row)} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-left text-sm transition hover:border-nb-neon-orange/40">
      <span className="font-mono text-xs text-nb-gold">{row.key}</span>
      <span className="text-xs text-nb-gray">{row.section}</span>
    </button>
  )
}
