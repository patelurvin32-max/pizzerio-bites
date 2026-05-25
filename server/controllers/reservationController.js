import Reservation from '../models/Reservation.js'
import Notification from '../models/Notification.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { pick, RESERVATION_UPDATE_FIELDS } from '../utils/pick.js'
import { parsePublicReservation } from '../utils/publicValidation.js'

export const listReservations = asyncHandler(async (req, res) => {
  const status = req.query.status
  const filter = {}
  if (status) filter.status = status
  const items = await Reservation.find(filter).sort({ date: 1 }).limit(300).lean()
  res.json({ items })
})

export const createPublicReservation = asyncHandler(async (req, res) => {
  const payload = parsePublicReservation(req.body)
  const r = await Reservation.create(payload)
  await Notification.create({
    title: 'New reservation request',
    body: `${r.customerName} — ${r.partySize} guests`,
    type: 'reservation',
    meta: { reservationId: r._id },
  })
  res.status(201).json({
    id: r._id,
    customerName: r.customerName,
    date: r.date,
    timeSlot: r.timeSlot,
    status: r.status,
  })
})

export const createReservation = asyncHandler(async (req, res) => {
  const payload = pick(req.body, RESERVATION_UPDATE_FIELDS)
  if (!payload.status) payload.status = 'pending'
  const r = await Reservation.create(payload)
  await Notification.create({
    title: 'New reservation request',
    body: `${r.customerName} — ${r.partySize} guests`,
    type: 'reservation',
    meta: { reservationId: r._id },
  })
  res.status(201).json(r)
})

export const updateReservation = asyncHandler(async (req, res) => {
  const payload = pick(req.body, RESERVATION_UPDATE_FIELDS)
  const r = await Reservation.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true })
  if (!r) return res.status(404).json({ message: 'Not found' })
  if (payload.status) {
    await Notification.create({
      title: 'Reservation updated',
      body: `${r.customerName} — ${r.status}`,
      type: 'reservation',
      meta: { reservationId: r._id },
    })
  }
  res.json(r)
})

export const deleteReservation = asyncHandler(async (req, res) => {
  await Reservation.findByIdAndDelete(req.params.id)
  res.json({ message: 'Deleted' })
})
