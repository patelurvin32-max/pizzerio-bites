import { hasAtLeast } from '../utils/roles.js'

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' })
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden for this role' })
    }
    next()
  }
}

/** Minimum role on hierarchy (e.g. MANAGER allows MANAGER+ADMIN+SUPER) */
export function requireMinRole(minRole) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authorized' })
    if (!hasAtLeast(req.user.role, minRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' })
    }
    next()
  }
}
