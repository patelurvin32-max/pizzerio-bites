import { Router } from 'express'
import * as c from '../controllers/menuController.js'
import { protect } from '../middleware/auth.js'
import { requireMinRole } from '../middleware/requireRole.js'
import { publicReadLimiter } from '../middleware/rateLimiter.js'
import { ROLES } from '../utils/roles.js'

const r = Router()

r.get('/public/categories', publicReadLimiter, c.listPublicCategories)
r.get('/public/items', publicReadLimiter, c.listPublicItems)

r.use(protect)

r.get('/categories', requireMinRole(ROLES.MANAGER), c.listCategories)
r.post('/categories', requireMinRole(ROLES.MANAGER), c.createCategory)
r.patch('/categories/:id', requireMinRole(ROLES.MANAGER), c.updateCategory)
r.delete('/categories/:id', requireMinRole(ROLES.ADMIN), c.deleteCategory)

r.get('/items', requireMinRole(ROLES.STAFF), c.listMenuItems)
r.post('/items', requireMinRole(ROLES.MANAGER), c.createMenuItem)
r.patch('/items/:id', requireMinRole(ROLES.MANAGER), c.updateMenuItem)
r.delete('/items/:id', requireMinRole(ROLES.ADMIN), c.deleteMenuItem)

export default r
