import mongoose from 'mongoose'

const counterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    seq: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.models.Counter || mongoose.model('Counter', counterSchema)
