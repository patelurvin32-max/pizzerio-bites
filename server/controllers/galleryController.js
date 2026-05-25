import GalleryItem from '../models/GalleryItem.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { pick, GALLERY_FIELDS } from '../utils/pick.js'

export const listGallery = asyncHandler(async (_req, res) => {
  const items = await GalleryItem.find().sort({ sortOrder: 1, createdAt: -1 }).lean()
  res.json({ items })
})

export const createGallery = asyncHandler(async (req, res) => {
  const g = await GalleryItem.create(pick(req.body, GALLERY_FIELDS))
  res.status(201).json(g)
})

export const updateGallery = asyncHandler(async (req, res) => {
  const g = await GalleryItem.findByIdAndUpdate(req.params.id, pick(req.body, GALLERY_FIELDS), {
    new: true,
    runValidators: true,
  })
  if (!g) return res.status(404).json({ message: 'Not found' })
  res.json(g)
})

export const deleteGallery = asyncHandler(async (req, res) => {
  await GalleryItem.findByIdAndDelete(req.params.id)
  res.json({ message: 'Deleted' })
})
