import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { ROLES } from '../utils/roles.js'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 10, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STAFF,
    },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    avatar: { type: String, default: '' },
    phone: { type: String, default: '' },
    lastLogin: { type: Date },
    tokenVersion: { type: Number, default: 0 },
    refreshTokenHash: { type: String, select: false, default: '' },
    refreshTokenExpires: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
)

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password)
}

export default mongoose.models.User || mongoose.model('User', userSchema)
