import { useEffect, useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { cn } from '../../utils/helpers.js'

export default function PasswordInput({
  label,
  className,
  id,
  error,
  hint,
  value,
  onChange,
  autoComplete = 'new-password',
  placeholder,
  required,
  minLength,
  name = 'password',
  resetKey,
}) {
  const [visible, setVisible] = useState(false)
  const inputId = id || name

  useEffect(() => {
    setVisible(false)
  }, [resetKey])

  const inputClassName = cn(
    'w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 pr-10 text-sm text-nb-white caret-nb-neon-orange outline-none transition placeholder:text-nb-gray/60 focus:border-nb-neon-orange/60 focus:ring-2 focus:ring-nb-neon-orange/25',
    error && 'border-nb-neon-red/60',
    className
  )

  return (
    <div className="block space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium uppercase tracking-wide text-nb-gray">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type={visible ? 'text' : 'password'}
          className={inputClassName}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          spellCheck={false}
          data-lpignore="true"
          data-1p-ignore
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
          <button
            type="button"
            className="pointer-events-auto rounded-lg p-1.5 text-nb-gray transition hover:bg-white/10 hover:text-nb-white focus:outline-none focus-visible:ring-2 focus-visible:ring-nb-neon-orange/40"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
          >
            {visible ? <FiEyeOff className="h-4 w-4" aria-hidden /> : <FiEye className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </div>
      {hint && <p className="text-xs text-nb-gray/90">{hint}</p>}
      {error && <span className="text-xs text-nb-neon-red">{error}</span>}
    </div>
  )
}
