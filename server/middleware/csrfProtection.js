import { doubleCsrf } from 'csrf-csrf'
import { sameSiteForCookies, shouldUseSecureCookies } from '../utils/cookieOptions.js'

const { generateCsrfToken: generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
  getSessionIdentifier: () => 'anonymous',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: sameSiteForCookies(),
    path: '/',
  },
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'],
  skipCsrfProtection: (req) => {
    // Skip CSRF protection if the request has a Bearer token
    if (req.headers.authorization?.startsWith('Bearer ')) {
      return true
    }
    // Skip CSRF protection if there is no refresh cookie (no cookie-based auth session exists)
    if (!req.cookies?.nb_refresh_token) {
      return true
    }
    return false
  },
})

export const generateCsrfToken = (req, res, next) => {
  if (['GET', 'HEAD'].includes(req.method)) {
    res.set('X-CSRF-Token', generateToken(req, res))
  }
  next()
}

export const validateCsrfToken = doubleCsrfProtection

export default { generateCsrfToken, validateCsrfToken }
