import Order from '../models/Order.js'
import Reservation from '../models/Reservation.js'
import Staff from '../models/Staff.js'
import InventoryItem from '../models/InventoryItem.js'
import ContactMessage from '../models/ContactMessage.js'
import User from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const MS_DAY = 24 * 60 * 60 * 1000

function startOfLocalDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date, days) {
  return new Date(date.getTime() + days * MS_DAY)
}

function parseDateValue(value) {
  if (!value) return startOfLocalDay(new Date())
  const [year, month, day] = String(value).split('-').map(Number)
  if (!year || !month || !day) return startOfLocalDay(new Date())
  return new Date(year, month - 1, day)
}

function rangeFromQuery(query) {
  const selected = parseDateValue(query.date)
  const filter = String(query.filter || 'Last 7 Days').toLowerCase()

  if (filter === 'today') {
    return { start: selected, end: addDays(selected, 1), days: 1 }
  }
  if (filter === 'yesterday') {
    const start = addDays(selected, -1)
    return { start, end: selected, days: 1 }
  }
  if (filter === 'last 30 days') {
    return { start: addDays(selected, -29), end: addDays(selected, 1), days: 30 }
  }
  if (filter === 'custom date') {
    const from = parseDateValue(query.from || query.date)
    const to = parseDateValue(query.to || query.from || query.date)
    const start = from <= to ? from : to
    const end = addDays(from <= to ? to : from, 1)
    const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / MS_DAY))
    return { start, end, days: diffDays }
  }
  return { start: addDays(selected, -6), end: addDays(selected, 1), days: 7 }
}

