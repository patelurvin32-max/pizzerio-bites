const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_NAME = 120
const MAX_NOTES = 2000
const MAX_MESSAGE = 5000
const MAX_PARTY = 20

export function isHoneypotTriggered(body) {
  if (!body || typeof body !== 'object') return false
  const hp = body._hp ?? body.website
  return hp !== undefined && hp !== null && String(hp).trim() !== ''
}

export function parsePublicReservation(body) {
  if (isHoneypotTriggered(body)) {
    const err = new Error('Invalid submission')
    err.statusCode = 400
    throw err
  }

  const customerName = String(body.customerName || '').trim().slice(0, MAX_NAME)
  const customerEmail = String(body.customerEmail || '').trim().slice(0, 254)
  const customerPhone = String(body.customerPhone || '').trim().slice(0, 40)
  const partySize = Math.min(MAX_PARTY, Math.max(1, parseInt(body.partySize, 10) || 0))
  const timeSlot = String(body.timeSlot || '').trim().slice(0, 20)
  const tableLabel = String(body.tableLabel || '').trim().slice(0, 80)
  const notes = String(body.notes || '').trim().slice(0, MAX_NOTES)
  const date = body.date ? new Date(body.date) : null

  if (!customerName) {
    const err = new Error('Name is required')
    err.statusCode = 400
    throw err
  }
  if (!customerPhone) {
    const err = new Error('Phone is required')
    err.statusCode = 400
    throw err
  }
  if (!partySize) {
    const err = new Error('Valid party size is required')
    err.statusCode = 400
    throw err
  }
  if (!timeSlot) {
    const err = new Error('Time slot is required')
    err.statusCode = 400
    throw err
  }
  if (!date || Number.isNaN(date.getTime())) {
    const err = new Error('Valid date is required')
    err.statusCode = 400
    throw err
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (date < today) {
    const err = new Error('Reservation date must be today or later')
    err.statusCode = 400
    throw err
  }

  if (customerEmail && !EMAIL_RE.test(customerEmail)) {
    const err = new Error('Invalid email address')
    err.statusCode = 400
    throw err
  }

  return {
    customerName,
    customerEmail,
    customerPhone,
    partySize,
    date,
    timeSlot,
    tableLabel,
    notes,
    status: 'pending',
  }
}

export function parsePublicMessage(body) {
  if (isHoneypotTriggered(body)) {
    const err = new Error('Invalid submission')
    err.statusCode = 400
    throw err
  }

  const name = String(body.name || '').trim().slice(0, MAX_NAME)
  const email = String(body.email || '').trim().slice(0, 254)
  const subject = String(body.subject || '').trim().slice(0, 200)
  const message = String(body.message || '').trim().slice(0, MAX_MESSAGE)

  if (!name || !email || !message) {
    const err = new Error('Name, email, and message are required')
    err.statusCode = 400
    throw err
  }
  if (!EMAIL_RE.test(email)) {
    const err = new Error('Invalid email address')
    err.statusCode = 400
    throw err
  }

  return { name, email, subject, message, read: false }
}
