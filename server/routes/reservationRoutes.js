import { Router } from 'express'
import * as c from '../controllers/reservationController.js'
import { protect } from '../middleware/auth.js'
import { requireMinRole } from '../middleware/requireRole.js'
import { publicPostLimiter } from '../middleware/rateLimiter.js'
import { ROLES } from '../utils/roles.js'

const r = Router()
r.post('/public', publicPostLimiter, c.createPublicReservation)
r.use(protect)
r.get('/', requireMinRole(ROLES.RECEPTION), c.listReservations)
r.post('/', requireMinRole(ROLES.RECEPTION), c.createReservation)
r.patch('/:id', requireMinRole(ROLES.RECEPTION), c.updateReservation)
r.delete('/:id', requireMinRole(ROLES.MANAGER), c.deleteReservation)

export default r