function percentTrend(current, previous) {
  if (!previous && !current) return '0%'
  if (!previous) return '+100%'
  const pct = ((current - previous) / previous) * 100
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

function dayKey(date) {
  return new Date(date).toISOString().slice(0, 10)
}

function paymentGroup(method) {
  return String(method || '').toLowerCase() === 'cash' ? 'Cash' : 'Online'
}

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
    dineInOrders,
    takeawayOrders,
    userCount,
    staffActive,
    lowStock,
    popularItems,
  ] = await Promise.all([
    Order.countDocuments({ orderType: 'dine-in' }),
    Order.countDocuments({ orderType: 'takeaway' }),
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
    dineInOrders,
    takeawayOrders,
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

export const orderReport = asyncHandler(async (req, res) => {
  const startDate = req.query.startDate ? new Date(req.query.startDate) : null
  const endDate = req.query.endDate ? new Date(req.query.endDate) : null

  const filter = {}
  if (startDate || endDate) {
    filter.createdAt = {}
    if (startDate) filter.createdAt.$gte = startDate
    if (endDate) {
      const endOfDay = new Date(endDate)
      endOfDay.setHours(23, 59, 59, 999)
      filter.createdAt.$lte = endOfDay
    }
  }

  const orders = await Order.find(filter)
    .select('orderNumber customerName customerPhone orderType paymentMethod items total status createdAt')
    .sort({ createdAt: -1 })
    .lean()

  const totalOrders = orders.length
  const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0)
  const cashPayments = orders
    .filter((order) => order.paymentMethod?.toLowerCase() === 'cash')
    .reduce((sum, order) => sum + (order.total || 0), 0)
  const onlinePayments = orders
    .filter((order) => order.paymentMethod?.toLowerCase() !== 'cash')
    .reduce((sum, order) => sum + (order.total || 0), 0)
  const averageOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0

  const customerMap = new Map()
  orders.forEach((order) => {
    const phone = order.customerPhone || ''
    if (phone) {
      const count = customerMap.get(phone) || 0
      customerMap.set(phone, count + 1)
    }
  })
  const uniqueCustomers = customerMap.size
  const repeatedCustomers = Array.from(customerMap.values()).filter((count) => count > 1).length

  const orderRows = orders.map((order) => ({
    orderNumber: order.orderNumber,
    createdAt: new Date(order.createdAt).toLocaleString(),
    customerName: order.customerName,
    customerPhone: order.customerPhone || '-',
    orderType: order.orderType,
    paymentMethod: order.paymentMethod,
    totalItems: order.items?.length || 0,
    totalAmount: order.total,
    status: order.status,
  }))

  res.json({
    summary: {
      totalOrders,
      totalSales,
      cashPayments,
      onlinePayments,
      averageOrderValue,
      uniqueCustomers,
      repeatedCustomers,
    },
    orders: orderRows,
  })
})

export const cafeAnalytics = asyncHandler(async (req, res) => {
  const { start, end, days } = rangeFromQuery(req.query)
  const previousStart = addDays(start, -days)
  const orderMatch = { createdAt: { $gte: start, $lt: end } }
  const previousMatch = { createdAt: { $gte: previousStart, $lt: start } }
  const paidMatch = { ...orderMatch, paymentStatus: 'paid' }
  const previousPaidMatch = { ...previousMatch, paymentStatus: 'paid' }

  const [
    orders,
    previousOrders,
    totalOrders,
    previousTotalOrders,
    revenueAgg,
    previousRevenueAgg,
    productRows,
    activeUsers,
  ] = await Promise.all([
    Order.find(orderMatch).select('createdAt total paymentStatus paymentMethod items customerEmail customerPhone customerName').lean(),
    Order.find(previousMatch).select('total paymentStatus').lean(),
    Order.countDocuments(orderMatch),
    Order.countDocuments(previousMatch),
    Order.aggregate([
      { $match: paidMatch },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: previousPaidMatch },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: paidMatch },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
          unitTotal: { $sum: '$items.unitPrice' },
          lineCount: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]),
  ])

  const totalSales = revenueAgg[0]?.total || 0
  const paidOrderCount = revenueAgg[0]?.count || 0
  const previousSales = previousRevenueAgg[0]?.total || 0
  const previousPaidOrderCount = previousRevenueAgg[0]?.count || 0
  const avgOrderValue = paidOrderCount ? Math.round(totalSales / paidOrderCount) : 0
  const previousAvgOrderValue = previousPaidOrderCount ? Math.round(previousSales / previousPaidOrderCount) : 0
  const productRevenueTotal = productRows.reduce((sum, row) => sum + (row.revenue || 0), 0)

  const salesBuckets = {}
  for (let i = 0; i < days; i += 1) {
    const d = addDays(start, i)
    const key = dayKey(d)
    salesBuckets[key] = {
      date: d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      sales: 0,
      orders: 0,
    }
  }

  const weeklyBuckets = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => ({ day, orders: 0 }))
  const paymentTotals = { Cash: { value: 0, count: 0 }, Online: { value: 0, count: 0 } }
  const customerKeys = new Set()
  let refunds = 0

  for (const order of orders) {
    const key = dayKey(order.createdAt)
    if (salesBuckets[key]) {
      salesBuckets[key].orders += 1
      if (order.paymentStatus === 'paid') salesBuckets[key].sales += order.total || 0
    }
    weeklyBuckets[new Date(order.createdAt).getDay()].orders += 1

    if (order.paymentStatus === 'paid') {
      const group = paymentGroup(order.paymentMethod)
      paymentTotals[group].value += order.total || 0
      paymentTotals[group].count += 1
    }
    if (order.paymentStatus === 'refunded') refunds += 1

    const customerKey = order.customerPhone || order.customerEmail || order.customerName
    if (customerKey) customerKeys.add(String(customerKey).toLowerCase())
  }

  const bestSellingProducts = productRows.slice(0, 5).map((row) => ({
    name: row._id || 'Unnamed item',
    revenue: Math.round(row.revenue || 0),
    quantity: row.quantity || 0,
  }))

  const productSalesRows = productRows.map((row, index) => ({
    id: String(row._id || index),
    name: row._id || 'Unnamed item',
    quantity: row.quantity || 0,
    unitPrice: row.lineCount ? Math.round((row.unitTotal || 0) / row.lineCount) : 0,
    revenue: Math.round(row.revenue || 0),
    percent: productRevenueTotal ? Math.round(((row.revenue || 0) / productRevenueTotal) * 100) : 0,
  }))

  const cashCount = paymentTotals.Cash.count
  const onlineCount = paymentTotals.Online.count
  const paymentTotalCount = cashCount + onlineCount + refunds
  const mostUsedPayment = onlineCount >= cashCount ? 'Online' : 'Cash'
  const bestItem = bestSellingProducts[0]?.name || 'No sales yet'
  const lowestItem = productRows.length ? productRows[productRows.length - 1]?._id || 'No sales yet' : 'No sales yet'
  const peakDay = Object.values(salesBuckets).reduce(
    (best, item) => (item.sales > best.sales ? item : best),
    { date: 'No sales yet', sales: 0 }
  )

  res.json({
    range: {
      start: start.toISOString(),
      end: end.toISOString(),
      days,
    },
    summary: {
      totalSales,
      totalOrders,
      cashPayments: paymentTotals.Cash.value,
      onlinePayments: paymentTotals.Online.value,
      averageOrderValue: avgOrderValue,
      bestSellingItem: bestItem,
      totalCustomers: customerKeys.size,
      trends: {
        totalSales: percentTrend(totalSales, previousSales),
        totalOrders: percentTrend(totalOrders, previousTotalOrders),
        cashPayments: 'Live',
        onlinePayments: 'Live',
        averageOrderValue: percentTrend(avgOrderValue, previousAvgOrderValue),
        bestSellingItem: 'Live',
        totalCustomers: 'Live',
      },
    },
    dailySales: Object.values(salesBuckets),
    paymentMethods: [
      { name: 'Cash', value: paymentTotals.Cash.value },
      { name: 'Online', value: paymentTotals.Online.value },
    ],
    bestSellingProducts,
    weeklyOrders: weeklyBuckets,
    productSalesRows,
    paymentSummary: [
      { label: 'Total Cash Transactions', value: cashCount, progress: paymentTotalCount ? Math.round((cashCount / paymentTotalCount) * 100) : 0 },
      { label: 'Total Online Transactions', value: onlineCount, progress: paymentTotalCount ? Math.round((onlineCount / paymentTotalCount) * 100) : 0 },
      { label: 'Total Refunds', value: refunds, progress: paymentTotalCount ? Math.round((refunds / paymentTotalCount) * 100) : 0 },
    ],
    insights: [
      { label: 'Peak sales day', value: peakDay.date, detail: `${peakDay.sales ? `Rs. ${Math.round(peakDay.sales).toLocaleString('en-IN')}` : 'No'} revenue in this range` },
      { label: 'Most used payment method', value: mostUsedPayment, detail: `${Math.max(cashCount, onlineCount)} paid transactions` },
      { label: 'Lowest selling item', value: lowestItem, detail: productRows.length ? 'Lowest revenue item in this range' : 'No product sales yet' },
    ],
  })
})
