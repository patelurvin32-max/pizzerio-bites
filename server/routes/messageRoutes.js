import { Router } from 'express'
import * as c from '../controllers/messageController.js'
import { protect } from '../middleware/auth.js'
import { requireMinRole, requireRole } from '../middleware/requireRole.js'
import { publicPostLimiter } from '../middleware/rateLimiter.js'
import { ROLES } from '../utils/roles.js'

const r = Router()
r.post('/public', publicPostLimiter, c.createPublicMessage)

r.use(protect, requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF))
r.get('/', c.listMessages)
r.patch('/:id', c.updateMessage)
r.delete('/:id', requireMinRole(ROLES.MANAGER), c.deleteMessage)

export default r
