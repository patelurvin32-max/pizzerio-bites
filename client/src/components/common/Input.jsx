import { cn } from '../../utils/helpers.js'

export default function Input({ label, className, id, error, rightAddon, ...rest }) {
  const inputId = id || rest.name
  const inputClassName = cn(
    'w-full min-h-[48px] rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-base text-nb-white outline-none transition placeholder:text-nb-gray/60 focus:border-nb-neon-orange/60 focus:ring-2 focus:ring-nb-neon-orange/25 sm:min-h-0 sm:py-2.5 sm:text-sm',
    rightAddon && 'pr-10',
    error && 'border-nb-neon-red/60',
    className
  )

  return (
    <label className="block space-y-1.5">
      {label && <span className="text-xs font-medium uppercase tracking-wide text-nb-gray">{label}</span>}
      {rightAddon ? (
        <div className="relative">
          <input id={inputId} className={inputClassName} {...rest} />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
            <div className="pointer-events-auto">{rightAddon}</div>
          </div>
        </div>
      ) : (
        <input id={inputId} className={inputClassName} {...rest} />
      )}
      {error && <span className="text-xs text-nb-neon-red">{error}</span>}
    </label>
  )
}
