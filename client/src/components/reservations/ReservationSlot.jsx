export default function ReservationSlot({ timeSlot, tableLabel }) {
  return (
    <div className="inline-flex flex-col rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs">
      <span className="font-semibold text-nb-white">{timeSlot}</span>
      {tableLabel && <span className="text-nb-gray">{tableLabel}</span>}
    </div>
  )
}
