export const INVOICE_LAYOUT_KEY = 'invoiceLayout'

export const FONT_OPTIONS = [
  { value: 'Courier New, monospace', label: 'Courier New' },
  { value: 'Raleway, sans-serif', label: 'Raleway' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
]

export const FONT_SIZE_MAP = {
  small: 9,
  medium: 10,
  large: 12,
}

const HEADER_FIELD_DEFS = [
  { id: 'logo', label: 'Business Logo', enabled: true, hasContent: false },
  { id: 'businessName', label: 'Business Name', enabled: true, hasContent: true, content: '' },
  { id: 'addressLine1', label: 'Address Line 1', enabled: true, hasContent: true, content: '' },
  { id: 'addressLine2', label: 'Address Line 2', enabled: false, hasContent: true, content: '' },
  { id: 'cityStateZip', label: 'City, State, ZIP Code', enabled: false, hasContent: true, content: '' },
  { id: 'country', label: 'Country', enabled: false, hasContent: true, content: '' },
  { id: 'phone', label: 'Phone Number', enabled: true, hasContent: true, content: '' },
  { id: 'email', label: 'Email Address', enabled: false, hasContent: true, content: '' },
  { id: 'taxNumber', label: 'Tax Number (GST/VAT)', enabled: true, hasContent: true, content: '' },
  { id: 'invoiceTitle', label: 'Invoice Title', enabled: true, hasContent: true, content: 'TAX INVOICE' },
]

const FOOTER_FIELD_DEFS = [
  { id: 'thankYouMessage', label: 'Thank You Message', enabled: true, hasContent: true, content: 'Thank You! Visit Again 🍕', fontSize: 'small', bold: false, underline: false },
  { id: 'termsConditions', label: 'Terms & Conditions', enabled: false, hasContent: true, content: '', fontSize: 'small', bold: false, underline: false },
  { id: 'notes', label: 'Notes', enabled: false, hasContent: true, content: '', fontSize: 'small', bold: false, underline: false },
  { id: 'paymentInstructions', label: 'Payment Instructions', enabled: false, hasContent: true, content: '', fontSize: 'small', bold: false, underline: false },
  { id: 'bankDetails', label: 'Bank Details', enabled: false, hasContent: true, content: '', fontSize: 'small', bold: false, underline: false },
  { id: 'qrCode', label: 'QR Code', enabled: false, hasContent: false, content: '', fontSize: 'small', bold: false, underline: false },
  { id: 'signature', label: 'Signature', enabled: false, hasContent: true, content: 'Authorized Signature', fontSize: 'small', bold: false, underline: false },
  { id: 'footerText', label: 'Footer Text', enabled: false, hasContent: true, content: '', fontSize: 'small', bold: false, underline: false },
  { id: 'socialMedia', label: 'Social Media Links', enabled: false, hasContent: true, content: '', fontSize: 'small', bold: false, underline: false },
]

function withOrder(defs) {
  return defs.map((field, order) => ({ ...field, order }))
}

export function createDefaultInvoiceLayout() {
  return {
    templateName: 'Pizzerio Bites',
    fontStyle: FONT_OPTIONS[0].value,
    header: { fields: withOrder(HEADER_FIELD_DEFS) },
    orderDetails: { fields: [] },
    footer: { fields: withOrder(FOOTER_FIELD_DEFS) },
  }
}

function mergeFieldList(defaults, saved = []) {
  const savedById = new Map((saved || []).map((f) => [f.id, f]))
  const merged = defaults.map((def, index) => {
    const row = savedById.get(def.id)
    if (!row) return { ...def, order: index }
    return {
      ...def,
      ...row,
      id: def.id,
      label: def.label,
      hasContent: def.hasContent,
      order: row.order ?? index,
    }
  })
  return merged.sort((a, b) => a.order - b.order).map((field, index) => ({ ...field, order: index }))
}

export function mergeInvoiceLayout(saved) {
  const defaults = createDefaultInvoiceLayout()
  if (!saved || typeof saved !== 'object') return defaults
  return {
    templateName: saved.templateName ?? defaults.templateName,
    fontStyle: saved.fontStyle ?? defaults.fontStyle,
    header: { fields: mergeFieldList(defaults.header.fields, saved.header?.fields) },
    orderDetails: { fields: saved.orderDetails?.fields ?? defaults.orderDetails.fields },
    footer: { fields: mergeFieldList(defaults.footer.fields, saved.footer?.fields) },
  }
}

export function getSortedEnabledFields(fields = []) {
  return [...fields]
    .filter((f) => f.enabled)
    .sort((a, b) => a.order - b.order)
}

export function resolveHeaderFieldValue(field, restaurant = {}) {
  if (field.content?.trim()) return field.content.trim()
  switch (field.id) {
    case 'businessName':
      return restaurant.name || ''
    case 'addressLine1':
      return restaurant.address || ''
    case 'phone':
      return restaurant.phone ? `Ph: ${restaurant.phone}` : ''
    case 'email':
      return restaurant.email || ''
    case 'taxNumber':
      return restaurant.gstin ? `GSTIN: ${restaurant.gstin}` : ''
    case 'invoiceTitle':
      return 'TAX INVOICE'
    default:
      return field.content || ''
  }
}

export function resolveFooterFieldValue(field, restaurant = {}) {
  if (field.content?.trim()) return field.content.trim()
  if (field.id === 'thankYouMessage') return restaurant.footerNote || 'Thank You! Visit Again 🍕'
  return field.content || ''
}

export function reorderFields(fields, fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return fields
  const next = [...fields].sort((a, b) => a.order - b.order)
  const [removed] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, removed)
  return next.map((field, index) => ({ ...field, order: index }))
}

export const SAMPLE_INVOICE_DATA = {
  invoiceNumber: '2026/00042',
  issuedAt: '2026-06-26T14:30:00.000Z',
  gstNote: 'Inclusive of GST',
  restaurant: {
    name: 'Pizzerio Bites',
    address: 'G-5, Welcome point, Varkund, Dadra and Nagar Haveli and Daman and Diu 396210',
    phone: '+91 96876 60072',
    email: 'hello@pizzerio.bites',
    gstin: '24ABCDE1234F1Z5',
    footerNote: 'Thank You! Visit Again 🍕',
  },
  order: {
    orderType: 'dine-in',
    customerName: 'Walk-in Customer',
    paymentMethod: 'cash',
    total: 48.95,
    createdAt: '2026-06-26T14:30:00.000Z',
    items: [
      {
        name: 'Margherita pizza',
        quantity: 1,
        unitPrice: 20.99,
        menuItem: { category: { name: 'Pizza', sortOrder: 0 } },
      },
      {
        name: 'Tomato Basil Soup',
        quantity: 1,
        unitPrice: 15.99,
        menuItem: { category: { name: 'Starter', sortOrder: 1 } },
      },
      {
        name: 'Coke',
        quantity: 3,
        unitPrice: 3.99,
        menuItem: { category: { name: 'Drinks', sortOrder: 2 } },
      },
    ],
  },
}
