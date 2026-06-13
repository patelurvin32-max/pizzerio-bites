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
    paymentMethod: { type: String, default: 'card' },
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

export default mongoose.models.Order || mongoose.model('Order', orderSchema)
