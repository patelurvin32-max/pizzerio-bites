import Order from '../models/Order.js'
import User from '../models/User.js'
import Reservation from '../models/Reservation.js'
import Staff from '../models/Staff.js'
import InventoryItem from '../models/InventoryItem.js'
import ContactMessage from '../models/ContactMessage.js'
import { asyncHandler } from '../utils/asyncHandler.js'

/** Front-desk / staff dashboard — no revenue or admin-only metrics */
export const operationsSummary = asyncHandler(async (_req, res) => {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [ordersToday, reservationsPending, ordersPending, unreadMessages] = await Promise.all([
    Order.countDocuments({ createdAt: { $gte: startOfDay } }),
    Reservation.countDocuments({ status: 'pending' }),
    Order.countDocuments({ status: 'pending' }),
    ContactMessage.countDocuments({ read: false }),
  ])

  res.json({
    ordersToday,
    reservationsPending,
    ordersPending,
    unreadMessages,
  })
})

export const dashboardSummary = asyncHandler(async (_req, res) => {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalOrders,
    revenueAgg,
    ordersToday,
    reservationsPending,
    userCount,
    staffActive,
    lowStock,
    popularItems,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: last30 } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.countDocuments({ createdAt: { $gte: startOfDay } }),
    Reservation.countDocuments({ status: 'pending' }),
    User.countDocuments({ status: 'active' }),
    Staff.countDocuments({ status: 'active' }),
    InventoryItem.countDocuments({ $expr: { $lte: ['$quantity', '$minStock'] } }),
    Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.name', qty: { $sum: '$items.quantity' } } },
      { $sort: { qty: -1 } },
      { $limit: 5 },
    ]),
  ])

  res.json({
    totalOrders,
    revenue30d: revenueAgg[0]?.total || 0,
    ordersToday,
    reservationsPending,
    userCount,
    staffActive,
    lowStockCount: lowStock,
    popularItems,
  })
})

export const salesSeries = asyncHandler(async (req, res) => {
  const days = Math.min(90, Math.max(7, parseInt(req.query.days, 10) || 14))
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - days)

  const orders = await Order.find({ createdAt: { $gte: start } })
    .select('total createdAt paymentStatus')
    .lean()

  const buckets = {}
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    buckets[key] = { date: key, orders: 0, revenue: 0 }
  }
  for (const o of orders) {
    const key = new Date(o.createdAt).toISOString().slice(0, 10)
    if (!buckets[key]) continue
    buckets[key].orders += 1
    if (o.paymentStatus === 'paid') buckets[key].revenue += o.total
  }
  res.json({ series: Object.values(buckets) })
})

export const trafficStub = asyncHandler(async (_req, res) => {
  res.json({
    message: 'Connect analytics provider (Plausible, GA4) to populate traffic.',
    series: Array.from({ length: 12 }).map((_, i) => ({
      label: `W${i + 1}`,
      visits: Math.floor(800 + Math.random() * 400),
    })),
  })
})
