import mongoose from 'mongoose'
import { ROLES } from '../utils/roles.js'

const shiftSchema = new mongoose.Schema(
  {
    label: String,
    start: String,
    end: String,
    days: [String],
  },
  { _id: false }
)

const attendanceSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'leave', 'late'], default: 'present' },
    note: { type: String, default: '' },
  },
  { _id: false }
)

const staffSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, default: '' },
    department: { type: String, default: 'Front of house' },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.STAFF },
    salary: { type: Number, default: 0 },
    shifts: [shiftSchema],
    attendance: [attendanceSchema],
    performanceScore: { type: Number, min: 0, max: 100, default: 80 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    permissions: [{ type: String }],
  },
  { timestamps: true }
)

export default mongoose.models.Staff || mongoose.model('Staff', staffSchema)
