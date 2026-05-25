import mongoose from 'mongoose'

const offerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    code: { type: String, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    discountValue: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
  },
  { timestamps: true }
)

export default mongoose.models.Offer || mongoose.model('Offer', offerSchema)
