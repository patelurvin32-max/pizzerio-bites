import { Router } from 'express'
import * as c from '../controllers/reservationController.js'
import { protect } from '../middleware/auth.js'
import { requireMinRole, requireRole } from '../middleware/requireRole.js'
import { publicPostLimiter } from '../middleware/rateLimiter.js'
import { ROLES } from '../utils/roles.js'

const r = Router()
r.post('/public', publicPostLimiter, c.createPublicReservation)
r.use(protect, requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF))
r.get('/', c.listReservations)
r.post('/', c.createReservation)
r.patch('/:id', c.updateReservation)
r.delete('/:id', requireMinRole(ROLES.MANAGER), c.deleteReservation)

export default r
