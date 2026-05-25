import { Router } from 'express'
import * as c from '../controllers/inventoryController.js'
import { protect } from '../middleware/auth.js'
import { requireMinRole } from '../middleware/requireRole.js'
import { ROLES } from '../utils/roles.js'

const r = Router()
r.use(protect, requireMinRole(ROLES.MANAGER))
r.get('/', c.listInventory)
r.post('/', c.createInventory)
r.patch('/:id', c.updateInventory)
r.delete('/:id', requireMinRole(ROLES.ADMIN), c.deleteInventory)

export default r
