import crypto from 'crypto'

const ALGO = 'aes-256-gcm'
const IV_LEN = 12

function getKey() {
  const raw = process.env.PAYMENT_ENCRYPTION_KEY || process.env.JWT_SECRET
  if (!raw) return null
  return crypto.createHash('sha256').update(String(raw)).digest()
}

export function encryptSecret(plain) {
  if (!plain) return ''
  const key = getKey()
  if (!key) return plain
  const iv = crypto.randomBytes(IV_LEN)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `enc:${iv.toString('base64url')}:${tag.toString('base64url')}:${enc.toString('base64url')}`
}

export function decryptSecret(stored) {
  if (!stored) return ''
  if (!String(stored).startsWith('enc:')) return String(stored)
  const key = getKey()
  if (!key) return ''
  const [, ivB64, tagB64, dataB64] = String(stored).split(':')
  const iv = Buffer.from(ivB64, 'base64url')
  const tag = Buffer.from(tagB64, 'base64url')
  const data = Buffer.from(dataB64, 'base64url')
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

export function maskSecret(value) {
  if (!value) return ''
  return '••••••••'
}
