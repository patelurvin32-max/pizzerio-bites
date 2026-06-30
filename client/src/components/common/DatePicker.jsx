import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HiOutlineCalendar, HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi'
import { WEEKDAYS, buildMonthGrid, isSameDay, monthStart } from '../../utils/calendarUtils.js'
import { cn } from '../../utils/helpers.js'

function parseDateValue(value) {
  if (!value) return new Date()
  const [year, month, day] = String(value).split('-').map(Number)
  if (!year || !month || !day) return new Date()
  return new Date(year, month - 1, day)
}

function toDateValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDisplayDate(value) {
  if (!value) return 'dd/mm/yyyy'
  const [year, month, day] = String(value).split('-')
  return `${day}/${month}/${year}`
}

function triggerClass() {
  return [
    'm-0 w-full min-h-[48px] box-border rounded-xl border bg-black/30 px-3 py-3 text-base text-left text-nb-white font-inherit leading-normal appearance-none outline-none transition',
    'focus:border-nb-neon-orange/60 focus:ring-2 focus:ring-nb-neon-orange/25 sm:min-h-0 sm:py-2.5 sm:text-sm',
    'border-white/10 pr-10 cursor-pointer',
  ].join(' ')
}

export default function DatePicker({ label = 'Date', value, onChange, className, placeholder = 'dd/mm/yyyy' }) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => {
    const base = value ? parseDateValue(value) : new Date()
    return { year: base.getFullYear(), month: base.getMonth() }
  })
  const [popoverRect, setPopoverRect] = useState(null)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)

  const selectedDate = value ? parseDateValue(value) : null

  const updatePopoverPosition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const width = Math.min(320, Math.max(r.width, 280))
    let top = r.bottom + 8
    const estimatedHeight = 340
    if (top + estimatedHeight > window.innerHeight - 12) {
      top = Math.max(12, r.top - estimatedHeight - 8)
    }
    let left = r.left
    if (left + width > window.innerWidth - 12) {
      left = window.innerWidth - width - 12
    }
    setPopoverRect({ top, left, width })
  }, [])

  useEffect(() => {
    if (value) {
      const d = parseDateValue(value)
      setView({ year: d.getFullYear(), month: d.getMonth() })
    }
  }, [value])

  useEffect(() => {
    if (!open) return undefined

    updatePopoverPosition()
    const onScrollOrResize = () => updatePopoverPosition()
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target) && !e.target.closest('[data-date-popover]')) {
        setOpen(false)
      }
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }

    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, true)
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, true)
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, updatePopoverPosition])

  const cells = buildMonthGrid(view.year, view.month)
  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
  const minMonth = monthStart(1900, 0)
  const maxMonth = monthStart(2100, 11)
  const viewMonthTime = monthStart(view.year, view.month)
  const canPrev = viewMonthTime > minMonth
  const canNext = viewMonthTime < maxMonth

  const pick = (date) => {
    onChange(toDateValue(date))
    setOpen(false)
  }

  const goMonth = (delta) => {
    setView((current) => {
      const next = new Date(current.year, current.month + delta, 1)
      const nextMonth = monthStart(next.getFullYear(), next.getMonth())
      if (nextMonth < minMonth || nextMonth > maxMonth) return current
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  const popover =
    open &&
    popoverRect &&
    createPortal(
      <div
        data-date-popover
        role="dialog"
        aria-label={`${label} calendar`}
        className="fixed z-[100] overflow-hidden rounded-xl border border-white/10 bg-nb-surface shadow-lg shadow-black/50"
        style={{ top: popoverRect.top, left: popoverRect.left, width: popoverRect.width }}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
          <button
            type="button"
            onClick={() => goMonth(-1)}
            disabled={!canPrev}
            className="rounded-lg p-1.5 text-nb-gray transition hover:bg-white/5 hover:text-nb-white disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Previous month"
          >
            <HiOutlineChevronUp size={18} />
          </button>
          <span className="font-heading text-sm font-semibold text-nb-white">{monthLabel}</span>
          <button
            type="button"
            onClick={() => goMonth(1)}
            disabled={!canNext}
            className="rounded-lg p-1.5 text-nb-gray transition hover:bg-white/5 hover:text-nb-white disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next month"
          >
            <HiOutlineChevronDown size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0 px-2 pt-2">
          {WEEKDAYS.map((day) => (
            <span key={day} className="py-1 text-center text-[10px] font-bold uppercase tracking-wider text-nb-gray">
              {day}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0 px-2 pb-2 pt-1">
          {cells.map((cell) => {
            const isSelected = selectedDate && isSameDay(cell.date, selectedDate)
            const isToday = isSameDay(cell.date, new Date())

            return (
              <button
                key={toDateValue(cell.date)}
                type="button"
                onClick={() => pick(cell.date)}
                className={cn(
                  'mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-sm transition',
                  isSelected
                    ? 'bg-gradient-to-r from-nb-neon-orange to-nb-neon-red font-semibold text-nb-bg shadow-neon-sm'
                    : isToday
                      ? 'font-semibold text-nb-neon-orange ring-1 ring-nb-neon-orange/50'
                      : cell.outside
                        ? 'text-nb-gray/35'
                        : 'text-nb-white hover:bg-white/10',
                )}
              >
                {cell.date.getDate()}
              </button>
            )
          })}
        </div>
      </div>,
      document.body,
    )

  return (
    <label ref={rootRef} className={cn('block space-y-1.5', className)}>
      <span className="text-xs font-medium uppercase tracking-wide text-nb-gray">{label}</span>
      <div className="relative">
        <div
          ref={triggerRef}
          role="button"
          tabIndex={0}
          onClick={() => {
            setOpen((current) => !current)
            if (!open) updatePopoverPosition()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setOpen((current) => !current)
              if (!open) updatePopoverPosition()
            }
          }}
          className={triggerClass()}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className={value ? 'text-nb-white' : 'text-nb-gray/70'}>
            {value ? formatDisplayDate(value) : placeholder}
          </span>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
          <HiOutlineCalendar className="shrink-0 text-nb-gray" size={18} aria-hidden />
        </div>
      </div>

      {popover}
    </label>
  )
}
