import mongoose from 'mongoose'

const reservationSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    customerEmail: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    partySize: { type: Number, required: true, min: 1 },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    tableLabel: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined', 'completed', 'no_show'],
      default: 'pending',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
)

export default mongoose.models.Reservation || mongoose.model('Reservation', reservationSchema)
