import SiteContent from '../models/SiteContent.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const listCms = asyncHandler(async (_req, res) => {
  const items = await SiteContent.find().sort({ section: 1, key: 1 }).lean()
  res.json({ items })
})

export const getCmsByKey = asyncHandler(async (req, res) => {
  const doc = await SiteContent.findOne({ key: req.params.key }).lean()
  if (!doc) return res.status(404).json({ message: 'Not found' })
  res.json(doc)
})

export const upsertCms = asyncHandler(async (req, res) => {
  const { key, section, value } = req.body
  if (!key || value === undefined) return res.status(400).json({ message: 'key and value required' })
  const doc = await SiteContent.findOneAndUpdate(
    { key },
    { key, section: section || 'general', value },
    { new: true, upsert: true, runValidators: true }
  )
  res.json(doc)
})

export const deleteCms = asyncHandler(async (req, res) => {
  await SiteContent.deleteOne({ key: req.params.key })
  res.json({ message: 'Deleted' })
})
