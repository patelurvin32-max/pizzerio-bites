import mongoose from 'mongoose'
import Counter from './Counter.js'

const orderLineSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: String,
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    customerName: { type: String, default: 'Walk-in Customer' },
    customerEmail: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    items: [orderLineSchema],
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded', 'failed'],
      default: 'unpaid',
    },
    paymentMethod: { type: String, default: 'cash' },
    orderType: {
      type: String,
      enum: ['dine-in', 'takeaway'],
      default: 'dine-in',
    },
    notes: { type: String, default: '' },
    deliveryAddress: { type: String, default: '' },
    assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
  },
  { timestamps: true }
)

orderSchema.pre('save', async function genOrderNumber(next) {
  if (this.orderNumber) return next()
  try {
    const year = new Date().getFullYear()
    const counter = await Counter.findOneAndUpdate(
      { key: `order-${year}` },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
    this.orderNumber = `${year}/${String(counter.seq).padStart(5, '0')}`
    next()
  } catch (error) {
    next(error)
  }
})

// Single field indexes for common WHERE clauses
orderSchema.index({ orderNumber: 1 }, { unique: true })
orderSchema.index({ customerEmail: 1 })
orderSchema.index({ customerPhone: 1 })
orderSchema.index({ status: 1 })
orderSchema.index({ createdAt: -1 })
orderSchema.index({ updatedAt: -1 })

// Compound indexes for common query combinations
// Pattern: fetch orders by customer email sorted by date (most common)
orderSchema.index({ customerEmail: 1, createdAt: -1 })

// Pattern: fetch orders by status sorted by date (for dashboard/admin)
orderSchema.index({ status: 1, createdAt: -1 })

// Pattern: date range queries with status filter
orderSchema.index({ status: 1, createdAt: -1, total: 1 })

// Pattern: find pending orders older than X minutes (for delayed alerts)
orderSchema.index({ status: 1, createdAt: 1 })

export default mongoose.models.Order || mongoose.model('Order', orderSchema)
