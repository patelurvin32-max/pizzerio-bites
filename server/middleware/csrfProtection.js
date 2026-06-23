import { doubleCsrf } from 'csrf-csrf'

const isProd = process.env.NODE_ENV === 'production'

const { generateCsrfToken: generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
  getSessionIdentifier: (req) => req.ip || req.socket?.remoteAddress || 'anonymous',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  },
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'],
})

export const generateCsrfToken = (req, res, next) => {
  if (['GET', 'HEAD'].includes(req.method)) {
    res.set('X-CSRF-Token', generateToken(req, res))
  }
  next()
}

export const validateCsrfToken = doubleCsrfProtection

export default { generateCsrfToken, validateCsrfToken }
