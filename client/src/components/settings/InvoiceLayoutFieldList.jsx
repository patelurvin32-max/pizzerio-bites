import { useState } from 'react'
import { FiChevronDown, FiChevronUp, FiMenu } from 'react-icons/fi'
import Select from '../common/Select.jsx'
import { cn } from '../../utils/helpers.js'
import { FONT_SIZE_MAP } from '../../utils/invoiceLayoutDefaults.js'

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-[28px] w-[52px] shrink-0 items-center rounded-full border border-white/10 p-[3px] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-nb-neon-orange/35 focus:ring-offset-0',
        checked ? 'bg-nb-neon-orange shadow-[0_0_0_1px_rgba(255,122,0,0.35)]' : 'bg-white/15'
      )}
    >
      <span
        className={cn(
          'block h-[22px] w-[22px] rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-transform duration-150',
          checked ? 'translate-x-[24px]' : 'translate-x-0'
        )}
      />
    </button>
  )
}

function FormatToolbar({ field, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-2 py-2">
      <Select
        label=""
        value={field.fontSize || 'small'}
        onChange={(e) => onChange({ fontSize: e.target.value })}
        className="min-w-[100px]"
      >
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
      </Select>
      <button
        type="button"
        onClick={() => onChange({ bold: !field.bold })}
        className={cn(
          'min-h-[36px] rounded-lg border px-3 text-sm font-bold',
          field.bold ? 'border-nb-neon-orange bg-nb-neon-orange/20 text-nb-neon-orange' : 'border-white/10 text-nb-gray'
        )}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => onChange({ underline: !field.underline })}
        className={cn(
          'min-h-[36px] rounded-lg border px-3 text-sm underline',
          field.underline ? 'border-nb-neon-orange bg-nb-neon-orange/20 text-nb-neon-orange' : 'border-white/10 text-nb-gray'
        )}
      >
        U
      </button>
      <span className="text-xs text-nb-gray">
        Preview: {FONT_SIZE_MAP[field.fontSize || 'small']}px
      </span>
    </div>
  )
}

export default function InvoiceLayoutFieldList({
  fields,
  onChange,
  showFormatting = false,
  contentPlaceholder = 'Enter text…',
}) {
  const [dragIndex, setDragIndex] = useState(null)
  const sorted = [...fields].sort((a, b) => a.order - b.order)

  function updateField(id, patch) {
    onChange(
      fields.map((field) => (field.id === id ? { ...field, ...patch } : field))
    )
  }

  function handleDrop(toIndex) {
    if (dragIndex === null || dragIndex === toIndex) {
      setDragIndex(null)
      return
    }
    const next = [...sorted]
    const [removed] = next.splice(dragIndex, 1)
    next.splice(toIndex, 0, removed)
    onChange(next.map((field, index) => ({ ...field, order: index })))
    setDragIndex(null)
  }

  return (
    <ul className="space-y-2">
      {sorted.map((field, index) => (
        <li
          key={field.id}
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => handleDrop(index)}
          onDragEnd={() => setDragIndex(null)}
          className={cn(
            'rounded-xl border border-white/10 bg-black/25 transition',
            dragIndex === index && 'opacity-60'
          )}
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <span className="cursor-grab text-nb-gray active:cursor-grabbing" aria-hidden>
              <FiMenu className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 text-sm font-medium text-nb-white">{field.label}</span>
            <Toggle
              checked={Boolean(field.enabled)}
              onChange={(enabled) => updateField(field.id, { enabled })}
              label={`Toggle ${field.label}`}
            />
          </div>

          {field.enabled && field.hasContent !== false && (
            <div className="space-y-2 border-t border-white/5 px-3 pb-3 pt-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-nb-gray">
                  {field.label} *
                </span>
                <textarea
                  value={field.content || ''}
                  onChange={(e) => updateField(field.id, { content: e.target.value })}
                  placeholder={contentPlaceholder}
                  rows={field.id === 'termsConditions' || field.id === 'bankDetails' ? 3 : 2}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-nb-white outline-none transition placeholder:text-nb-gray/60 focus:border-nb-neon-orange/60 focus:ring-2 focus:ring-nb-neon-orange/25"
                />
              </label>
              {showFormatting && (
                <FormatToolbar
                  field={field}
                  onChange={(patch) => updateField(field.id, patch)}
                />
              )}
            </div>
          )}

          {field.enabled && field.hasContent === false && field.id === 'logo' && (
            <p className="border-t border-white/5 px-3 pb-3 pt-2 text-xs text-nb-gray">
              Uses your business logo from general settings or the default restaurant logo.
            </p>
          )}

          {field.enabled && field.hasContent === false && field.id === 'qrCode' && (
            <p className="border-t border-white/5 px-3 pb-3 pt-2 text-xs text-nb-gray">
              Displays a QR code placeholder on the invoice when enabled.
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}

export function CollapsibleSection({ title, open, onToggle, children, className }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-white/10 bg-black/25', className)}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors duration-150 hover:bg-white/5"
      >
        <span className="min-w-0 flex-1 truncate font-medium text-nb-white">{title}</span>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/30 text-nb-gray">
          {open ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
        </span>
      </button>
      <div
        className={cn(
          'grid overflow-hidden border-t border-white/10 px-4 transition-[grid-template-rows,opacity] duration-200 ease-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 border-t-0'
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="pb-4 pt-2">{children}</div>
        </div>
      </div>
    </div>
  )
}

export { Toggle }
