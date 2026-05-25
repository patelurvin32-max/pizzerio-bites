import { Router } from 'express'
import * as c from '../controllers/notificationController.js'
import { protect } from '../middleware/auth.js'
import { requireMinRole } from '../middleware/requireRole.js'
import { ROLES } from '../utils/roles.js'

const r = Router()
r.use(protect)
r.get('/', requireMinRole(ROLES.STAFF), c.listNotifications)
r.patch('/:id/read', requireMinRole(ROLES.STAFF), c.markRead)
r.post('/read-all', requireMinRole(ROLES.STAFF), c.markAllRead)
r.post('/', requireMinRole(ROLES.ADMIN), c.createNotification)

export default r
