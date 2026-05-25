export default function StaffStatusDot({ status }) {
  const color = status === 'active' ? 'bg-emerald-400' : 'bg-nb-gray'
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color} shadow-[0_0_12px_rgba(16,185,129,0.45)]`} title={status} />
}
