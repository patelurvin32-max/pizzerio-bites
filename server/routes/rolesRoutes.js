import { Router } from 'express'
import { ROLES, ROLE_ORDER } from '../utils/roles.js'
import { protect } from '../middleware/auth.js'

const r = Router()

const PERMISSIONS = {
  dashboard: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF, ROLES.RECEPTION, ROLES.DELIVERY_STAFF],
  orders: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF, ROLES.RECEPTION, ROLES.DELIVERY_STAFF],
  reservations: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF],
  menu: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER],
  categories: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER],
  offers: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER],
  gallery: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF],
  reviews: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF],
  messages: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.STAFF],
  users: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  staff: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER],
  analytics: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER],
  cms: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER],
  inventory: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTION],
  payments: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  settings: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER],
}

r.get('/me', protect, (req, res) => {
  const role = req.user.role
  const allowed = {}
  for (const [key, roles] of Object.entries(PERMISSIONS)) {
    allowed[key] = roles.includes(role)
  }
  res.json({
    role,
    hierarchy: ROLE_ORDER,
    permissions: allowed,
  })
})

export default r
