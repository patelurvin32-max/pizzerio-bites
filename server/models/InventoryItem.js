import mongoose from 'mongoose'

const inventoryItemSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    category: { type: String, default: 'General' },
    quantity: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 5 },
    unit: { type: String, enum: ['KG', 'LTR', 'PCS', 'GM', 'ML'], default: 'PCS' },
    supplier: { type: String, default: '' },
    expiryDate: { type: Date },
    purchasePrice: { type: Number, default: 0, min: 0 },
    lastRestocked: { type: Date },
  },
  { timestamps: true }
)

// Single field indexes
inventoryItemSchema.index({ sku: 1 }, { unique: true })
inventoryItemSchema.index({ name: 1 })
inventoryItemSchema.index({ category: 1 })
inventoryItemSchema.index({ quantity: 1 })
inventoryItemSchema.index({ lastRestocked: -1 })
inventoryItemSchema.index({ updatedAt: -1 })
inventoryItemSchema.index({ expiryDate: 1 })

// Compound indexes
// Pattern: find low-stock items (quantity < minStock) sorted by urgency
inventoryItemSchema.index({ quantity: 1, minStock: 1 })

// Pattern: fetch inventory with product details sorted by last update
inventoryItemSchema.index({ sku: 1, updatedAt: -1 })

// Pattern: items that need restocking (quantity <= minStock), ordered by last restocked
inventoryItemSchema.index({ quantity: 1, lastRestocked: -1 })

// Pattern: list items by category sorted by name (for inventory list with category filter)
inventoryItemSchema.index({ category: 1, name: 1 })

// Pattern: search by name or sku with sorting
inventoryItemSchema.index({ name: 1, sku: 1 })

export default mongoose.models.InventoryItem || mongoose.model('InventoryItem', inventoryItemSchema)
