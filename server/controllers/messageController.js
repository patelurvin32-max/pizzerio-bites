import ContactMessage from '../models/ContactMessage.js'
import Notification from '../models/Notification.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { pick, MESSAGE_UPDATE_FIELDS } from '../utils/pick.js'
import { parsePublicMessage } from '../utils/publicValidation.js'

export const listMessages = asyncHandler(async (req, res) => {
  const read = req.query.read
  const filter = {}
  if (read === 'true') filter.read = true
  if (read === 'false') filter.read = false
  const items = await ContactMessage.find(filter).sort({ createdAt: -1 }).limit(200).lean()
  res.json({ items })
})

export const createPublicMessage = asyncHandler(async (req, res) => {
  const payload = parsePublicMessage(req.body)
  const m = await ContactMessage.create(payload)
  await Notification.create({
    title: 'New contact message',
    body: m.subject || m.message.slice(0, 80),
    type: 'system',
    meta: { messageId: m._id },
  })
  res.status(201).json({ message: 'Thank you. We will get back to you soon.' })
})

export const updateMessage = asyncHandler(async (req, res) => {
  const payload = pick(req.body, MESSAGE_UPDATE_FIELDS)
  const m = await ContactMessage.findByIdAndUpdate(req.params.id, payload, { new: true })
  if (!m) return res.status(404).json({ message: 'Not found' })
  res.json(m)
})

export const deleteMessage = asyncHandler(async (req, res) => {
  await ContactMessage.findByIdAndDelete(req.params.id)
  res.json({ message: 'Deleted' })
})
