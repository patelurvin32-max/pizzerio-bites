import { formatCurrency } from '../../utils/helpers.js'

export default function OrderTotal({ value }) {
  return <span className="font-mono text-sm font-semibold text-nb-white">{formatCurrency(value)}</span>
}
