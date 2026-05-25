import { Router } from 'express'
import * as c from '../controllers/userController.js'
import { protect } from '../middleware/auth.js'
import { requireMinRole } from '../middleware/requireRole.js'
import { ROLES } from '../utils/roles.js'

const r = Router()

r.use(protect)
r.get('/', requireMinRole(ROLES.MANAGER), c.listUsers)
r.get('/:id', requireMinRole(ROLES.MANAGER), c.getUser)
r.post('/', requireMinRole(ROLES.ADMIN), c.createUser)
r.patch('/:id', requireMinRole(ROLES.ADMIN), c.updateUser)
r.delete('/:id', requireMinRole(ROLES.ADMIN), c.deleteUser)

export default r
