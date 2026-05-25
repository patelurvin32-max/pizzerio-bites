import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    authorName: { type: String, required: true },
    authorTitle: { type: String, default: '' },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    body: { type: String, required: true },
    featured: { type: Boolean, default: false },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.models.Review || mongoose.model('Review', reviewSchema)
