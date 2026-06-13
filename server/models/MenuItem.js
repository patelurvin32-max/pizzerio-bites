import mongoose from 'mongoose'

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    /** Regular price, or sole price when category has no dual pricing */
    price: { type: Number, required: true, min: 0 },
    /** Second tier (extra cheese / with cheese) when category.dualPricing is true */
    priceVariant: { type: Number, min: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    image: { type: String, default: '' },
    available: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    tags: [{ type: String }],
    recipe: [
      {
        inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
        quantity: { type: Number, required: true, min: 0 },
        unit: { type: String, enum: ['KG', 'LTR', 'PCS', 'GM', 'ML', 'unit'], required: true },
      },
    ],
  },
  { timestamps: true }
)

export default mongoose.models.MenuItem || mongoose.model('MenuItem', menuItemSchema)
