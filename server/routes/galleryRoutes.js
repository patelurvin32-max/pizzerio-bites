import { Router } from 'express'
import * as c from '../controllers/galleryController.js'
import { protect } from '../middleware/auth.js'
import { requireMinRole } from '../middleware/requireRole.js'
import { ROLES } from '../utils/roles.js'

const r = Router()
r.use(protect, requireMinRole(ROLES.STAFF))
r.get('/', c.listGallery)
r.post('/', requireMinRole(ROLES.MANAGER), c.createGallery)
r.patch('/:id', requireMinRole(ROLES.MANAGER), c.updateGallery)
r.delete('/:id', requireMinRole(ROLES.ADMIN), c.deleteGallery)

export default r
