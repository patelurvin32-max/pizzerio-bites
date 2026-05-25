export function cn(...parts) {
  return parts.filter(Boolean).join(' ')
}

export function formatCurrency(n, currency = 'INR') {
  const v = Number(n) || 0
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'INR' ? 0 : 2,
  }).format(v)
}

export function formatDate(d) {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Bookable dates for reservation dropdowns (today → daysAhead) */
export function buildReservationDateOptions(daysAhead = 90) {
  const options = []
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  for (let i = 0; i <= daysAhead; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    options.push({ value, label })
  }

  return options
}

export function todayDateValue() {
  return buildReservationDateOptions(0)[0]?.value || ''
}
