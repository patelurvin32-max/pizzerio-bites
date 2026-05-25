import { cn } from '../../utils/helpers.js'

export default function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled,
  fullWidth = false,
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nb-neon-orange disabled:opacity-50 disabled:pointer-events-none'
  const sizes = {
    sm: 'min-h-[40px] px-3 py-1.5 text-sm sm:min-h-0',
    md: 'min-h-[48px] px-4 py-2.5 text-sm sm:min-h-[44px]',
    lg: 'min-h-[48px] px-5 py-3 text-base sm:min-h-[46px]',
  }
  const widthClass = fullWidth ? 'w-full' : ''
  const variants = {
    primary: 'bg-gradient-to-r from-nb-neon-orange to-nb-neon-red text-nb-bg shadow-neon-sm hover:shadow-neon-md',
    ghost: 'border border-white/10 bg-white/5 text-nb-white hover:bg-white/10',
    danger: 'border border-nb-neon-red/50 bg-nb-neon-red/15 text-nb-neon-red hover:bg-nb-neon-red/25',
  }
  return (
    <button type={type} disabled={disabled} className={cn(base, sizes[size], variants[variant], widthClass, className)} {...rest}>
      {children}
    </button>
  )
}
