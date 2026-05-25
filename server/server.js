import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import app from './app.js'
import { connectDB } from './config/db.js'
import { ensureDefaultCategories, ensureDefaultMenuItems } from './utils/ensureDefaults.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

const PORT = process.env.PORT || 5000
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env')
  process.exit(1)
}

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET in .env')
  process.exit(1)
}

await connectDB(MONGODB_URI)
console.log('MongoDB connected')

const seedDefaults =
  process.env.ENABLE_DEFAULT_SEED === 'true' || process.env.NODE_ENV !== 'production'

if (seedDefaults) {
  const categoryCount = await ensureDefaultCategories()
  if (categoryCount) console.log(`Menu categories ready (${categoryCount})`)
  const menuSeed = await ensureDefaultMenuItems()
  if (menuSeed.upserted) console.log(`Menu items synced (${menuSeed.upserted} updated, ${menuSeed.total} total)`)
  else if (menuSeed.total) console.log(`Menu items ready (${menuSeed.total})`)
} else {
  console.log('Default menu seed skipped (set ENABLE_DEFAULT_SEED=true to enable in production)')
}

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`)
})
