import Category from '../models/Category.js'
import MenuItem from '../models/MenuItem.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { pick, CATEGORY_FIELDS, MENU_ITEM_FIELDS } from '../utils/pick.js'
import { searchRegex } from '../utils/escapeRegex.js'

export const listCategories = asyncHandler(async (_req, res) => {
  const items = await Category.find().sort({ sortOrder: 1, name: 1 }).lean()
  res.json({ items })
})

export const listPublicCategories = asyncHandler(async (_req, res) => {
  const items = await Category.find({ active: true }).sort({ sortOrder: 1, name: 1 }).lean()
  res.json({ items })
})

export const listPublicItems = asyncHandler(async (req, res) => {
  const filter = { available: true }
  if (req.query.category) {
    const cat = await Category.findOne({ slug: req.query.category, active: true }).select('_id').lean()
    if (cat) filter.category = cat._id
  }
  if (req.query.featured === 'true') filter.featured = true
  if (req.query.tag) filter.tags = req.query.tag

  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10))
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    MenuItem.find(filter)
      .populate('category')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MenuItem.countDocuments(filter)
  ])

  res.json({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
})

export const createCategory = asyncHandler(async (req, res) => {
  const cat = await Category.create(pick(req.body, CATEGORY_FIELDS))
  res.status(201).json(cat)
})

export const updateCategory = asyncHandler(async (req, res) => {
  const cat = await Category.findByIdAndUpdate(req.params.id, pick(req.body, CATEGORY_FIELDS), {
    new: true,
    runValidators: true,
  })
  if (!cat) return res.status(404).json({ message: 'Not found' })
  res.json(cat)
})

export const deleteCategory = asyncHandler(async (req, res) => {
  const inUse = await MenuItem.exists({ category: req.params.id })
  if (inUse) return res.status(400).json({ message: 'Category has menu items' })
  await Category.findByIdAndDelete(req.params.id)
  res.json({ message: 'Deleted' })
})

export const listMenuItems = asyncHandler(async (req, res) => {
  const filter = {}
  if (req.query.category) filter.category = req.query.category
  const regex = searchRegex(req.query.search)
  if (regex) {
    filter.$or = [{ name: regex }, { description: regex }]
  }

  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10))
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    MenuItem.find(filter)
      .populate('category')
      .populate('recipe.inventoryItem')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MenuItem.countDocuments(filter)
  ])

  res.json({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  })
})

export const createMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.create(pick(req.body, MENU_ITEM_FIELDS))
  const populated = await item.populate('category')
  res.status(201).json(populated)
})

export const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, pick(req.body, MENU_ITEM_FIELDS), {
    new: true,
    runValidators: true,
  }).populate('category')
  if (!item) return res.status(404).json({ message: 'Not found' })
  res.json(item)
})

export const deleteMenuItem = asyncHandler(async (req, res) => {
  await MenuItem.findByIdAndDelete(req.params.id)
  res.json({ message: 'Deleted' })
})
