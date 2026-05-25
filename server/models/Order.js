import mongoose from 'mongoose'
import { nanoid } from 'nanoid'

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
    customerName: { type: String, required: true },
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
  this.orderNumber = `NB-${nanoid(8).toUpperCase()}`
  next()
})

export default mongoose.models.Order || mongoose.model('Order', orderSchema)
