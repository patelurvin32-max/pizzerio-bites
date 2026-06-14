import Order from '../models/Order.js'
import InventoryItem from '../models/InventoryItem.js'
import User from '../models/User.js'
import MenuItem from '../models/MenuItem.js'

export async function checkIndexes() {
  try {
    const orderIndexes = await Order.collection.getIndexes()
    const inventoryItemIndexes = await InventoryItem.collection.getIndexes()
    const userIndexes = await User.collection.getIndexes()
    const menuItemIndexes = await MenuItem.collection.getIndexes()
    
    console.log('📊 Active Indexes:')
    console.log('Order:', Object.keys(orderIndexes).length)
    console.log('InventoryItem:', Object.keys(inventoryItemIndexes).length)
    console.log('User:', Object.keys(userIndexes).length)
    console.log('MenuItem:', Object.keys(menuItemIndexes).length)
    
    return { 
      orderIndexes, 
      inventoryItemIndexes,
      userIndexes,
      menuItemIndexes
    }
  } catch (err) {
    console.error('Failed to check indexes:', err.message)
  }
}
