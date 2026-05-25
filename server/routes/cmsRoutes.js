import { Router } from 'express'
import * as c from '../controllers/cmsController.js'
import { protect } from '../middleware/auth.js'
import { requireMinRole } from '../middleware/requireRole.js'
import { ROLES } from '../utils/roles.js'

const r = Router()
r.use(protect, requireMinRole(ROLES.MANAGER))
r.get('/', c.listCms)
r.get('/key/:key', c.getCmsByKey)
r.post('/', c.upsertCms)
r.delete('/key/:key', requireMinRole(ROLES.ADMIN), c.deleteCms)

export default r
