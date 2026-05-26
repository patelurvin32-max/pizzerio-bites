import { Router } from 'express'
import * as c from '../controllers/reviewController.js'
import { protect } from '../middleware/auth.js'
import { requireMinRole, requireRole } from '../middleware/requireRole.js'
import { ROLES } from '../utils/roles.js'

const r = Router()
r.use(protect, requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF))
r.get('/', c.listReviews)
r.post('/', requireMinRole(ROLES.MANAGER), c.createReview)
r.patch('/:id', requireMinRole(ROLES.MANAGER), c.updateReview)
r.delete('/:id', requireMinRole(ROLES.ADMIN), c.deleteReview)

export default r
