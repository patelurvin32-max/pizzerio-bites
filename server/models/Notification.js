import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, default: '' },
    type: {
      type: String,
      enum: ['order', 'reservation', 'user', 'system', 'inventory', 'payment'],
      default: 'system',
    },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema)
