import { Router } from 'express'
import * as c from '../controllers/inventoryController.js'
import { protect } from '../middleware/auth.js'
import { requireMinRole, requireRole } from '../middleware/requireRole.js'
import { ROLES } from '../utils/roles.js'

const r = Router()
r.use(protect, requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION))
r.get('/', c.listInventory)
r.post('/', c.createInventory)
r.patch('/:id', c.updateInventory)
r.delete('/:id', requireMinRole(ROLES.ADMIN), c.deleteInventory)

export default r
