import mongoose from 'mongoose'

const inventoryItemSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    category: { type: String, default: 'General' },
    quantity: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 5 },
    unit: { type: String, default: 'unit' },
    supplier: { type: String, default: '' },
    lastRestocked: { type: Date },
  },
  { timestamps: true }
)

export default mongoose.models.InventoryItem || mongoose.model('InventoryItem', inventoryItemSchema)
