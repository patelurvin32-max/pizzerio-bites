import { formatRupee } from '../../utils/menuPricing.js'

export default function MenuPriceTag({ value, variant }) {
  const label = variant != null ? `${formatRupee(value)} / ${formatRupee(variant)}` : formatRupee(value)
  return <span className="rounded-lg border border-nb-gold/30 bg-nb-gold/10 px-2 py-0.5 text-xs font-semibold text-nb-gold">{label}</span>
}
