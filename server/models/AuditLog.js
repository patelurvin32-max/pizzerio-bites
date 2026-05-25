import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: String, default: '' },
    actorEmail: { type: String, default: '' },
    action: { type: String, required: true },
    targetType: { type: String, default: '' },
    targetId: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
  },
  { timestamps: true }
)

auditLogSchema.index({ createdAt: -1 })

export default mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema)
