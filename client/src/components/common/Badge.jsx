import { cn } from '../../utils/helpers.js'

const tones = {
  default: 'border-white/10 bg-white/5 text-nb-white',
  success: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  warning: 'border-nb-gold/40 bg-nb-gold/10 text-nb-gold',
  danger: 'border-nb-neon-red/40 bg-nb-neon-red/10 text-nb-neon-red',
  info: 'border-sky-400/30 bg-sky-500/10 text-sky-200',
}

export default function Badge({ children, tone = 'default', className }) {
  return <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', tones[tone], className)}>{children}</span>
}
