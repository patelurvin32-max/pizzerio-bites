import Order from '../models/Order.js'
import Notification from '../models/Notification.js'
import AppSettings from '../models/AppSettings.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { pick, ORDER_UPDATE_FIELDS } from '../utils/pick.js'
import { deductInventoryForOrder } from './inventoryController.js'

async function notifyOrder(order, title) {
  await Notification.create({
    title,
    body: `Order ${order.orderNumber} — ${order.customerName}`,
    type: 'order',
    meta: { orderId: order._id },
  })
}

export const listOrders = asyncHandler(async (req, res) => {
  // Get pagination parameters from query
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20))
  
  // Get filter parameters
  const status = req.query.status
  const startDate = req.query.startDate ? new Date(req.query.startDate) : null
  const endDate = req.query.endDate ? new Date(req.query.endDate) : null
  
  // Build filter object
  const filter = {}
  if (status) filter.status = status
  if (startDate || endDate) {
    filter.createdAt = {}
    if (startDate) filter.createdAt.$gte = startDate
    if (endDate) filter.createdAt.$lte = endDate
  }
  
  // Fetch data and count in parallel for better performance
  const [items, total] = await Promise.all([
    Order.find(filter)
      .select('orderNumber customerName status total createdAt paymentStatus')  // Only needed fields
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ])
  
  // Return response with pagination metadata
  res.json({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    }
  })
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
  const safeCustomerName = customerName?.trim() || 'Walk-in Customer'

  const order = await Order.create({
    customerName: safeCustomerName,
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
    paymentMethod: paymentMethod || 'cash',
  })

  try {
    await deductInventoryForOrder(lines, order._id)
  } catch (error) {
    await Order.findByIdAndDelete(order._id)
    throw error
  }

  await notifyOrder(order, 'New order received')
  res.status(201).json(order)
})

export const updateOrder = asyncHandler(async (req, res) => {
  const prev = await Order.findById(req.params.id).select('status').lean()
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

  const restaurantSetting = await AppSettings.findOne({ key: 'restaurantInfo' }).lean()
  const restaurant = restaurantSetting?.value || {
    name: 'Pizzerio Bites',
    address: 'G-5, Welcome point, Varkund, Dadra and Nagar Haveli and Daman and Diu 396210',
    phone: '+91 96876 60072',
    email: '',
    gstin: '',
    footerNote: 'Thank You! Visit Again 🍕',
  }

  res.json({
    invoiceNumber: order.orderNumber,
    issuedAt: new Date().toISOString(),
    restaurant,
    order,
    gstNote: 'Inclusive of GST',
  })
})
