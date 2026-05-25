import Review from '../models/Review.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { pick, REVIEW_FIELDS } from '../utils/pick.js'

export const listReviews = asyncHandler(async (_req, res) => {
  const items = await Review.find().sort({ createdAt: -1 }).lean()
  res.json({ items })
})

export const createReview = asyncHandler(async (req, res) => {
  const r = await Review.create(pick(req.body, REVIEW_FIELDS))
  res.status(201).json(r)
})

export const updateReview = asyncHandler(async (req, res) => {
  const r = await Review.findByIdAndUpdate(req.params.id, pick(req.body, REVIEW_FIELDS), {
    new: true,
    runValidators: true,
  })
  if (!r) return res.status(404).json({ message: 'Not found' })
  res.json(r)
})

export const deleteReview = asyncHandler(async (req, res) => {
  await Review.findByIdAndDelete(req.params.id)
  res.json({ message: 'Deleted' })
})
