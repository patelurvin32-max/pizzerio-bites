import mongoose from 'mongoose'

const gallerySchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    imageUrl: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export default mongoose.models.GalleryItem || mongoose.model('GalleryItem', gallerySchema)
