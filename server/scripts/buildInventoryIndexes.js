import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import InventoryItem from '../models/InventoryItem.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../../.env') })

async function buildIndexes() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    console.log('\nBuilding indexes on InventoryItem collection...')

    const indexes = await InventoryItem.collection.getIndexes()
    console.log('Current indexes:', Object.keys(indexes))

    console.log('\nEnsuring all indexes are created...')
    await InventoryItem.createIndexes()

    const updatedIndexes = await InventoryItem.collection.getIndexes()
    console.log('Updated indexes:', Object.keys(updatedIndexes))

    console.log('\n✅ Indexes built successfully!')

    // Get collection stats
    const count = await InventoryItem.countDocuments()
    console.log(`\nCollection stats:`)
    console.log(`- Document count: ${count}`)

  } catch (error) {
    console.error('Error building indexes:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\nDisconnected from MongoDB')
  }
}

buildIndexes()
