import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import Order from '../models/Order.js'
import InventoryItem from '../models/InventoryItem.js'
import User from '../models/User.js'
import MenuItem from '../models/MenuItem.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('MONGODB_URI not found in .env')
  process.exit(1)
}

console.log('Connecting to MongoDB...')
await mongoose.connect(uri)

async function createIndexes() {
  try {
    console.log('\n📍 Creating Order indexes...')
    await Order.collection.createIndex({ orderNumber: 1 }, { unique: true })
    await Order.collection.createIndex({ customerEmail: 1 })
    await Order.collection.createIndex({ customerPhone: 1 })
    await Order.collection.createIndex({ status: 1 })
    await Order.collection.createIndex({ createdAt: -1 })
    await Order.collection.createIndex({ updatedAt: -1 })
    await Order.collection.createIndex({ customerEmail: 1, createdAt: -1 })
    await Order.collection.createIndex({ status: 1, createdAt: -1 })
    await Order.collection.createIndex({ status: 1, createdAt: -1, total: 1 })
    await Order.collection.createIndex({ status: 1, createdAt: 1 })
    console.log('✅ Order indexes created')

    console.log('\n📍 Creating InventoryItem indexes...')
    await InventoryItem.collection.createIndex({ sku: 1 }, { unique: true })
    await InventoryItem.collection.createIndex({ quantity: 1 })
    await InventoryItem.collection.createIndex({ lastRestocked: -1 })
    await InventoryItem.collection.createIndex({ updatedAt: -1 })
    await InventoryItem.collection.createIndex({ quantity: 1, minStock: 1 })
    await InventoryItem.collection.createIndex({ sku: 1, updatedAt: -1 })
    await InventoryItem.collection.createIndex({ quantity: 1, lastRestocked: -1 })
    console.log('✅ InventoryItem indexes created')

    console.log('\n📍 Creating User indexes...')
    await User.collection.createIndex({ email: 1 }, { unique: true })
    await User.collection.createIndex({ role: 1 })
    await User.collection.createIndex({ status: 1 })
    await User.collection.createIndex({ createdAt: -1 })
    await User.collection.createIndex({ status: 1, role: 1 })
    console.log('✅ User indexes created')

    console.log('\n📍 Creating MenuItem indexes...')
    await MenuItem.collection.createIndex({ slug: 1 }, { unique: true })
    await MenuItem.collection.createIndex({ category: 1 })
    await MenuItem.collection.createIndex({ available: 1 })
    await MenuItem.collection.createIndex({ createdAt: -1 })
    await MenuItem.collection.createIndex({ category: 1, available: 1 })
    await MenuItem.collection.createIndex({ name: 'text', description: 'text' })
    console.log('✅ MenuItem indexes created')

    console.log('\n🎯 All indexes created successfully!')
  } catch (err) {
    if (err.code === 11000) {
      console.warn('⚠️ Index already exists (this is OK)')
    } else {
      console.error('❌ Error creating indexes:', err.message)
      throw err
    }
  }
}

async function verifyIndexes() {
  console.log('\n📊 Verifying indexes...\n')

  const collections = [
    { name: 'Order', model: Order },
    { name: 'InventoryItem', model: InventoryItem },
    { name: 'User', model: User },
    { name: 'MenuItem', model: MenuItem }
  ]

  for (const { name, model } of collections) {
    const indexes = await model.collection.getIndexes()
    console.log(`${name} collection indexes:`)
    Object.entries(indexes).forEach(([key, value]) => {
      console.log(`  - ${key}: ${JSON.stringify(value.key)}`)
    })
    console.log()
  }
}

async function main() {
  try {
    await createIndexes()
    await verifyIndexes()
    console.log('✨ Database indexing complete!')
  } catch (err) {
    console.error('Fatal error:', err)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\nDisconnected from MongoDB')
  }
}

main()
