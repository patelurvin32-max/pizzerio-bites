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

console.log('🗑️  Cleaning up old logs (manual cleanup)\n')

const auditCutoff = new Date(Date.now() - 30*24*60*60*1000)
const errorCutoff = new Date(Date.now() - 15*24*60*60*1000)
const apiCutoff = new Date(Date.now() - 7*24*60*60*1000)

console.log('📋 Deleting AuditLogs older than 30 days...')
const auditResult = await AuditLog.deleteMany({ createdAt: { $lt: auditCutoff } })
console.log(`✅ Deleted ${auditResult.deletedCount} audit logs`)

console.log('⚠️  Deleting ErrorLogs older than 15 days...')
const errorResult = await ErrorLog.deleteMany({ timestamp: { $lt: errorCutoff } })
console.log(`✅ Deleted ${errorResult.deletedCount} error logs`)

console.log('📡 Deleting ApiRequestLogs older than 7 days...')
const apiResult = await ApiRequestLog.deleteMany({ timestamp: { $lt: apiCutoff } })
console.log(`✅ Deleted ${apiResult.deletedCount} API request logs`)

console.log('\n✨ Cleanup complete!')
await mongoose.disconnect()
