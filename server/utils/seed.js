import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import User from '../models/User.js'
import { ensureDefaultCategories, ensureDefaultMenuItems } from './ensureDefaults.js'
import SiteContent from '../models/SiteContent.js'
import PaymentSettings from '../models/PaymentSettings.js'
import { ROLES } from './roles.js'
import { validatePassword } from './passwordPolicy.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../../.env') })

const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('MONGODB_URI missing')
  process.exit(1)
}

await mongoose.connect(uri)

const email = process.env.SEED_ADMIN_EMAIL || 'admin@pizzerio.bites'
const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!'

if (process.env.NODE_ENV === 'production') {
  const policy = validatePassword(password)
  if (!policy.ok) {
    console.error(`SEED_ADMIN_PASSWORD invalid for production: ${policy.message}`)
    process.exit(1)
  }
  if (password === 'ChangeMe123!') {
    console.error('Do not use the default seed password in production. Set SEED_ADMIN_PASSWORD.')
    process.exit(1)
  }
}

let user = await User.findOne({ email })
if (!user) {
  user = await User.create({
    name: 'Super Admin',
    email,
    password,
    role: ROLES.SUPER_ADMIN,
    status: 'active',
  })
  console.log('Created super admin:', email)
} else {
  console.log('Admin user already exists:', email)
}

await ensureDefaultCategories()
console.log('Categories ensured')
const menuSeed = await ensureDefaultMenuItems()
console.log(`Menu items: ${menuSeed.total} total (${menuSeed.upserted} upserted/updated)`)

await SiteContent.updateOne(
  { key: 'hero' },
  {
    $setOnInsert: {
      key: 'hero',
      section: 'homepage',
      value: {
        title: 'Pizzerio Bites',
        subtitle: 'Fresh pizza, bold flavor',
        ctaPrimary: 'Reserve',
        ctaSecondary: 'Order online',
      },
    },
  },
  { upsert: true }
)

await PaymentSettings.updateOne({}, { $setOnInsert: { currency: 'INR', taxRatePercent: 0 } }, { upsert: true })

await mongoose.disconnect()
console.log('Seed complete')
