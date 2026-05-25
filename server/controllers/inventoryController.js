import InventoryItem from '../models/InventoryItem.js'
import Notification from '../models/Notification.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { pick, INVENTORY_FIELDS } from '../utils/pick.js'

export const listInventory = asyncHandler(async (_req, res) => {
  const items = await InventoryItem.find().sort({ name: 1 }).lean()
  res.json({ items })
})

export const createInventory = asyncHandler(async (req, res) => {
  const item = await InventoryItem.create(pick(req.body, INVENTORY_FIELDS))
  res.status(201).json(item)
})

export const updateInventory = asyncHandler(async (req, res) => {
  const prev = await InventoryItem.findById(req.params.id)
  const item = await InventoryItem.findByIdAndUpdate(req.params.id, pick(req.body, INVENTORY_FIELDS), {
    new: true,
    runValidators: true,
  })
  if (!item) return res.status(404).json({ message: 'Not found' })
  if (item.quantity <= item.minStock && (!prev || prev.quantity > prev.minStock)) {
    await Notification.create({
      title: 'Low stock alert',
      body: `${item.name} is at or below minimum (${item.quantity} ${item.unit})`,
      type: 'inventory',
      meta: { sku: item.sku },
    })
  }
  res.json(item)
})

export const deleteInventory = asyncHandler(async (req, res) => {
  await InventoryItem.findByIdAndDelete(req.params.id)
  res.json({ message: 'Deleted' })
})
