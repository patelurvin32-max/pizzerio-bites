import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import AuditLog from '../models/AuditLog.js'
import ErrorLog from '../models/ErrorLog.js'
import ApiRequestLog from '../models/ApiRequestLog.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../../.env') })

await mongoose.connect(process.env.MONGODB_URI)

console.log('🔍 Verifying TTL Setup\n')

console.log('📋 AuditLog Collection:')
const auditIndexes = await AuditLog.collection.getIndexes()
const auditTTL = Object.entries(auditIndexes).find(([name, idx]) => 
  name.includes('ttl') || idx.expireAfterSeconds !== undefined
)
if (auditTTL) {
  const days = auditTTL[1].expireAfterSeconds 
    ? Math.ceil(auditTTL[1].expireAfterSeconds / 86400)
    : 30
  console.log(`  ✅ TTL Index: ${auditTTL[0]} (expires after ${days} days)`)
} else {
  console.log('  ⚠️  No TTL index found')
  console.log('  Available indexes:', Object.keys(auditIndexes).join(', '))
}
const auditCount = await AuditLog.countDocuments()
console.log(`  📊 Documents: ${auditCount}`)

console.log('\n⚠️  ErrorLog Collection:')
const errorIndexes = await ErrorLog.collection.getIndexes()
const errorTTL = Object.entries(errorIndexes).find(([name, idx]) => 
  name.includes('ttl') || idx.expireAfterSeconds !== undefined
)
if (errorTTL) {
  const days = errorTTL[1].expireAfterSeconds 
    ? Math.ceil(errorTTL[1].expireAfterSeconds / 86400)
    : 15
  console.log(`  ✅ TTL Index: ${errorTTL[0]} (expires after ${days} days)`)
} else {
  console.log('  ⚠️  No TTL index found')
  console.log('  Available indexes:', Object.keys(errorIndexes).join(', '))
}
const errorCount = await ErrorLog.countDocuments()
console.log(`  📊 Documents: ${errorCount}`)

console.log('\n📡 ApiRequestLog Collection:')
const apiIndexes = await ApiRequestLog.collection.getIndexes()
const apiTTL = Object.entries(apiIndexes).find(([name, idx]) => 
  name.includes('ttl') || idx.expireAfterSeconds !== undefined
)
if (apiTTL) {
  const days = apiTTL[1].expireAfterSeconds 
    ? Math.ceil(apiTTL[1].expireAfterSeconds / 86400)
    : 7
  console.log(`  ✅ TTL Index: ${apiTTL[0]} (expires after ${days} days)`)
} else {
  console.log('  ⚠️  No TTL index found')
  console.log('  Available indexes:', Object.keys(apiIndexes).join(', '))
}
const apiCount = await ApiRequestLog.countDocuments()
console.log(`  📊 Documents: ${apiCount}`)

console.log('\n💾 Storage Impact Estimate:')
const estimateSize = (count) => {
  return (count * 500) / (1024 * 1024)
}
const totalMB = estimateSize(auditCount) + estimateSize(errorCount) + estimateSize(apiCount)
console.log(`  Audit logs: ~${estimateSize(auditCount).toFixed(2)} MB`)
console.log(`  Error logs: ~${estimateSize(errorCount).toFixed(2)} MB`)
console.log(`  API logs: ~${estimateSize(apiCount).toFixed(2)} MB`)
console.log(`  Total: ~${totalMB.toFixed(2)} MB`)

console.log('\n✨ Verification complete!')
await mongoose.disconnect()
