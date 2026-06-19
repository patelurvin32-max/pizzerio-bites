import express from 'express'
import path from 'path'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { fileURLToPath } from 'url'
import { apiLimiter } from './middleware/rateLimiter.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { logApiRequest } from './middleware/requestLogger.js'

import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import staffRoutes from './routes/staffRoutes.js'
import menuRoutes from './routes/menuRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import reservationRoutes from './routes/reservationRoutes.js'
import offerRoutes from './routes/offerRoutes.js'
import galleryRoutes from './routes/galleryRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import messageRoutes from './routes/messageRoutes.js'
import analyticsRoutes from './routes/analyticsRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import cmsRoutes from './routes/cmsRoutes.js'
import inventoryRoutes from './routes/inventoryRoutes.js'
import settingsRoutes from './routes/settingsRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import rolesRoutes from './routes/rolesRoutes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

app.set('trust proxy', 1)

const isProd = process.env.NODE_ENV === 'production'
const clientUrl = process.env.CLIENT_URL

if (isProd && !clientUrl) {
  console.error('CLIENT_URL must be set in production (comma-separated allowed origins)')
  process.exit(1)
}

const corsOrigins = (clientUrl || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", ...corsOrigins],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
  })
)
app.use(morgan(isProd ? 'combined' : 'dev'))
app.use(cookieParser())
app.use(express.json({ limit: '1mb' }))
app.use(logApiRequest)

app.use(apiLimiter)

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    setHeaders(res) {
      res.setHeader('X-Content-Type-Options', 'nosniff')
      res.setHeader('Content-Security-Policy', "default-src 'none'")
      res.setHeader('Cache-Control', 'public, max-age=86400')
    },
  })
)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'pizzerio-bites-api' })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/staff', staffRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/reservations', reservationRoutes)
app.use('/api/offers', offerRoutes)
app.use('/api/gallery', galleryRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/cms', cmsRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/roles', rolesRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
