import { Router } from 'express'
import * as c from '../controllers/settingsController.js'
import { protect } from '../middleware/auth.js'
import { requireMinRole } from '../middleware/requireRole.js'
import { ROLES } from '../utils/roles.js'

const r = Router()
r.use(protect)
r.get('/payment', requireMinRole(ROLES.ADMIN), c.getPaymentSettings)
r.patch('/payment', requireMinRole(ROLES.SUPER_ADMIN), c.updatePaymentSettings)
r.get('/app', requireMinRole(ROLES.MANAGER), c.listAppSettings)
r.post('/app', requireMinRole(ROLES.ADMIN), c.upsertAppSetting)

export default r
