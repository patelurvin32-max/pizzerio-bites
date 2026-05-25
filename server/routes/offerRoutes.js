import { Router } from 'express'
import * as c from '../controllers/offerController.js'
import { protect } from '../middleware/auth.js'
import { requireMinRole } from '../middleware/requireRole.js'
import { ROLES } from '../utils/roles.js'

const r = Router()
r.use(protect, requireMinRole(ROLES.MANAGER))
r.get('/', c.listOffers)
r.post('/', c.createOffer)
r.patch('/:id', c.updateOffer)
r.delete('/:id', requireMinRole(ROLES.ADMIN), c.deleteOffer)

export default r
