import InventoryItem from '../models/InventoryItem.js'
import InventoryTransaction from '../models/InventoryTransaction.js'
import InventoryClosing from '../models/InventoryClosing.js'
import Notification from '../models/Notification.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { pick, INVENTORY_FIELDS } from '../utils/pick.js'

export function dateKey(date = new Date()) {
  return new Date(date).toISOString().slice(0, 10)
}

function dayRange(date = new Date()) {
  const key = dateKey(date)
  return { start: new Date(`${key}T00:00:00.000Z`), end: new Date(`${key}T23:59:59.999Z`), key }
}

function toBase(quantity, unit) {
  const n = Number(quantity) || 0
  if (unit === 'KG') return { quantity: n * 1000, family: 'weight' }
  if (unit === 'GM') return { quantity: n, family: 'weight' }
  if (unit === 'LTR') return { quantity: n * 1000, family: 'volume' }
  if (unit === 'ML') return { quantity: n, family: 'volume' }
  return { quantity: n, family: 'count' }
}

function fromBase(quantity, unit) {
  if (unit === 'KG' || unit === 'LTR') return quantity / 1000
  return quantity
}

function normalizeDelta(quantity, fromUnit, itemUnit) {
  const source = toBase(quantity, fromUnit)
  const target = toBase(1, itemUnit)
  if (source.family !== target.family) {
    throw new Error(`Unit mismatch: ${fromUnit} cannot be applied to ${itemUnit}`)
  }
  return fromBase(source.quantity, itemUnit)
}

async function assertOpen(date) {
  const closed = await InventoryClosing.findOne({ dateKey: dateKey(date) }).lean()
  if (closed) {
    const err = new Error(`Inventory is closed for ${closed.dateKey}`)
    err.statusCode = 409
    throw err
  }
}

async function notifyLowStock(item) {
  if (item.quantity <= item.minStock) {
    await Notification.create({
      title: 'Low stock alert',
      body: `${item.name} is at or below minimum (${item.quantity} ${item.unit})`,
      type: 'inventory',
      meta: { sku: item.sku, itemId: item._id },
    })
  }
}

async function moveStock({ itemId, type, quantity, unit, date = new Date(), meta = {} }) {
  await assertOpen(date)
  const item = await InventoryItem.findById(itemId)
  if (!item) {
    const err = new Error('Inventory item not found')
    err.statusCode = 404
    throw err
  }

  const delta = normalizeDelta(quantity, unit, item.unit)
  const nextQty = type === 'stock_in' ? item.quantity + delta : item.quantity - delta
  if (nextQty < -0.000001) {
    const err = new Error(`Insufficient stock for ${item.name}`)
    err.statusCode = 400
    throw err
  }

  item.quantity = Math.max(0, Number(nextQty.toFixed(4)))
  if (type === 'stock_in') {
    item.lastRestocked = date
    if (meta.purchasePrice !== undefined) item.purchasePrice = Number(meta.purchasePrice) || item.purchasePrice || 0
    if (meta.supplierName) item.supplier = meta.supplierName
  }
  await item.save()

  const tx = await InventoryTransaction.create({
    item: item._id,
    productName: item.name,
    type,
    quantity: Number(quantity),
    unit,
    date,
    ...meta,
  })

  await notifyLowStock(item)
  return { item, transaction: tx }
}

