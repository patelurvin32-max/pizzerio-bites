import mongoose from 'mongoose'

const inventoryTransactionSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    productName: { type: String, required: true },
    type: { type: String, enum: ['stock_in', 'stock_out', 'waste', 'order_deduction', 'expired_removal'], required: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, enum: ['KG', 'LTR', 'PCS', 'GM', 'ML', 'unit'], required: true },
    purchasePrice: { type: Number, default: 0 },
    supplierName: { type: String, default: '' },
    invoiceNumber: { type: String, default: '' },
    reason: { type: String, default: '' },
    department: { type: String, default: '' },
    approvedBy: { type: String, default: '' },
    staffName: { type: String, default: '' },
    notes: { type: String, default: '' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', default: null },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export default mongoose.models.InventoryTransaction ||
  mongoose.model('InventoryTransaction', inventoryTransactionSchema)
