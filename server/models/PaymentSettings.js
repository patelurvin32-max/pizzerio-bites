import mongoose from 'mongoose'

const paymentSettingsSchema = new mongoose.Schema(
  {
    provider: { type: String, default: 'stripe' },
    publishableKey: { type: String, default: '' },
    secretKey: { type: String, default: '' },
    webhookSecret: { type: String, default: '' },
    currency: { type: String, default: 'USD' },
    taxRatePercent: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export default mongoose.models.PaymentSettings || mongoose.model('PaymentSettings', paymentSettingsSchema)
