import {
  FiActivity,
  FiBarChart2,
  FiCoffee,
  FiImage,
  FiLayers,
  FiLayout,
  FiMail,
  FiPackage,
  FiPercent,
  FiSettings,
  FiShoppingBag,
  FiStar,
  FiUsers,
  FiUserCheck,
  FiCalendar,
} from 'react-icons/fi'

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
  RECEPTION: 'RECEPTION',
  DELIVERY_STAFF: 'DELIVERY_STAFF',
}

/** Higher index = more privilege (matches server ROLE_ORDER). */
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

/** Roles the current user may assign when creating/editing users. */
export function assignableRoles(actorRole) {
  const max = roleIndex(actorRole)
  if (max < 0) return []
  return ROLE_ORDER.filter((r) => roleIndex(r) <= max)
}

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.STAFF]: 'Staff',
  [ROLES.RECEPTION]: 'Reception',
  [ROLES.DELIVERY_STAFF]: 'Delivery Staff',
}

export function formatRoleLabel(role) {
  return ROLE_LABELS[role] || String(role || '').replaceAll('_', ' ')
}

/** Roles that can create orders from the admin console */
export const ORDER_CREATE_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.RECEPTION,
]

export function canCreateOrder(role) {
  return ORDER_CREATE_ROLES.includes(role)
}

/** Roles that can add reservations from the admin console */
export const RESERVATION_CREATE_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.MANAGER,
  ROLES.RECEPTION,
]

export function canCreateReservation(role) {
  return RESERVATION_CREATE_ROLES.includes(role)
}

export const TABLE_TYPES = [
  { value: 'window', label: 'Window lounge' },
  { value: 'booth', label: 'Neon booth' },
  { value: 'bar', label: 'Chef counter' },
  { value: 'private', label: 'Private pod' },
]

export const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10]

export const RESERVATION_TIME_SLOTS = [
  { value: '11:30', label: '11:30 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '12:30', label: '12:30 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '13:30', label: '1:30 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '17:30', label: '5:30 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '18:30', label: '6:30 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '19:30', label: '7:30 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '20:30', label: '8:30 PM' },
  { value: '21:00', label: '9:00 PM' },
  { value: '21:30', label: '9:30 PM' },
  { value: '22:00', label: '10:00 PM' },
  { value: '22:30', label: '10:30 PM' },
  { value: '23:00', label: '11:00 PM' },
]

const all = Object.values(ROLES)
const mgmt = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER]
const mgmtReception = [...mgmt, ROLES.RECEPTION]
const adminUp = [ROLES.SUPER_ADMIN, ROLES.ADMIN]
const staffContent = all.filter((r) => ![ROLES.DELIVERY_STAFF, ROLES.RECEPTION].includes(r))

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: FiActivity, minRoles: all },
  { to: '/dashboard/orders', label: 'Orders', icon: FiShoppingBag, minRoles: all },
  { to: '/dashboard/reservations', label: 'Reservations', icon: FiCalendar, minRoles: staffContent },
  { to: '/dashboard/menu', label: 'Menu', icon: FiCoffee, minRoles: mgmt },
  { to: '/dashboard/categories', label: 'Categories', icon: FiLayers, minRoles: mgmt },
  { to: '/dashboard/offers', label: 'Offers', icon: FiPercent, minRoles: mgmt },
  { to: '/dashboard/gallery', label: 'Gallery', icon: FiImage, minRoles: staffContent },
  { to: '/dashboard/reviews', label: 'Reviews', icon: FiStar, minRoles: staffContent },
  { to: '/dashboard/messages', label: 'Messages', icon: FiMail, minRoles: staffContent },
  { to: '/dashboard/users', label: 'Users', icon: FiUsers, minRoles: adminUp },
  { to: '/dashboard/staff', label: 'Staff', icon: FiUserCheck, minRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER] },
  { to: '/dashboard/inventory', label: 'Inventory', icon: FiPackage, minRoles: mgmtReception },
  { to: '/dashboard/analytics', label: 'Analytics', icon: FiBarChart2, minRoles: mgmt },
  { to: '/dashboard/cms', label: 'CMS', icon: FiLayout, minRoles: mgmt },
  { to: '/dashboard/settings', label: 'Settings', icon: FiSettings, minRoles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER] },
]

export function canAccessNav(role, minRoles) {
  return minRoles.includes(role)
}

export const ORDER_STATUS_OPTIONS = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'completed',
  'cancelled',
]

export const PAYMENT_STATUS_OPTIONS = ['unpaid', 'paid', 'refunded', 'failed']

export const RESERVATION_STATUS_OPTIONS = ['pending', 'approved', 'declined', 'completed', 'no_show']
