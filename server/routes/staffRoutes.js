import { Router } from 'express'
import * as c from '../controllers/staffController.js'
import { protect } from '../middleware/auth.js'
import { requireMinRole } from '../middleware/requireRole.js'
import { ROLES } from '../utils/roles.js'

const r = Router()
r.use(protect, requireMinRole(ROLES.MANAGER))
r.get('/', c.listStaff)
r.post('/', c.createStaff)
r.patch('/:id', c.updateStaff)
r.post('/:id/attendance', c.addAttendance)
r.delete('/:id', requireMinRole(ROLES.ADMIN), c.deleteStaff)

export default r
