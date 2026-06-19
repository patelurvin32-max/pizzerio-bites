import mongoose from 'mongoose'

const apiRequestLogSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    index: true
  },
  endpoint: {
    type: String,
    index: true
  },
  
  statusCode: {
    type: Number,
    index: true
  },
  responseTime: Number,

  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ipAddress: String,

  requestSize: Number,
  responseSize: Number,

  queryParams: mongoose.Schema.Types.Mixed,

  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
})

apiRequestLogSchema.index(
  { timestamp: 1 },
  {
    expireAfterSeconds: 604800,
    name: 'apiRequestLog_ttl_7days'
  }
)

apiRequestLogSchema.index({ endpoint: 1, statusCode: 1, timestamp: -1 })
apiRequestLogSchema.index({ userId: 1, timestamp: -1 })

export default mongoose.model('ApiRequestLog', apiRequestLogSchema)
