import { formatCurrency } from './helpers.js'

/** Format whole rupee amounts (menu uses ₹ without decimals) */
export function formatRupee(n) {
  return formatCurrency(n, 'INR')
}

export function getItemUnitPrice(item, variant = 'regular') {
  const category = item?.category
  if (categoryHasDualPricing(category) && variant === 'variant') {
    return Number(item.priceVariant) ?? Number(item.price) ?? 0
  }
  return Number(item.price) || 0
}

export function buildOrderLineName(item, variant = 'regular') {
  const category = item?.category
  if (!categoryHasDualPricing(category)) return item.name
  if (variant === 'variant') return `${item.name} (${getVariantLabel(category)})`
  return `${item.name} (Regular)`
}

export function categoryHasDualPricing(category) {
  return Boolean(category?.dualPricing)
}

export function getVariantLabel(category) {
  return category?.variantLabel?.trim() || 'Extra Cheese'
}

export function formatMenuItemPrice(item, category) {
  if (categoryHasDualPricing(category) && item.priceVariant != null && item.priceVariant !== '') {
    return `${formatRupee(item.price)} / ${formatRupee(item.priceVariant)}`
  }
  return formatRupee(item.price)
}
