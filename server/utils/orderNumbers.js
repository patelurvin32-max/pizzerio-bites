import Counter from '../models/Counter.js'
import Order from '../models/Order.js'

const ORDER_NUMBER_PATTERN = /^\d{4}\/\d{5}$/

function orderYear(order) {
  return new Date(order.createdAt || order.updatedAt || Date.now()).getFullYear()
}

function parseOrderNumber(orderNumber) {
  if (!ORDER_NUMBER_PATTERN.test(orderNumber || '')) return null
  const [year, seq] = orderNumber.split('/')
  return { year: Number(year), seq: Number(seq) }
}

export async function ensureSequentialOrderNumbers() {
  const orders = await Order.find({})
    .select('_id orderNumber createdAt updatedAt')
    .sort({ createdAt: 1, _id: 1 })
    .lean()

  const nextByYear = new Map()
  const maxByYear = new Map()
  const updates = []

  for (const order of orders) {
    const parsed = parseOrderNumber(order.orderNumber)
    if (!parsed) continue
    maxByYear.set(parsed.year, Math.max(maxByYear.get(parsed.year) || 0, parsed.seq))
  }

  for (const [year, maxSeq] of maxByYear.entries()) {
    nextByYear.set(year, maxSeq + 1)
  }

  for (const order of orders) {
    if (parseOrderNumber(order.orderNumber)) continue

    const year = orderYear(order)
    const seq = nextByYear.get(year) || 1
    const orderNumber = `${year}/${String(seq).padStart(5, '0')}`

    updates.push({
      updateOne: {
        filter: { _id: order._id },
        update: { $set: { orderNumber } },
      },
    })

    nextByYear.set(year, seq + 1)
    maxByYear.set(year, Math.max(maxByYear.get(year) || 0, seq))
  }

  if (updates.length) {
    await Order.bulkWrite(updates, { ordered: true })
  }

  await Promise.all(
    [...maxByYear.entries()].map(([year, seq]) =>
      Counter.updateOne(
        { key: `order-${year}` },
        { $max: { seq } },
        { upsert: true, setDefaultsOnInsert: true }
      )
    )
  )

  return { updated: updates.length }
}