export async function deductInventoryForOrder(lines, orderId = null) {
  await assertOpen(new Date())
  const menuItemIds = lines.map((line) => line.menuItem).filter(Boolean)
  if (!menuItemIds.length) return []

  const MenuItem = (await import('../models/MenuItem.js')).default
  const menuItems = await MenuItem.find({ _id: { $in: menuItemIds } }).populate('recipe.inventoryItem').lean()
  const byId = new Map(menuItems.map((item) => [String(item._id), item]))
  const required = new Map()

  for (const line of lines) {
    const menuItem = byId.get(String(line.menuItem))
    if (!menuItem?.recipe?.length) continue
    for (const ing of menuItem.recipe) {
      const inventoryItem = ing.inventoryItem
      if (!inventoryItem) continue
      const key = String(inventoryItem._id)
      const quantity = normalizeDelta((Number(ing.quantity) || 0) * line.quantity, ing.unit, inventoryItem.unit)
      const prev = required.get(key) || { item: inventoryItem, quantity: 0, menuItem: menuItem._id }
      prev.quantity += quantity
      required.set(key, prev)
    }
  }

  const shortages = []
  for (const req of required.values()) {
    if (req.item.quantity < req.quantity) {
      shortages.push(`${req.item.name}: need ${Number(req.quantity.toFixed(3))} ${req.item.unit}, have ${req.item.quantity} ${req.item.unit}`)
    }
  }
  if (shortages.length) {
    const err = new Error(`Insufficient inventory: ${shortages.join('; ')}`)
    err.statusCode = 400
    throw err
  }

  const transactions = []
  for (const req of required.values()) {
    const result = await moveStock({
      itemId: req.item._id,
      type: 'order_deduction',
      quantity: req.quantity,
      unit: req.item.unit,
      meta: {
        reason: 'Order recipe deduction',
        department: 'Kitchen',
        order: orderId,
        menuItem: req.menuItem,
      },
    })
    transactions.push(result.transaction)
  }
  return transactions
}

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
  if (item.quantity <= item.minStock && (!prev || prev.quantity > prev.minStock)) await notifyLowStock(item)
  res.json(item)
})

export const deleteInventory = asyncHandler(async (req, res) => {
  await InventoryItem.findByIdAndDelete(req.params.id)
  res.json({ message: 'Deleted' })
})

export const dashboard = asyncHandler(async (_req, res) => {
  const { start, end } = dayRange()
  const [items, todayTransactions, closing] = await Promise.all([
    InventoryItem.find().lean(),
    InventoryTransaction.find({ date: { $gte: start, $lte: end } }).lean(),
    InventoryClosing.findOne({ dateKey: dateKey() }).lean(),
  ])
  const expiredCutoff = new Date()
  const nearExpiryCutoff = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const totals = todayTransactions.reduce(
    (acc, tx) => {
      if (tx.type === 'stock_in') acc.stockIn += tx.quantity
      if (tx.type === 'stock_out' || tx.type === 'order_deduction') acc.stockOut += tx.quantity
      if (tx.type === 'waste') acc.waste += tx.quantity
      return acc
    },
    { stockIn: 0, stockOut: 0, waste: 0 }
  )

  res.json({
    metrics: {
      totalProducts: items.length,
      lowStockItems: items.filter((it) => it.quantity <= it.minStock).length,
      outOfStockItems: items.filter((it) => it.quantity <= 0).length,
      expiredItems: items.filter((it) => it.expiryDate && new Date(it.expiryDate) < expiredCutoff).length,
      todayStockIn: totals.stockIn,
      todayStockOut: totals.stockOut,
      wasteItemsToday: totals.waste,
      currentInventoryValue: items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.purchasePrice) || 0), 0),
    },
    lowStock: items.filter((it) => it.quantity <= it.minStock),
    nearExpiry: items.filter((it) => it.expiryDate && new Date(it.expiryDate) <= nearExpiryCutoff),
    todayTransactions,
    closedToday: Boolean(closing),
    closing,
  })
})

export const listTransactions = asyncHandler(async (req, res) => {
  const filter = {}
  if (req.query.type) filter.type = req.query.type
  if (req.query.date) {
    const { start, end } = dayRange(req.query.date)
    filter.date = { $gte: start, $lte: end }
  }
  const items = await InventoryTransaction.find(filter).sort({ date: -1, createdAt: -1 }).limit(500).lean()
  res.json({ items })
})

export const stockIn = asyncHandler(async (req, res) => {
  const { productId, quantity, unit, purchasePrice, supplierName, invoiceNumber, date, notes } = req.body
  const result = await moveStock({
    itemId: productId,
    type: 'stock_in',
    quantity,
    unit,
    date: date ? new Date(date) : new Date(),
    meta: { purchasePrice: Number(purchasePrice) || 0, supplierName, invoiceNumber, notes },
  })
  res.status(201).json(result)
})

