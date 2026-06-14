import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import Order from '../models/Order.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../../.env') })

await mongoose.connect(process.env.MONGODB_URI)

// Get a sample customerEmail from database
const sampleOrder = await Order.findOne().lean()
if (!sampleOrder) {
  console.log('No orders in database to test')
  process.exit(0)
}

console.log(`Testing query performance for customerEmail: ${sampleOrder.customerEmail}\n`)

// Test 1: Query with index
console.time('Query WITH index (customerEmail + createdAt)')
const withIndex = await Order.find({ customerEmail: sampleOrder.customerEmail })
  .sort({ createdAt: -1 })
  .lean()
console.timeEnd('Query WITH index (customerEmail + createdAt)')
console.log(`Found ${withIndex.length} orders\n`)

// Test 2: Explain query plan
console.log('Query execution plan:')
const explainResult = await Order.collection.find({ customerEmail: sampleOrder.customerEmail }).explain('executionStats')
console.log(`
  Execution Stage: ${explainResult.executionStats.executionStages.stage}
  Documents Examined: ${explainResult.executionStats.executionStages.docsExamined}
  Documents Returned: ${explainResult.executionStats.executionStats.nReturned}
  Efficiency: ${(explainResult.executionStats.executionStages.nReturned / explainResult.executionStats.executionStages.docsExamined * 100).toFixed(2)}%
`)

if (explainResult.executionStats.executionStages.stage === 'COLLSCAN') {
  console.log('⚠️ WARNING: Query is using COLLSCAN (no index used) — indexing failed!')
} else if (explainResult.executionStats.executionStages.stage === 'IXSCAN') {
  console.log('✅ Index is being used efficiently!')
}

await mongoose.disconnect()
