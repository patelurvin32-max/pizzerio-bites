import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  HiOutlineCalendar,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from 'react-icons/hi'
import { WEEKDAYS, buildMonthGrid, isSameDay, monthStart } from '../../utils/calendarUtils.js'
import {
  formatDateDdMmYyyy,
  getMaxReservationDate,
  getMinReservationDate,
  isDateSelectable,
  parseLocalDate,
  toDateValue,
} from '../../utils/reservationDates.js'
import { cn } from '../../utils/helpers.js'

function triggerClass(error, touched) {
  const base =
    'mt-1.5 flex w-full min-h-[44px] items-center justify-between gap-2 rounded-xl border bg-black/30 px-3 py-2.5 text-left text-sm outline-none transition focus:border-nb-neon-orange/60 focus:ring-2 focus:ring-nb-neon-orange/25'
  if (error && touched) return `${base} border-nb-neon-red/60`
  return `${base} border-white/10`
}

function getInitialView(value) {
  const base = value ? parseLocalDate(value) : parseLocalDate(getMinReservationDate())
  return { year: base.getFullYear(), month: base.getMonth() }
}

export default function CalendarDatePicker({
  label = 'Date',
  required = true,
  value,
  onChange,
  onBlur,
  error,
  touched,
  className,
}) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => getInitialView(value))
  const [popoverRect, setPopoverRect] = useState(null)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)

  const today = parseLocalDate(getMinReservationDate())
  const selectedDate = value ? parseLocalDate(value) : null

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
      const d = parseLocalDate(value)
      setView({ year: d.getFullYear(), month: d.getMonth() })
    }
  }, [value])

  useEffect(() => {
    if (!open) return undefined

    updatePopoverPosition()
    const onScrollOrResize = () => updatePopoverPosition()

    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target) && !e.target.closest('[data-calendar-popover]')) {
        setOpen(false)
        onBlur?.()
      }
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        onBlur?.()
      }
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
  }, [open, onBlur, updatePopoverPosition])

  const cells = buildMonthGrid(view.year, view.month)
  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const minMonth = monthStart(today.getFullYear(), today.getMonth())
  const maxDate = parseLocalDate(getMaxReservationDate())
  const maxMonth = monthStart(maxDate.getFullYear(), maxDate.getMonth())
  const viewMonthTime = monthStart(view.year, view.month)
  const canPrev = viewMonthTime > minMonth
  const canNext = viewMonthTime < maxMonth

  const pick = (date) => {
    if (!isDateSelectable(date)) return
    onChange(toDateValue(date))
    setOpen(false)
    onBlur?.()
  }

  const goMonth = (delta) => {
    setView((v) => {
      const next = new Date(v.year, v.month + delta, 1)
      const nextMonth = monthStart(next.getFullYear(), next.getMonth())
      if (nextMonth < minMonth || nextMonth > maxMonth) return v
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  const handleToday = () => pick(today)
  const handleClear = () => {
    onChange('')
    setOpen(false)
    onBlur?.()
  }

  const popover =
    open &&
    popoverRect &&
    createPortal(
      <div
        data-calendar-popover
        role="dialog"
        aria-label="Choose reservation date"
        className="fixed z-[100] overflow-hidden rounded-xl border border-white/10 bg-nb-surface shadow-lg shadow-black/50"
        style={{
          top: popoverRect.top,
          left: popoverRect.left,
          width: popoverRect.width,
        }}
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
            <span
              key={day}
              className="py-1 text-center text-[10px] font-bold uppercase tracking-wider text-nb-gray"
            >
              {day}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0 px-2 pb-2 pt-1">
          {cells.map((cell) => {
            const selectable = isDateSelectable(cell.date)
            const isSelected = selectedDate && isSameDay(cell.date, selectedDate)
            const isToday = isSameDay(cell.date, today)

            return (
              <button
                key={toDateValue(cell.date)}
                type="button"
                disabled={!selectable}
                onClick={() => pick(cell.date)}
                className={cn(
                  'mx-auto flex h-9 w-9 items-center justify-center rounded-lg text-sm transition',
                  isSelected
                    ? 'bg-gradient-to-r from-nb-neon-orange to-nb-neon-red font-semibold text-nb-bg shadow-neon-sm'
                    : isToday
                      ? 'font-semibold text-nb-neon-orange ring-1 ring-nb-neon-orange/50'
                      : cell.outside
                        ? 'text-nb-gray/35'
                        : selectable
                          ? 'text-nb-white hover:bg-white/10'
                          : 'cursor-not-allowed text-nb-gray/30',
                )}
              >
                {cell.date.getDate()}
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-semibold uppercase tracking-wider text-nb-gray transition hover:text-nb-white"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="text-xs font-semibold uppercase tracking-wider text-nb-neon-orange transition hover:text-nb-gold"
          >
            Today
          </button>
        </div>
      </div>,
      document.body,
    )

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <span className="text-xs font-medium uppercase tracking-wide text-nb-gray">
        {label}
        {required && <span className="text-nb-neon-orange"> *</span>}
      </span>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen((o) => !o)
          if (!open) updatePopoverPosition()
        }}
        className={triggerClass(error, touched)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={!!error && touched}
      >
        <span className={value ? 'text-nb-white' : 'text-nb-gray/70'}>
          {value ? formatDateDdMmYyyy(value) : 'dd/mm/yyyy'}
        </span>
        <HiOutlineCalendar className="shrink-0 text-nb-gray" size={18} aria-hidden />
      </button>

      {popover}

      {error && touched && (
        <p className="mt-1.5 text-xs text-nb-neon-red" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
