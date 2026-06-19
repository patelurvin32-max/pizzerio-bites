import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import AuditLog from '../models/AuditLog.js'
import ErrorLog from '../models/ErrorLog.js'
import ApiRequestLog from '../models/ApiRequestLog.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('❌ MONGODB_URI not found in .env')
  process.exit(1)
}

console.log('🔗 Connecting to MongoDB...')
await mongoose.connect(uri)

async function createTTLIndexes() {
  try {
    console.log('\n⏱️  Creating TTL indexes...\n')

    console.log('📋 Creating AuditLog TTL index (30 days)...')
    await AuditLog.collection.createIndex(
      { createdAt: 1 },
      { 
        expireAfterSeconds: 2592000,
        name: 'auditLog_ttl_30days'
      }
    )
    console.log('✅ AuditLog TTL index created')

    console.log('⚠️  Creating ErrorLog TTL index (15 days)...')
    await ErrorLog.collection.createIndex(
      { timestamp: 1 },
      {
        expireAfterSeconds: 1296000,
        name: 'errorLog_ttl_15days'
      }
    )
    console.log('✅ ErrorLog TTL index created')

    console.log('📡 Creating ApiRequestLog TTL index (7 days)...')
    await ApiRequestLog.collection.createIndex(
      { timestamp: 1 },
      {
        expireAfterSeconds: 604800,
        name: 'apiRequestLog_ttl_7days'
      }
    )
    console.log('✅ ApiRequestLog TTL index created')

    console.log('\n✨ All TTL indexes created successfully!')
  } catch (err) {
    if (err.code === 48) {
      console.warn('⚠️  TTL index already exists (this is OK)')
    } else if (err.message.includes('already exists')) {
      console.warn('⚠️  Index with this name already exists')
    } else {
      console.error('❌ Error creating TTL indexes:', err.message)
      throw err
    }
  }
}

async function verifyTTLIndexes() {
  console.log('\n📊 Verifying TTL indexes...\n')

  const collections = [
    { name: 'AuditLog', model: AuditLog },
    { name: 'ErrorLog', model: ErrorLog },
    { name: 'ApiRequestLog', model: ApiRequestLog }
  ]

  for (const { name, model } of collections) {
    try {
      const indexes = await model.collection.getIndexes()
      console.log(`${name} collection indexes:`)
      
      Object.entries(indexes).forEach(([key, value]) => {
        if (value.expireAfterSeconds) {
          const days = Math.ceil(value.expireAfterSeconds / 86400)
          console.log(`  ✅ TTL: ${key} (expires after ${days} days)`)
        } else {
          console.log(`  • ${key}: ${JSON.stringify(value.key)}`)
        }
      })
      console.log()
    } catch (err) {
      console.error(`  ❌ Error checking ${name}:`, err.message)
    }
  }
}

async function main() {
  try {
    await createTTLIndexes()
    await verifyTTLIndexes()
    console.log('🎉 TTL indexing setup complete!\n')
    console.log('📌 Important:')
    console.log('  - MongoDB runs TTL deletion every 60 seconds')
    console.log('  - Documents are deleted exactly at expiration time (±60 seconds)')
    console.log('  - Deletion is automatic, requires NO maintenance')
  } catch (err) {
    console.error('Fatal error:', err)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

main()
