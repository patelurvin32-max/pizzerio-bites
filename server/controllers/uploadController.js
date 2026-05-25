import path from 'path'
import { asyncHandler } from '../utils/asyncHandler.js'

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file' })
  const publicPath = `/uploads/${path.basename(req.file.path)}`
  res.json({ url: publicPath })
})
