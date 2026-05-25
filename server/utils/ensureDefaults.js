import Category from '../models/Category.js'
import MenuItem from '../models/MenuItem.js'
import { PIZZERIO_CATEGORIES, PIZZERIO_MENU_ITEMS } from '../data/pizzerio-menu.js'

export async function ensureDefaultCategories() {
  for (const c of PIZZERIO_CATEGORIES) {
    await Category.updateOne({ slug: c.slug }, { $set: { ...c, active: true } }, { upsert: true })
  }
  return Category.countDocuments()
}

export async function ensureDefaultMenuItems() {
  let upserted = 0
  for (const item of PIZZERIO_MENU_ITEMS) {
    const category = await Category.findOne({ slug: item.categorySlug })
    if (!category) continue

    const { categorySlug, priceVariant, ...rest } = item
    const doc = {
      ...rest,
      category: category._id,
      available: true,
      description: '',
      featured: false,
      tags: [],
      image: '',
    }
    if (category.dualPricing && priceVariant != null) {
      doc.priceVariant = priceVariant
    }

    const result = await MenuItem.updateOne({ slug: item.slug }, { $set: doc }, { upsert: true })
    if (result.upsertedCount > 0 || result.modifiedCount > 0) upserted += 1
  }
  return { total: await MenuItem.countDocuments(), upserted }
}
