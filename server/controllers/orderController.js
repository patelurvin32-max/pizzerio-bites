import Order from '../models/Order.js'
import Notification from '../models/Notification.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { pick, ORDER_UPDATE_FIELDS } from '../utils/pick.js'

async function notifyOrder(order, title) {
  await Notification.create({
    title,
    body: `Order ${order.orderNumber} — ${order.customerName}`,
    type: 'order',
    meta: { orderId: order._id },
  })
}

export const listOrders = asyncHandler(async (req, res) => {
  const status = req.query.status
  const filter = {}
  if (status) filter.status = status
  const items = await Order.find(filter).sort({ createdAt: -1 }).limit(200).lean()
  res.json({ items })
})

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).lean()
  if (!order) return res.status(404).json({ message: 'Not found' })
  res.json(order)
})

export const createOrder = asyncHandler(async (req, res) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    items,
    notes,
    deliveryAddress,
    status,
    paymentStatus,
    paymentMethod,
    taxRatePercent,
  } = req.body

  if (!customerName?.trim()) {
    return res.status(400).json({ message: 'Customer name is required' })
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Add at least one menu item' })
  }

  const lines = []
  for (const item of items) {
    const quantity = Math.max(1, Number(item.quantity) || 1)
    const unitPrice = Math.max(0, Number(item.unitPrice) || 0)
    const name = String(item.name || '').trim()
    if (!name) {
      return res.status(400).json({ message: 'Each line needs an item name' })
    }
    lines.push({
      menuItem: item.menuItem || undefined,
      name,
      quantity,
      unitPrice,
    })
  }

  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0)
  const taxRate = Math.max(0, Number(taxRatePercent) || 0)
  const tax = Math.round(subtotal * taxRate) / 100
  const total = subtotal + tax

  const order = await Order.create({
    customerName: customerName.trim(),
    customerEmail: customerEmail?.trim() || '',
    customerPhone: customerPhone?.trim() || '',
    items: lines,
    subtotal,
    tax,
    total,
    notes: notes?.trim() || '',
    deliveryAddress: deliveryAddress?.trim() || '',
    status: status || 'pending',
    paymentStatus: paymentStatus || 'unpaid',
    paymentMethod: paymentMethod || 'card',
  })

  await notifyOrder(order, 'New order received')
  res.status(201).json(order)
})

export const updateOrder = asyncHandler(async (req, res) => {
  const prev = await Order.findById(req.params.id)
  if (!prev) return res.status(404).json({ message: 'Not found' })
  const payload = pick(req.body, ORDER_UPDATE_FIELDS)
  const order = await Order.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true })
  if (payload.status && payload.status !== prev.status) {
    await notifyOrder(order, `Order ${order.orderNumber} status: ${order.status}`)
  }
  res.json(order)
})

export const deleteOrder = asyncHandler(async (req, res) => {
  await Order.findByIdAndDelete(req.params.id)
  res.json({ message: 'Deleted' })
})

export const invoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).lean()
  if (!order) return res.status(404).json({ message: 'Not found' })
  res.json({
    invoiceNumber: order.orderNumber,
    issuedAt: new Date().toISOString(),
    order,
  })
})
