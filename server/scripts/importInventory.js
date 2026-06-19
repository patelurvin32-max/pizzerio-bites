import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import InventoryItem from '../models/InventoryItem.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../../.env') })

const inventoryData = [
  // Frozen
  { sku: 'FROZ001', name: 'Classic patty Hyfun', category: 'Frozen', quantity: 50, minStock: 10, unit: 'PCS', supplier: 'Hyfun' },
  { sku: 'FROZ002', name: 'French fries straight cut 9mm', category: 'Frozen', quantity: 30, minStock: 10, unit: 'KG', supplier: 'Hyfun' },
  { sku: 'FROZ003', name: 'Frozen peas', category: 'Frozen', quantity: 20, minStock: 5, unit: 'KG', supplier: 'Local' },
  { sku: 'FROZ004', name: 'Frozen corn', category: 'Frozen', quantity: 15, minStock: 5, unit: 'KG', supplier: 'Local' },
  { sku: 'FROZ005', name: 'Frozen chicken nuggets', category: 'Frozen', quantity: 25, minStock: 10, unit: 'KG', supplier: 'Local' },
  
  // Vegetables
  { sku: 'VEG001', name: 'Potato', category: 'Vegetables', quantity: 100, minStock: 20, unit: 'KG', supplier: 'Local Market' },
  { sku: 'VEG002', name: 'Onion', category: 'Vegetables', quantity: 80, minStock: 15, unit: 'KG', supplier: 'Local Market' },
  { sku: 'VEG003', name: 'Cucumber', category: 'Vegetables', quantity: 30, minStock: 10, unit: 'KG', supplier: 'Local Market' },
  { sku: 'VEG004', name: 'Tomato', category: 'Vegetables', quantity: 50, minStock: 15, unit: 'KG', supplier: 'Local Market' },
  { sku: 'VEG005', name: 'Capsicum', category: 'Vegetables', quantity: 25, minStock: 8, unit: 'KG', supplier: 'Local Market' },
  { sku: 'VEG006', name: 'Carrot', category: 'Vegetables', quantity: 30, minStock: 10, unit: 'KG', supplier: 'Local Market' },
  { sku: 'VEG007', name: 'Cabbage', category: 'Vegetables', quantity: 40, minStock: 10, unit: 'KG', supplier: 'Local Market' },
  { sku: 'VEG008', name: 'Garlic', category: 'Vegetables', quantity: 15, minStock: 5, unit: 'KG', supplier: 'Local Market' },
  { sku: 'VEG009', name: 'Ginger', category: 'Vegetables', quantity: 10, minStock: 3, unit: 'KG', supplier: 'Local Market' },
  { sku: 'VEG010', name: 'Green chilli', category: 'Vegetables', quantity: 20, minStock: 5, unit: 'KG', supplier: 'Local Market' },
  
  // Cooking Material
  { sku: 'COOK001', name: 'Refined oil', category: 'Cooking Material', quantity: 50, minStock: 10, unit: 'LTR', supplier: 'Local' },
  { sku: 'COOK002', name: 'Mustard oil', category: 'Cooking Material', quantity: 30, minStock: 8, unit: 'LTR', supplier: 'Local' },
  { sku: 'COOK003', name: 'Butter', category: 'Cooking Material', quantity: 20, minStock: 5, unit: 'KG', supplier: 'Local' },
  { sku: 'COOK004', name: 'Ghee', category: 'Cooking Material', quantity: 15, minStock: 3, unit: 'LTR', supplier: 'Local' },
  { sku: 'COOK005', name: 'Flour maida', category: 'Cooking Material', quantity: 100, minStock: 20, unit: 'KG', supplier: 'Local' },
  { sku: 'COOK006', name: 'Flour atta', category: 'Cooking Material', quantity: 80, minStock: 15, unit: 'KG', supplier: 'Local' },
  { sku: 'COOK007', name: 'Rice', category: 'Cooking Material', quantity: 60, minStock: 15, unit: 'KG', supplier: 'Local' },
  { sku: 'COOK008', name: 'Sugar', category: 'Cooking Material', quantity: 50, minStock: 10, unit: 'KG', supplier: 'Local' },
  { sku: 'COOK009', name: 'Salt', category: 'Cooking Material', quantity: 40, minStock: 10, unit: 'KG', supplier: 'Local' },
  
  // Packaging
  { sku: 'PACK001', name: 'Disposable plates', category: 'Packaging', quantity: 500, minStock: 100, unit: 'PCS', supplier: 'Local' },
  { sku: 'PACK002', name: 'Disposable cups', category: 'Packaging', quantity: 500, minStock: 100, unit: 'PCS', supplier: 'Local' },
  { sku: 'PACK003', name: 'Disposable spoons', category: 'Packaging', quantity: 500, minStock: 100, unit: 'PCS', supplier: 'Local' },
  { sku: 'PACK004', name: 'Disposable forks', category: 'Packaging', quantity: 500, minStock: 100, unit: 'PCS', supplier: 'Local' },
  { sku: 'PACK005', name: 'Takeaway boxes small', category: 'Packaging', quantity: 300, minStock: 50, unit: 'PCS', supplier: 'Local' },
  { sku: 'PACK006', name: 'Takeaway boxes large', category: 'Packaging', quantity: 200, minStock: 50, unit: 'PCS', supplier: 'Local' },
  { sku: 'PACK007', name: 'Paper napkins', category: 'Packaging', quantity: 1000, minStock: 200, unit: 'PCS', supplier: 'Local' },
  { sku: 'PACK008', name: 'Tissue paper', category: 'Packaging', quantity: 50, minStock: 10, unit: 'PCS', supplier: 'Local' },
  
  // Cleaning material
  { sku: 'CLEAN001', name: 'Dish soap', category: 'Cleaning material', quantity: 20, minStock: 5, unit: 'LTR', supplier: 'Local' },
  { sku: 'CLEAN002', name: 'Floor cleaner', category: 'Cleaning material', quantity: 15, minStock: 3, unit: 'LTR', supplier: 'Local' },
  { sku: 'CLEAN003', name: 'Hand wash', category: 'Cleaning material', quantity: 10, minStock: 2, unit: 'LTR', supplier: 'Local' },
  { sku: 'CLEAN004', name: 'Bleach', category: 'Cleaning material', quantity: 10, minStock: 2, unit: 'LTR', supplier: 'Local' },
  { sku: 'CLEAN005', name: 'Cleaning cloth', category: 'Cleaning material', quantity: 50, minStock: 10, unit: 'PCS', supplier: 'Local' },
  { sku: 'CLEAN006', name: 'Gloves', category: 'Cleaning material', quantity: 20, minStock: 5, unit: 'PCS', supplier: 'Local' },
  
  // Stationary
  { sku: 'STAT001', name: 'Pen', category: 'Stationary', quantity: 50, minStock: 10, unit: 'PCS', supplier: 'Local' },
  { sku: 'STAT002', name: 'Notebook', category: 'Stationary', quantity: 20, minStock: 5, unit: 'PCS', supplier: 'Local' },
  { sku: 'STAT003', name: 'Calculator', category: 'Stationary', quantity: 5, minStock: 1, unit: 'PCS', supplier: 'Local' },
  { sku: 'STAT004', name: 'Marker', category: 'Stationary', quantity: 20, minStock: 5, unit: 'PCS', supplier: 'Local' },
  { sku: 'STAT005', name: 'Tape', category: 'Stationary', quantity: 10, minStock: 2, unit: 'PCS', supplier: 'Local' },
  
  // Masala/Spices
  { sku: 'MAS001', name: 'Red chilli powder', category: 'Masala', quantity: 10, minStock: 2, unit: 'KG', supplier: 'Local' },
  { sku: 'MAS002', name: 'Turmeric powder', category: 'Masala', quantity: 8, minStock: 2, unit: 'KG', supplier: 'Local' },
  { sku: 'MAS003', name: 'Cumin powder', category: 'Masala', quantity: 8, minStock: 2, unit: 'KG', supplier: 'Local' },
  { sku: 'MAS004', name: 'Coriander powder', category: 'Masala', quantity: 8, minStock: 2, unit: 'KG', supplier: 'Local' },
  { sku: 'MAS005', name: 'Garam masala', category: 'Masala', quantity: 5, minStock: 1, unit: 'KG', supplier: 'Local' },
  { sku: 'MAS006', name: 'Black pepper', category: 'Masala', quantity: 5, minStock: 1, unit: 'KG', supplier: 'Local' },
  { sku: 'MAS007', name: 'Salt table', category: 'Masala', quantity: 10, minStock: 2, unit: 'KG', supplier: 'Local' },
  { sku: 'MAS008', name: 'Chat masala', category: 'Masala', quantity: 5, minStock: 1, unit: 'KG', supplier: 'Local' },
  
  // Breads
  { sku: 'BREAD001', name: 'Burger bun', category: 'Breads', quantity: 100, minStock: 20, unit: 'PCS', supplier: 'Local Bakery' },
  { sku: 'BREAD002', name: 'Pizza base', category: 'Breads', quantity: 80, minStock: 15, unit: 'PCS', supplier: 'Local Bakery' },
  { sku: 'BREAD003', name: 'Sandwich bread', category: 'Breads', quantity: 50, minStock: 10, unit: 'PCS', supplier: 'Local Bakery' },
  { sku: 'BREAD004', name: 'Garlic bread', category: 'Breads', quantity: 30, minStock: 5, unit: 'PCS', supplier: 'Local Bakery' },
  
  // Cold drinks
  { sku: 'DRINK001', name: 'Coca cola', category: 'Cold drinks', quantity: 100, minStock: 20, unit: 'ML', supplier: 'Local' },
  { sku: 'DRINK002', name: 'Pepsi', category: 'Cold drinks', quantity: 100, minStock: 20, unit: 'ML', supplier: 'Local' },
  { sku: 'DRINK003', name: 'Sprite', category: 'Cold drinks', quantity: 80, minStock: 15, unit: 'ML', supplier: 'Local' },
  { sku: 'DRINK004', name: 'Fanta', category: 'Cold drinks', quantity: 80, minStock: 15, unit: 'ML', supplier: 'Local' },
  { sku: 'DRINK005', name: 'Mountain dew', category: 'Cold drinks', quantity: 60, minStock: 10, unit: 'ML', supplier: 'Local' },
  { sku: 'DRINK006', name: 'Water bottle', category: 'Cold drinks', quantity: 150, minStock: 30, unit: 'ML', supplier: 'Local' },
  
  // Sauces and spreads
  { sku: 'SAUCE001', name: 'Tomato ketchup', category: 'Sauces', quantity: 20, minStock: 5, unit: 'LTR', supplier: 'Local' },
  { sku: 'SAUCE002', name: 'Chilli sauce', category: 'Sauces', quantity: 15, minStock: 3, unit: 'LTR', supplier: 'Local' },
  { sku: 'SAUCE003', name: 'Soy sauce', category: 'Sauces', quantity: 10, minStock: 2, unit: 'LTR', supplier: 'Local' },
  { sku: 'SAUCE004', name: 'Mayonnaise', category: 'Sauces', quantity: 15, minStock: 3, unit: 'LTR', supplier: 'Local' },
  { sku: 'SAUCE005', name: 'Mustard sauce', category: 'Sauces', quantity: 10, minStock: 2, unit: 'LTR', supplier: 'Local' },
  
  // Syrups
  { sku: 'SYRUP001', name: 'Chocolate syrup', category: 'Syrups', quantity: 10, minStock: 2, unit: 'LTR', supplier: 'Local' },
  { sku: 'SYRUP002', name: 'Strawberry syrup', category: 'Syrups', quantity: 10, minStock: 2, unit: 'LTR', supplier: 'Local' },
  { sku: 'SYRUP003', name: 'Vanilla syrup', category: 'Syrups', quantity: 10, minStock: 2, unit: 'LTR', supplier: 'Local' },
  { sku: 'SYRUP004', name: 'Mango syrup', category: 'Syrups', quantity: 8, minStock: 2, unit: 'LTR', supplier: 'Local' },
]

async function importInventory() {
  try {
    console.log('🔗 Connecting to MongoDB...')
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    let imported = 0
    let skipped = 0
    let errors = 0

    for (const item of inventoryData) {
      try {
        const existing = await InventoryItem.findOne({ sku: item.sku })
        if (existing) {
          console.log(`⏭️  Skipping ${item.name} (SKU ${item.sku} already exists)`)
          skipped++
        } else {
          await InventoryItem.create(item)
          console.log(`✅ Imported ${item.name} (SKU ${item.sku})`)
          imported++
        }
      } catch (err) {
        console.error(`❌ Error importing ${item.name}:`, err.message)
        errors++
      }
    }

    console.log('\n📊 Import Summary:')
    console.log(`  ✅ Imported: ${imported}`)
    console.log(`  ⏭️  Skipped: ${skipped}`)
    console.log(`  ❌ Errors: ${errors}`)
    console.log(`  📦 Total: ${inventoryData.length}`)

  } catch (err) {
    console.error('❌ Fatal error:', err)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('🔌 Disconnected from MongoDB')
  }
}

importInventory()
