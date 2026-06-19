import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import InventoryClosing from '../models/InventoryClosing.js'
import InventoryItem from '../models/InventoryItem.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../../.env') })

await mongoose.connect(process.env.MONGODB_URI)

console.log('🔍 Checking Inventory Status\n')

// Check if inventory is closed today
const todayKey = new Date().toISOString().slice(0, 10)
const closedToday = await InventoryClosing.findOne({ dateKey: todayKey }).lean()
console.log(`Inventory closed today: ${!!closedToday}`)
if (closedToday) {
  console.log(`  Closed date: ${closedToday.dateKey}`)
  console.log(`  Closed by: ${closedToday.closedBy}`)
}

// Check inventory items count
const itemCount = await InventoryItem.countDocuments()
console.log(`\nTotal inventory items: ${itemCount}`)

if (itemCount === 0) {
  console.log('⚠️ No inventory items found in database')
  console.log('This will cause order creation to fail if menu items have recipes')
}

await mongoose.disconnect()
