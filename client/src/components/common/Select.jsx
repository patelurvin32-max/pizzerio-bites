import { cn } from '../../utils/helpers.js'

export default function Select({ label, className, children, error, id, ...rest }) {
  const sid = id || rest.name
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-xs font-medium uppercase tracking-wide text-nb-gray">{label}</span>}
      <select
        id={sid}
        className={cn(
          'w-full min-h-[48px] appearance-none rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-base text-nb-white outline-none transition focus:border-nb-neon-orange/60 focus:ring-2 focus:ring-nb-neon-orange/25 sm:min-h-0 sm:py-2.5 sm:text-sm',
          error && 'border-nb-neon-red/60',
          className
        )}
        {...rest}
      >
        {children}
      </select>
      {error && <span className="text-xs text-nb-neon-red">{error}</span>}
    </label>
  )
}
