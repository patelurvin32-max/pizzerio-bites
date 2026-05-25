import Offer from '../models/Offer.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { pick, OFFER_FIELDS } from '../utils/pick.js'

export const listOffers = asyncHandler(async (_req, res) => {
  const items = await Offer.find().sort({ createdAt: -1 }).lean()
  res.json({ items })
})

export const createOffer = asyncHandler(async (req, res) => {
  const o = await Offer.create(pick(req.body, OFFER_FIELDS))
  res.status(201).json(o)
})

export const updateOffer = asyncHandler(async (req, res) => {
  const o = await Offer.findByIdAndUpdate(req.params.id, pick(req.body, OFFER_FIELDS), {
    new: true,
    runValidators: true,
  })
  if (!o) return res.status(404).json({ message: 'Not found' })
  res.json(o)
})

export const deleteOffer = asyncHandler(async (req, res) => {
  await Offer.findByIdAndDelete(req.params.id)
  res.json({ message: 'Deleted' })
})
