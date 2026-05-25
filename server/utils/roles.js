export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  RECEPTION: 'RECEPTION',
  DELIVERY_STAFF: 'DELIVERY_STAFF',
}

/** Higher index = more privilege for hierarchy checks */
export const ROLE_ORDER = [
  ROLES.DELIVERY_STAFF,
  ROLES.STAFF,
  ROLES.RECEPTION,
  ROLES.MANAGER,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
]

export function roleIndex(role) {
  const i = ROLE_ORDER.indexOf(role)
  return i === -1 ? -1 : i
}

export function hasAtLeast(userRole, minRole) {
  return roleIndex(userRole) >= roleIndex(minRole)
}
