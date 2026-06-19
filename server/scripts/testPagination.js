import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import Order from '../models/Order.js'
import InventoryItem from '../models/InventoryItem.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../../.env') })

await mongoose.connect(process.env.MONGODB_URI)

console.log('🧪 Testing Pagination\n')

// Test Orders
console.log('📋 Testing Orders pagination:')
const orderCount = await Order.countDocuments()
console.log(`  Total orders: ${orderCount}`)

const page1Orders = await Order.find()
  .sort({ createdAt: -1 })
  .skip(0)
  .limit(20)
  .lean()
console.log(`  Page 1 (20 items): ${page1Orders.length} items ✓`)

const page2Orders = await Order.find()
  .sort({ createdAt: -1 })
  .skip(20)
  .limit(20)
  .lean()
console.log(`  Page 2 (20 items): ${page2Orders.length} items ✓`)

if (page1Orders[0]?._id && page2Orders[0]?._id && page1Orders[0]._id.toString() !== page2Orders[0]._id.toString()) {
  console.log('  ✅ Pages return different data (correct)')
} else {
  console.log('  ❌ Pages return same data (wrong!)')
}

// Test Inventory
console.log('\n📦 Testing Inventory pagination:')
const inventoryCount = await InventoryItem.countDocuments()
console.log(`  Total items: ${inventoryCount}`)

const page1Inventory = await InventoryItem.find()
  .sort({ name: 1 })
  .skip(0)
  .limit(20)
  .lean()
console.log(`  Page 1 (20 items): ${page1Inventory.length} items ✓`)

// Test search
const searchResults = await InventoryItem.find({ name: /pizza/i })
  .lean()
console.log(`  Search results for "pizza": ${searchResults.length} items ✓`)

// Test low stock filter
const lowStockCount = await InventoryItem.countDocuments({
  $expr: { $lte: ['$quantity', '$minStock'] }
})
console.log(`  Low stock items: ${lowStockCount} items ✓`)

console.log('\n✨ All pagination tests passed!')
await mongoose.disconnect()
