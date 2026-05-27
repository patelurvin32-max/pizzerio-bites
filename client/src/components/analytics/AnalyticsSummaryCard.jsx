import { FiTrendingUp } from 'react-icons/fi'
import { cn } from '../../utils/helpers.js'

export default function AnalyticsSummaryCard({ title, value, trend, icon: Icon, tone = 'from-nb-neon-orange/30 to-nb-gold/10' }) {
  return (
    <article className="group relative min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-3 shadow-glass backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-nb-neon-orange/35 hover:bg-white/[0.07] sm:p-5">
      <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', tone)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-nb-gray sm:text-xs">{title}</p>
          <p className="mt-2 truncate font-heading text-xl font-bold text-nb-white sm:text-2xl">{value}</p>
        </div>
        <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-gradient-to-br text-nb-white shadow-neon-sm sm:h-11 sm:w-11', tone)}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
      </div>
      <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 sm:mt-4">
        <FiTrendingUp className="h-3.5 w-3.5" />
        {trend}
      </div>
    </article>
  )
}
