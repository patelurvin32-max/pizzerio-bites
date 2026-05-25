import Notification from '../models/Notification.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { pick, NOTIFICATION_CREATE_FIELDS } from '../utils/pick.js'

export const listNotifications = asyncHandler(async (req, res) => {
  const filter = {}
  if (req.query.unread === 'true') filter.read = false
  const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(100).lean()
  res.json({ items })
})

export const markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true })
  if (!n) return res.status(404).json({ message: 'Not found' })
  res.json(n)
})

export const markAllRead = asyncHandler(async (_req, res) => {
  await Notification.updateMany({}, { read: true })
  res.json({ message: 'OK' })
})

export const createNotification = asyncHandler(async (req, res) => {
  const n = await Notification.create(pick(req.body, NOTIFICATION_CREATE_FIELDS))
  res.status(201).json(n)
})
