import { Router } from 'express'
import * as c from '../controllers/orderController.js'
import { protect } from '../middleware/auth.js'
import { requireMinRole } from '../middleware/requireRole.js'
import { ROLES } from '../utils/roles.js'

const r = Router()
r.use(protect)
r.get('/', requireMinRole(ROLES.STAFF), c.listOrders)
r.get('/:id', requireMinRole(ROLES.STAFF), c.getOrder)
r.get('/:id/invoice', requireMinRole(ROLES.STAFF), c.invoice)
r.post('/', requireMinRole(ROLES.RECEPTION), c.createOrder)
r.patch('/:id', requireMinRole(ROLES.STAFF), c.updateOrder)
r.delete('/:id', requireMinRole(ROLES.MANAGER), c.deleteOrder)

export default r
