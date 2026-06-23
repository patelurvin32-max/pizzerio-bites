import crypto from 'crypto'
import { sameSiteForCookies, shouldUseSecureCookies } from './cookieOptions.js'

export const REFRESH_COOKIE = 'nb_refresh_token'
const REFRESH_DAYS = parseInt(process.env.JWT_REFRESH_DAYS || '7', 10)

export function generateRefreshToken() {
  return crypto.randomBytes(48).toString('base64url')
}

export function hashRefreshToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

export function refreshExpiresAt() {
  return new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000)
}

export function refreshCookieOptions() {
  const secure = shouldUseSecureCookies()
  return {
    httpOnly: true,
    secure,
    sameSite: sameSiteForCookies(),
    maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  }
}
