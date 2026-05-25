import crypto from 'crypto'
import User from '../models/User.js'
import { signToken } from '../utils/token.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { validatePassword } from '../utils/passwordPolicy.js'
import {
  REFRESH_COOKIE,
  generateRefreshToken,
  hashRefreshToken,
  refreshCookieOptions,
  refreshExpiresAt,
} from '../utils/refreshToken.js'

const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || '15m'

function accessPayload(user) {
  return { id: user._id.toString(), role: user.role, tv: user.tokenVersion || 0 }
}

function issueAccessToken(user) {
  return signToken(accessPayload(user), process.env.JWT_SECRET, ACCESS_EXPIRES)
}

async function persistRefreshToken(user, rawRefresh) {
  user.refreshTokenHash = hashRefreshToken(rawRefresh)
  user.refreshTokenExpires = refreshExpiresAt()
  await user.save()
}

function setRefreshCookie(res, rawRefresh) {
  res.cookie(REFRESH_COOKIE, rawRefresh, refreshCookieOptions())
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' })
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  }
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' })
  }
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshTokenHash +refreshTokenExpires')
  if (!user) return res.status(401).json({ message: 'Invalid credentials' })
  const ok = await user.comparePassword(password)
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' })
  if (user.status !== 'active') return res.status(403).json({ message: 'Account is not active' })
  user.lastLogin = new Date()
  const rawRefresh = generateRefreshToken()
  await persistRefreshToken(user, rawRefresh)
  setRefreshCookie(res, rawRefresh)
  res.json({
    token: issueAccessToken(user),
    user: publicUser(user),
  })
})

export const refresh = asyncHandler(async (req, res) => {
  const raw = req.cookies?.[REFRESH_COOKIE]
  if (!raw) return res.status(401).json({ message: 'Not authorized' })
  const hashed = hashRefreshToken(raw)
  const user = await User.findOne({
    refreshTokenHash: hashed,
    refreshTokenExpires: { $gt: new Date() },
  }).select('+refreshTokenHash +refreshTokenExpires')
  if (!user || user.status !== 'active') {
    clearRefreshCookie(res)
    return res.status(401).json({ message: 'Not authorized' })
  }
  const newRaw = generateRefreshToken()
  await persistRefreshToken(user, newRaw)
  setRefreshCookie(res, newRaw)
  res.json({ token: issueAccessToken(user) })
})

export const logout = asyncHandler(async (req, res) => {
  if (req.userDoc) {
    req.userDoc.refreshTokenHash = ''
    req.userDoc.refreshTokenExpires = undefined
    req.userDoc.tokenVersion = (req.userDoc.tokenVersion || 0) + 1
    await req.userDoc.save()
  }
  clearRefreshCookie(res)
  res.json({ message: 'Logged out' })
})

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id)
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    avatar: user.avatar,
    phone: user.phone,
    lastLogin: user.lastLogin,
  })
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ message: 'Email required' })
  const user = await User.findOne({ email: email.toLowerCase() }).select('+resetPasswordToken +resetPasswordExpires')
  if (!user) {
    return res.json({ message: 'If an account exists, reset instructions were sent.' })
  }
  const raw = crypto.randomBytes(32).toString('hex')
  user.resetPasswordToken = crypto.createHash('sha256').update(raw).digest('hex')
  user.resetPasswordExpires = Date.now() + 1000 * 60 * 60
  await user.save()
  const clientBase = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim()
  const resetUrl = `${clientBase}/reset-password?token=${raw}`
  if (process.env.NODE_ENV !== 'production') {
    console.info('[dev] password reset URL:', resetUrl)
  }
  res.json({ message: 'If an account exists, reset instructions were sent.' })
})

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body
  if (!token) return res.status(400).json({ message: 'Valid token required' })
  const policy = validatePassword(password)
  if (!policy.ok) return res.status(400).json({ message: policy.message })
  const hashed = crypto.createHash('sha256').update(token).digest('hex')
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpires +password')
  if (!user) return res.status(400).json({ message: 'Invalid or expired token' })
  user.password = password
  user.resetPasswordToken = undefined
  user.resetPasswordExpires = undefined
  user.tokenVersion = (user.tokenVersion || 0) + 1
  user.refreshTokenHash = ''
  user.refreshTokenExpires = undefined
  await user.save()
  res.json({ message: 'Password updated. You can sign in.' })
})