export const stockOut = asyncHandler(async (req, res) => {
  const { productId, quantity, unit, reason, department, date, approvedBy } = req.body
  const result = await moveStock({
    itemId: productId,
    type: 'stock_out',
    quantity,
    unit,
    date: date ? new Date(date) : new Date(),
    meta: { reason, department, approvedBy },
  })
  res.status(201).json(result)
})

export const waste = asyncHandler(async (req, res) => {
  const { productId, quantity, unit, reason, date, staffName } = req.body
  const result = await moveStock({
    itemId: productId,
    type: 'waste',
    quantity,
    unit,
    date: date ? new Date(date) : new Date(),
    meta: { reason, staffName },
  })
  res.status(201).json(result)
})

export const removeExpired = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findById(req.params.id)
  if (!item) return res.status(404).json({ message: 'Not found' })
  const result = await moveStock({
    itemId: item._id,
    type: 'expired_removal',
    quantity: item.quantity,
    unit: item.unit,
    meta: { reason: 'Expired stock removed' },
  })
  res.status(201).json(result)
})

async function buildClosingPreview(date) {
  const { start, end, key } = dayRange(date || new Date())
  const [items, transactions, closing] = await Promise.all([
    InventoryItem.find().sort({ name: 1 }).lean(),
    InventoryTransaction.find({ date: { $gte: start, $lte: end } }).lean(),
    InventoryClosing.findOne({ dateKey: key }).lean(),
  ])
  const totals = transactions.reduce(
    (acc, tx) => {
      if (tx.type === 'stock_in') acc.totalStockIn += tx.quantity
      if (tx.type === 'stock_out' || tx.type === 'order_deduction') acc.totalStockOut += tx.quantity
      if (tx.type === 'waste') acc.totalWaste += tx.quantity
      return acc
    },
    { totalStockIn: 0, totalStockOut: 0, totalWaste: 0 }
  )
  const lines = items.map((item) => ({
    item: item._id,
    name: item.name,
    unit: item.unit,
    finalStock: item.quantity,
    value: (Number(item.quantity) || 0) * (Number(item.purchasePrice) || 0),
  }))
  return {
    dateKey: key,
    ...totals,
    finalStock: items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    inventoryValue: lines.reduce((sum, line) => sum + line.value, 0),
    lines,
    closed: closing,
  }
}

export const closingPreview = asyncHandler(async (req, res) => {
  res.json(await buildClosingPreview(req.query.date || new Date()))
})

export const closeDailyStock = asyncHandler(async (req, res) => {
  const { date, notes, closedBy, confirmed } = req.body
  if (!confirmed) return res.status(400).json({ message: 'Confirm daily closing before locking inventory' })
  if (!closedBy?.trim()) return res.status(400).json({ message: 'Closed by is required' })
  const payload = await buildClosingPreview(date || new Date())
  if (payload.closed) return res.status(409).json({ message: `Inventory already closed for ${payload.dateKey}` })
  const closing = await InventoryClosing.create({
    dateKey: payload.dateKey,
    date: new Date(payload.dateKey),
    totalStockIn: payload.totalStockIn,
    totalStockOut: payload.totalStockOut,
    totalWaste: payload.totalWaste,
    finalStock: payload.finalStock,
    inventoryValue: payload.inventoryValue,
    notes: notes?.trim() || '',
    closedBy: closedBy.trim(),
    confirmed: true,
    lines: payload.lines,
  })
  res.status(201).json(closing)
})

export const reports = asyncHandler(async (req, res) => {
  const { start, end } = dayRange(req.query.date || new Date())
  const [transactions, closings, items] = await Promise.all([
    InventoryTransaction.find({ date: { $gte: start, $lte: end } }).sort({ date: -1 }).lean(),
    InventoryClosing.find({ date: { $gte: start, $lte: end } }).sort({ date: -1 }).lean(),
    InventoryItem.find().sort({ name: 1 }).lean(),
  ])
  res.json({
    stockIn: transactions.filter((tx) => tx.type === 'stock_in'),
    stockOut: transactions.filter((tx) => tx.type === 'stock_out' || tx.type === 'order_deduction'),
    waste: transactions.filter((tx) => tx.type === 'waste'),
    summary: items,
    closing: closings,
  })
})
