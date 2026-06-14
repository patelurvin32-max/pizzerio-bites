import { Router } from 'express'
import * as auth from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'
import { authLimiter, loginLimiter } from '../middleware/rateLimiter.js'

const r = Router()

r.post('/login', loginLimiter, auth.login)
r.post('/refresh', authLimiter, auth.refresh)
r.post('/logout', protect, auth.logout)
r.get('/me', protect, auth.me)

export default r
