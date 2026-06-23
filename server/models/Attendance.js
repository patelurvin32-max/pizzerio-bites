import mongoose from 'mongoose'

const attendanceSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    attendance_date: {
      type: Date,
      required: true,
      index: true,
    },
    check_in_time: {
      type: Date,
    },
    check_out_time: {
      type: Date,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    distance_in_meters: {
      type: Number,
    },
    attendance_status: {
      type: String,
      enum: ['Present', 'Late', 'Absent', 'Checked In', 'Checked Out', 'Pending'],
      default: 'Pending',
    },
  },
  { timestamps: true }
)

// Compound index to ensure one attendance record per user per day
attendanceSchema.index({ user_id: 1, attendance_date: 1 }, { unique: true })

// Index for filtering by date and status
attendanceSchema.index({ attendance_date: -1, attendance_status: 1 })

// Index for user attendance history
attendanceSchema.index({ user_id: 1, attendance_date: -1 })

export default mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema)
