import PaymentSettings from '../models/PaymentSettings.js'
import AppSettings from '../models/AppSettings.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { pick, PAYMENT_SETTINGS_FIELDS } from '../utils/pick.js'
import { encryptSecret, maskSecret } from '../utils/secretCrypto.js'
import { writeAudit } from '../utils/auditLog.js'

const MASK = '••••••••'

function paymentResponse(doc) {
  const json = doc.toObject ? doc.toObject() : doc
  return {
    ...json,
    secretKey: json.secretKey ? maskSecret(json.secretKey) : '',
    webhookSecret: json.webhookSecret ? maskSecret(json.webhookSecret) : '',
    hasSecretKey: Boolean(json.secretKey),
    hasWebhookSecret: Boolean(json.webhookSecret),
  }
}

export const getPaymentSettings = asyncHandler(async (_req, res) => {
  let doc = await PaymentSettings.findOne().lean()
  if (!doc) {
    const created = await PaymentSettings.create({})
    doc = created.toObject()
  }
  res.json(paymentResponse(doc))
})

export const updatePaymentSettings = asyncHandler(async (req, res) => {
  const body = pick(req.body, PAYMENT_SETTINGS_FIELDS)
  let doc = await PaymentSettings.findOne()
  if (!doc) doc = new PaymentSettings()
  const { secretKey, webhookSecret, ...rest } = body
  Object.assign(doc, rest)
  if (secretKey !== undefined && secretKey !== MASK && secretKey !== '') {
    doc.secretKey = encryptSecret(secretKey)
  }
  if (webhookSecret !== undefined && webhookSecret !== MASK && webhookSecret !== '') {
    doc.webhookSecret = encryptSecret(webhookSecret)
  }
  await doc.save()
  await writeAudit(req, { action: 'payment.update', targetType: 'payment_settings', targetId: doc._id })
  res.json(paymentResponse(doc))
})

export const listAppSettings = asyncHandler(async (_req, res) => {
  const items = await AppSettings.find().lean()
  res.json({ items })
})

export const upsertAppSetting = asyncHandler(async (req, res) => {
  const { key, value } = req.body
  if (!key || value === undefined) return res.status(400).json({ message: 'key and value required' })
  const doc = await AppSettings.findOneAndUpdate({ key }, { key, value }, { new: true, upsert: true })
  res.json(doc)
})
