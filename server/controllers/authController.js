import User from '../models/User.js'
import { signToken } from '../utils/token.js'
import { asyncHandler } from '../utils/asyncHandler.js'
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

async function persistRefreshToken(user, rawRefresh, extraFields = {}) {
  const refreshTokenHash = hashRefreshToken(rawRefresh)
  const refreshTokenExpires = refreshExpiresAt()
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        refreshTokenHash,
        refreshTokenExpires,
        ...extraFields,
      },
    }
  )
  user.refreshTokenHash = refreshTokenHash
  user.refreshTokenExpires = refreshTokenExpires
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
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshTokenHash +refreshTokenExpires +failedLoginAttempts +lockedUntil')
  if (!user) return res.status(401).json({ message: 'Invalid credentials' })
  
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return res.status(429).json({ message: 'Account is temporarily locked due to too many failed login attempts' })
  }
  
  const ok = await user.comparePassword(password)
  if (!ok) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1
    if (user.failedLoginAttempts >= 10) {
      user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000)
    }
    await user.save()
    return res.status(401).json({ message: 'Invalid credentials' })
  }
  
  if (user.status !== 'active') return res.status(403).json({ message: 'Account is not active' })
  
  user.failedLoginAttempts = 0
  user.lockedUntil = null
  const rawRefresh = generateRefreshToken()
  await persistRefreshToken(user, rawRefresh, { lastLogin: new Date() })
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
