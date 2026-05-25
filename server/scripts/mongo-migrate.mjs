/**
 * Copy data into a NEW pizzerio-bites database only.
 * NeonBite (neonbite-cafe) is a separate project — never written to by this script.
 *
 * Usage (from project root):
 *   npm run db:import    Restore local backup/ into NEW_MONGODB_URI (pizzerio-bites only)
 *   npm run db:status    List backed-up collections
 *
 * Env (.env at project root):
 *   NEW_MONGODB_URI      — required for import; must use database name pizzerio-bites
 */
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import { EJSON } from 'bson'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '../..')
const BACKUP_DIR = path.join(ROOT, 'backup', 'pizzerio-bites-seed')

dotenv.config({ path: path.join(ROOT, '.env') })

/** Database name from mongodb+srv://.../DBNAME?... */
function dbNameFromUri(uri) {
  const match = uri.match(/\.net\/([^/?]+)/)
  return match?.[1] ?? ''
}

function assertSafeImportTarget(uri) {
  const db = dbNameFromUri(uri)
  if (!db) {
    throw new Error('Could not parse database name from NEW_MONGODB_URI')
  }
  if (db === 'neonbite-cafe' || /neonbite/i.test(db)) {
    throw new Error(
      `Refusing to import into "${db}". NeonBite is a separate project — use database name pizzerio-bites on a new cluster.`
    )
  }
  if (db !== 'pizzerio-bites') {
    throw new Error(`NEW_MONGODB_URI database must be "pizzerio-bites" (got "${db}")`)
  }
}

const mode = process.argv[2]

if (!mode || !['export', 'import', 'status'].includes(mode)) {
  console.log(`
Pizzerio Bites — import local seed backup (NeonBite DB is never touched)

  npm run db:import   Restore backup/ into NEW_MONGODB_URI only
  npm run db:status   List backed-up collections

Before import:
  1. Create a NEW Atlas cluster for pizzerio-bites (not the NeonBite cluster)
  2. Set NEW_MONGODB_URI in .env, e.g.:
     NEW_MONGODB_URI=mongodb+srv://USER:PASS@....mongodb.net/pizzerio-bites?retryWrites=true&w=majority

Fresh start instead of import: npm run seed --prefix server (with MONGODB_URI pointing at pizzerio-bites)
`)
  process.exit(mode ? 1 : 0)
}

async function exportDb(uri) {
  console.log('Read-only export — source database will NOT be modified.')
  console.log('Connecting to source cluster...')
  await mongoose.connect(uri)
  const db = mongoose.connection.db
  const collections = await db.listCollections().toArray()

  fs.mkdirSync(BACKUP_DIR, { recursive: true })

  const manifest = []
  for (const { name } of collections) {
    const docs = await db.collection(name).find({}).toArray()
    const file = path.join(BACKUP_DIR, `${name}.json`)
    fs.writeFileSync(file, EJSON.stringify(docs, { relaxed: false }))
    manifest.push({ name, count: docs.length, file: `${name}.json` })
    console.log(`  ✓ ${name}: ${docs.length} document(s)`)
  }

  fs.writeFileSync(
    path.join(BACKUP_DIR, '_manifest.json'),
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        sourceUri: uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@'),
        collections: manifest,
      },
      null,
      2
    )
  )

  await mongoose.disconnect()
  console.log(`\nExport complete → ${BACKUP_DIR}`)
  console.log('Next: create pizzerio-bites Atlas cluster, set NEW_MONGODB_URI in .env, then run import.')
}

async function importDb(uri) {
  assertSafeImportTarget(uri)

  if (!fs.existsSync(BACKUP_DIR)) {
    console.error(`Backup folder not found: ${BACKUP_DIR}\nRun export first.`)
    process.exit(1)
  }

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.json') && !f.startsWith('_'))

  if (!files.length) {
    console.error('No collection files in backup folder. Run export first.')
    process.exit(1)
  }

  console.log('Connecting to target cluster...')
  await mongoose.connect(uri)
  const db = mongoose.connection.db

  for (const file of files.sort()) {
    const name = file.replace('.json', '')
    const raw = fs.readFileSync(path.join(BACKUP_DIR, file), 'utf8')
    const docs = EJSON.parse(raw)

    if (!docs.length) {
      console.log(`  − ${name}: empty, skipped`)
      continue
    }

    await db.collection(name).deleteMany({})
    await db.collection(name).insertMany(docs, { ordered: false })
    console.log(`  ✓ ${name}: ${docs.length} document(s)`)
  }

  await mongoose.disconnect()
  console.log(`\nImport complete into ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')}`)
  console.log('You do NOT need npm run seed — admin user and menu data are already in the new DB.')
}

function showStatus() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('No backup yet. Run: npm run db:export')
    return
  }

  const manifestPath = path.join(BACKUP_DIR, '_manifest.json')
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    console.log(`Exported: ${manifest.exportedAt}`)
    console.log(`Source:   ${manifest.sourceUri}`)
    console.log('Collections:')
    for (const c of manifest.collections) {
      console.log(`  ${c.name}: ${c.count}`)
    }
    return
  }

  const files = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  console.log(`Backup folder: ${BACKUP_DIR} (${files.length} collection file(s))`)
}

try {
  if (mode === 'status') {
    showStatus()
  } else if (mode === 'export') {
    const uri = process.env.MONGODB_URI
    if (!uri) {
      console.error('MONGODB_URI missing in .env')
      process.exit(1)
    }
    await exportDb(uri)
  } else if (mode === 'import') {
    const uri = process.env.NEW_MONGODB_URI
    if (!uri) {
      console.error('NEW_MONGODB_URI missing in .env — set your pizzerio-bites cluster URI (not NeonBite).')
      process.exit(1)
    }
    await importDb(uri)
  }
} catch (err) {
  console.error('Migration failed:', err.message)
  process.exit(1)
}
