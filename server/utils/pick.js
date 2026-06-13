/** Return a shallow copy with only allowed keys (undefined values omitted). */
export function pick(source, keys) {
  if (!source || typeof source !== 'object') return {}
  const out = {}
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
      out[key] = source[key]
    }
  }
  return out
}

export const CATEGORY_FIELDS = ['name', 'slug', 'description', 'sortOrder', 'active', 'dualPricing', 'variantLabel']
export const MENU_ITEM_FIELDS = ['name', 'slug', 'description', 'price', 'priceVariant', 'category', 'available', 'featured', 'tags', 'recipe']
export const ORDER_UPDATE_FIELDS = [
  'customerName',
  'customerEmail',
  'customerPhone',
  'items',
  'notes',
  'deliveryAddress',
  'status',
  'paymentStatus',
  'paymentMethod',
  'assignedStaff',
]
export const RESERVATION_UPDATE_FIELDS = [
  'customerName',
  'customerEmail',
  'customerPhone',
  'partySize',
  'date',
  'timeSlot',
  'tableLabel',
  'status',
  'notes',
]
export const GALLERY_FIELDS = ['title', 'imageUrl', 'sortOrder', 'featured']
export const OFFER_FIELDS = ['title', 'description', 'code', 'discountType', 'discountValue', 'active', 'startsAt', 'endsAt']
export const REVIEW_FIELDS = ['authorName', 'authorTitle', 'rating', 'body', 'featured', 'visible']
export const STAFF_FIELDS = ['userId', 'name', 'email', 'phone', 'department', 'role', 'salary', 'shifts', 'performanceScore', 'status', 'permissions']
export const STAFF_ATTENDANCE_FIELDS = ['date', 'status', 'note']
export const INVENTORY_FIELDS = ['sku', 'name', 'category', 'quantity', 'minStock', 'unit', 'supplier', 'expiryDate', 'purchasePrice', 'lastRestocked']
export const MESSAGE_UPDATE_FIELDS = ['read']
export const NOTIFICATION_CREATE_FIELDS = ['title', 'body', 'type', 'meta', 'userId']
export const PAYMENT_SETTINGS_FIELDS = ['provider', 'publishableKey', 'secretKey', 'webhookSecret', 'currency', 'taxRatePercent']
export const USER_CREATE_FIELDS = ['name', 'email', 'password', 'role', 'status', 'phone']
export const USER_UPDATE_FIELDS = ['name', 'role', 'status', 'phone', 'password', 'avatar']
