import mongoose from 'mongoose'

const closingLineSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
    name: String,
    unit: String,
    finalStock: Number,
    value: Number,
  },
  { _id: false }
)

const inventoryClosingSchema = new mongoose.Schema(
  {
    dateKey: { type: String, required: true, unique: true },
    date: { type: Date, required: true },
    openingStock: { type: Number, default: 0 },
    totalStockIn: { type: Number, default: 0 },
    totalStockOut: { type: Number, default: 0 },
    totalWaste: { type: Number, default: 0 },
    finalStock: { type: Number, default: 0 },
    calculatedClosing: { type: Number, default: 0 },
    inventoryValue: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    closedBy: { type: String, required: true },
    confirmed: { type: Boolean, default: true },
    lines: [closingLineSchema],
  },
  { timestamps: true }
)

export default mongoose.models.InventoryClosing || mongoose.model('InventoryClosing', inventoryClosingSchema)
