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

// TTL INDEX: Automatically delete documents 30 days after creation
auditLogSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 2592000,
    name: 'auditLog_ttl_30days'
  }
)

export default mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema)
