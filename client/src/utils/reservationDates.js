export function getMinReservationDate() {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function toDateValue(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const MAX_BOOKING_DAYS_AHEAD = 365

export function getMaxReservationDate() {
  const max = parseLocalDate(getMinReservationDate())
  max.setDate(max.getDate() + MAX_BOOKING_DAYS_AHEAD)
  return toDateValue(max)
}

export function isPastDate(date) {
  const today = parseLocalDate(getMinReservationDate())
  const check = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return check < today
}

export function isBeyondMaxBooking(date) {
  const max = parseLocalDate(getMaxReservationDate())
  const check = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return check > max
}

export function isDateSelectable(date) {
  return !isPastDate(date) && !isBeyondMaxBooking(date)
}

export function formatDateDdMmYyyy(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}
