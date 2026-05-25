/** Pizzerio Bites menu — matches printed menu (prices in ₹) */

export const PIZZERIO_CATEGORIES = [
  { name: 'Pizza', slug: 'pizza', sortOrder: 1, dualPricing: true, variantLabel: 'Extra Cheese' },
  { name: 'Burger', slug: 'burger', sortOrder: 2, dualPricing: true, variantLabel: 'With Cheese' },
  { name: 'Maggie', slug: 'maggie', sortOrder: 3, dualPricing: false },
  { name: 'Garlic Bread', slug: 'garlic-bread', sortOrder: 4, dualPricing: false },
  { name: 'Sandwiches', slug: 'sandwiches', sortOrder: 5, dualPricing: true, variantLabel: 'Extra Cheese' },
  { name: 'Spe. Sandwich', slug: 'spe-sandwich', sortOrder: 6, dualPricing: false },
  { name: 'Beverages', slug: 'beverages', sortOrder: 7, dualPricing: false },
  { name: 'French Fries', slug: 'french-fries', sortOrder: 8, dualPricing: false },
]

/** @typedef {{ slug: string, name: string, categorySlug: string, price: number, priceVariant?: number }} MenuSeedItem */

/** @type {MenuSeedItem[]} */
export const PIZZERIO_MENU_ITEMS = [
  // Pizza
  { slug: 'veg-classic-pizza', name: 'Veg. Classic Pizza', categorySlug: 'pizza', price: 80, priceVariant: 100 },
  { slug: 'tomato-onion-pizza', name: 'Tomato/ Onion Pizza', categorySlug: 'pizza', price: 80, priceVariant: 100 },
  { slug: 'margerita-pizza', name: 'Margerita Pizza', categorySlug: 'pizza', price: 100, priceVariant: 120 },
  { slug: 'sweet-corn-pizza', name: 'Sweet Corn Pizza', categorySlug: 'pizza', price: 120, priceVariant: 140 },
  { slug: 'peri-peri-paneer-pizza', name: 'Peri-Peri Paneer Pizza', categorySlug: 'pizza', price: 150, priceVariant: 170 },
  { slug: 'peppy-paneer-pizza', name: 'Peppy Paneer Pizza', categorySlug: 'pizza', price: 150, priceVariant: 170 },
  { slug: 'paneer-tandoori-pizza', name: 'Paneer Tandoori Pizza', categorySlug: 'pizza', price: 150, priceVariant: 170 },
  { slug: 'paneer-makhani-pizza', name: 'Paneer Makhani Pizza', categorySlug: 'pizza', price: 170, priceVariant: 190 },
  { slug: 'indian-classical-pizza', name: 'Indian Classical Pizza', categorySlug: 'pizza', price: 180, priceVariant: 200 },
  { slug: 'farmhouse-pizza', name: 'Farmhouse Pizza', categorySlug: 'pizza', price: 180, priceVariant: 200 },
  // Burger
  { slug: 'classic-burger', name: 'Classic Burger', categorySlug: 'burger', price: 50, priceVariant: 60 },
  { slug: 'peri-peri-burger', name: 'Peri-Peri Burger', categorySlug: 'burger', price: 60, priceVariant: 70 },
  { slug: 'tandoori-burger', name: 'Tandoori Burger', categorySlug: 'burger', price: 60, priceVariant: 70 },
  { slug: 'schezwan-burger', name: 'Schezwan Burger', categorySlug: 'burger', price: 60, priceVariant: 70 },
  { slug: 'fire-burger', name: 'Fire Burger', categorySlug: 'burger', price: 80, priceVariant: 90 },
  { slug: 'nachos-burger', name: 'Nachos Burger', categorySlug: 'burger', price: 80, priceVariant: 90 },
  { slug: 'maharaja-burger', name: 'Maharaja Burger', categorySlug: 'burger', price: 120, priceVariant: 130 },
  // Maggie
  { slug: 'classic-maggie', name: 'Classic Maggie', categorySlug: 'maggie', price: 50 },
  { slug: 'double-masala-maggie', name: 'Double Masala Maggie', categorySlug: 'maggie', price: 60 },
  { slug: 'veg-mix-maggie', name: 'Veg. Mix Maggie', categorySlug: 'maggie', price: 70 },
  { slug: 'cheese-masala-maggie', name: 'Cheese Masala Maggie', categorySlug: 'maggie', price: 80 },
  { slug: 'veg-mix-cheese-masala-maggie', name: 'Veg. Mix Cheese Masala Maggie', categorySlug: 'maggie', price: 90 },
  // Garlic Bread
  { slug: 'garlic-bread', name: 'Garlic Bread', categorySlug: 'garlic-bread', price: 60 },
  { slug: 'spicy-butter-garlic-bread', name: 'Spicy Butter Garlic Bread', categorySlug: 'garlic-bread', price: 80 },
  // Sandwiches
  { slug: 'veg-sandwich', name: 'Veg. Sandwich', categorySlug: 'sandwiches', price: 40, priceVariant: 60 },
  { slug: 'masala-toast-sandwich', name: 'Masala Toast Sandwich', categorySlug: 'sandwiches', price: 40, priceVariant: 60 },
  { slug: 'junglee-sandwich', name: 'Junglee Sandwich', categorySlug: 'sandwiches', price: 60, priceVariant: 80 },
  { slug: 'chilli-toast-sandwich', name: 'Chilli Toast Sandwich', categorySlug: 'sandwiches', price: 60, priceVariant: 80 },
  { slug: 'crunchy-sandwich', name: 'Crunchy Sandwich', categorySlug: 'sandwiches', price: 60, priceVariant: 80 },
  { slug: 'bites-spe-sandwich', name: 'Bites Spe. Sandwich', categorySlug: 'sandwiches', price: 60, priceVariant: 80 },
  { slug: 'sweet-corn-sandwich', name: 'Sweet Corn Sandwich', categorySlug: 'sandwiches', price: 80, priceVariant: 100 },
  { slug: 'chocolate-sandwich', name: 'Chocolate Sandwich', categorySlug: 'sandwiches', price: 80, priceVariant: 100 },
  { slug: 'creamy-sandwich', name: 'Creamy Sandwich', categorySlug: 'sandwiches', price: 80, priceVariant: 100 },
  { slug: 'italian-sandwich', name: 'Italian Sandwich', categorySlug: 'sandwiches', price: 80, priceVariant: 100 },
  // Spe. Sandwich
  { slug: 'cheese-grill-sandwich', name: 'Cheese Grill Sandwich', categorySlug: 'spe-sandwich', price: 130 },
  { slug: 'paneer-tandoori-sandwich', name: 'Paneer Tandoori Sandwich', categorySlug: 'spe-sandwich', price: 130 },
  { slug: 'paneer-tikka-sandwich', name: 'Paneer Tikka Sandwich', categorySlug: 'spe-sandwich', price: 140 },
  { slug: 'bahubali-sandwich', name: 'Bahubali Sandwich', categorySlug: 'spe-sandwich', price: 180 },
  // Beverages
  { slug: 'cold-coffee', name: 'Cold Coffee', categorySlug: 'beverages', price: 60 },
  { slug: 'cold-coffee-with-chocolate', name: 'Cold Coffee with Chocolate', categorySlug: 'beverages', price: 80 },
  { slug: 'classic-mojito', name: 'Classic Mojito', categorySlug: 'beverages', price: 70 },
  { slug: 'vergin-mojito', name: 'Vergin Mojito', categorySlug: 'beverages', price: 70 },
  { slug: 'strawberry-sunrise', name: 'Strawberry Sunrise', categorySlug: 'beverages', price: 70 },
  { slug: 'blue-lagoon-colada', name: 'Blue Lagoon Colada', categorySlug: 'beverages', price: 90 },
  { slug: 'pineapple-orange-paradise', name: 'Pineapple Orange Paradise', categorySlug: 'beverages', price: 90 },
  // French Fries
  { slug: 'classic-fries', name: 'Classic Fries', categorySlug: 'french-fries', price: 50 },
  { slug: 'peri-peri-fries', name: 'Peri-Peri Fries', categorySlug: 'french-fries', price: 70 },
  { slug: 'cheesy-fries', name: 'Cheesy Fries', categorySlug: 'french-fries', price: 90 },
]
