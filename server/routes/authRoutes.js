import { Router } from 'express'
import * as auth from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimiter.js'

const r = Router()

r.post('/login', authLimiter, auth.login)
r.post('/refresh', authLimiter, auth.refresh)
r.post('/logout', protect, auth.logout)
r.post('/forgot-password', authLimiter, auth.forgotPassword)
r.post('/reset-password', authLimiter, auth.resetPassword)
r.get('/me', protect, auth.me)

export default r
