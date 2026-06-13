import mongoose from 'mongoose'

const inventoryItemSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    category: { type: String, default: 'General' },
    quantity: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 5 },
    unit: { type: String, enum: ['KG', 'LTR', 'PCS', 'GM', 'ML', 'unit'], default: 'PCS' },
    supplier: { type: String, default: '' },
    expiryDate: { type: Date },
    purchasePrice: { type: Number, default: 0, min: 0 },
    lastRestocked: { type: Date },
  },
  { timestamps: true }
)

export default mongoose.models.InventoryItem || mongoose.model('InventoryItem', inventoryItemSchema)
