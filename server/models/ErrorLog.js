import mongoose from 'mongoose'

const errorLogSchema = new mongoose.Schema({
  message: String,
  stack: String,
  type: {
    type: String,
    enum: ['validation_error', 'not_found', 'auth_error', 'server_error', 'external_api'],
    index: true
  },

  endpoint: String,
  method: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ipAddress: String,
  
  requestBody: mongoose.Schema.Types.Mixed,
  responseStatus: Number,

  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },

  environment: {
    type: String,
    enum: ['development', 'staging', 'production'],
    default: 'production'
  },

  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },

  resolved: {
    type: Boolean,
    default: false
  },
})

errorLogSchema.index(
  { timestamp: 1 },
  {
    expireAfterSeconds: 1296000,
    name: 'errorLog_ttl_15days'
  }
)

errorLogSchema.index({ severity: 1, timestamp: -1 })
errorLogSchema.index({ type: 1, timestamp: -1 })
errorLogSchema.index({ endpoint: 1, timestamp: -1 })

export default mongoose.model('ErrorLog', errorLogSchema)
