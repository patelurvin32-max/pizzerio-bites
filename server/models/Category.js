import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    /** When true, items use price (regular) + priceVariant (e.g. extra cheese) */
    dualPricing: { type: Boolean, default: false },
    variantLabel: { type: String, default: 'Extra Cheese', trim: true },
  },
  { timestamps: true }
)

// Single field indexes
categorySchema.index({ slug: 1 }, { unique: true })
categorySchema.index({ active: 1 })
categorySchema.index({ sortOrder: 1 })

// Compound: for sorting active categories
categorySchema.index({ active: 1, sortOrder: 1 })

export default mongoose.models.Category || mongoose.model('Category', categorySchema)
