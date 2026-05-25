import { roleIndex } from './roles.js'

/** True if assigner may set or manage a user with targetRole. */
export function canAssignRole(assignerRole, targetRole) {
  const a = roleIndex(assignerRole)
  const t = roleIndex(targetRole)
  if (a < 0 || t < 0) return false
  return a >= t
}

export function assertCanAssignRole(assignerRole, targetRole) {
  if (!canAssignRole(assignerRole, targetRole)) {
    const err = new Error('Cannot assign a role above your own privilege level')
    err.statusCode = 403
    throw err
  }
}
