import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { FiAlertTriangle, FiBox, FiCheckCircle, FiDownload, FiEdit2, FiFileText, FiMoon, FiPlus, FiSearch, FiSun, FiTrash2 } from 'react-icons/fi'
import Card from '../../components/common/Card.jsx'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Select from '../../components/common/Select.jsx'
import Modal from '../../components/common/Modal.jsx'
import Table, { Th, Tr, Td } from '../../components/common/Table.jsx'
import Badge from '../../components/common/Badge.jsx'
import Loader from '../../components/common/Loader.jsx'
import CalendarDatePicker from '../../components/reservations/CalendarDatePicker.jsx'
import api from '../../services/api.js'
import { menuService } from '../../services/menuService.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useNotify } from '../../context/NotificationContext.jsx'
import { slugify } from '../../utils/helpers.js'

const units = ['KG', 'LTR', 'PCS', 'GM', 'ML']
const tabs = ['Dashboard', 'Products', 'Stock In', 'Stock Out', 'Waste', 'Recipes', 'Closing']
const pageLengthOptions = [10, 25, 50, 100]
const today = () => new Date().toISOString().slice(0, 10)
const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0)

function inventoryItemId(ref) {
  return ref?._id || ref || ''
}

function resolveInventoryProduct(ref, products = []) {
  if (ref && typeof ref === 'object' && ref.name) return ref
  const id = inventoryItemId(ref)
  return products.find((p) => p._id === id) || null
}

function inventoryProductCategory(product) {
  if (!product) return ''
  return typeof product.category === 'object' ? product.category?.name || product.category?._id : product.category
}
const emptyDashboard = {
  metrics: {
    totalProducts: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    expiredItems: 0,
    todayStockIn: 0,
    todayStockOut: 0,
    wasteItemsToday: 0,
    currentInventoryValue: 0,
  },
  lowStock: [],
  nearExpiry: [],
  todayTransactions: [],
  closedToday: false,
  closing: null,
}

const emptyProduct = {
  sku: '',
  name: '',
  category: '',
  quantity: 0,
  minStock: 5,
  unit: 'PCS',
  supplier: '',
  expiryDate: '',
  purchasePrice: 0,
}
const emptyStockIn = { category: '', productId: '', quantity: 0, unit: 'PCS', purchasePrice: 0, supplierName: '', invoiceNumber: '', date: today(), notes: '' }
const emptyStockOut = { category: '', productId: '', quantity: 0, unit: 'PCS', reason: 'Kitchen Use', department: 'Kitchen', date: today(), approvedBy: '' }
const emptyWaste = { category: '', productId: '', quantity: 0, unit: 'PCS', reason: 'Expired', date: today(), staffName: '' }
const emptyClosing = { date: today(), notes: '', confirmed: false, closedBy: '' }

function Stat({ label, value, tone = 'default', icon: Icon = FiBox }) {
  const tones = {
    default: 'from-nb-maroon/8 to-nb-surface text-nb-white',
    warning: 'from-nb-gold/25 to-nb-surface text-nb-gold',
    danger: 'from-nb-neon-red/25 to-nb-surface text-nb-neon-red',
    success: 'from-emerald-400/20 to-nb-surface text-emerald-300',
  }
  return (
    <Card className={`bg-gradient-to-br ${tones[tone]}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-nb-gray">{label}</p>
          <p className="mt-2 text-2xl font-bold text-nb-white">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-black/25">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}

function FieldGrid({ children }) {
  return <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>
}

function TextArea({ label, value, onChange, className = '' }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-xs font-medium uppercase tracking-wide text-nb-gray">{label}</span>
      <textarea
        value={value}
        onChange={onChange}
        rows={3}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-nb-white outline-none transition focus:border-nb-neon-orange/60 focus:ring-2 focus:ring-nb-neon-orange/25"
      />
    </label>
  )
}

export default function Inventory() {
  const notify = useNotify()
  const { permissions, user } = useAuth()
  const canAccessMenu = Boolean(permissions?.menu)
  const isReception = user?.role === 'RECEPTION'
  const [active, setActive] = useState('Dashboard')
  const [items, setItems] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [closingPreview, setClosingPreview] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [canManageRecipes, setCanManageRecipes] = useState(false)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState('dark')
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [pageLength, setPageLength] = useState(10)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [productModal, setProductModal] = useState({ open: false, editing: null })
  const [productForm, setProductForm] = useState(emptyProduct)
  const [bulkExpiryModal, setBulkExpiryModal] = useState({ open: false })
  const [bulkExpiryData, setBulkExpiryData] = useState([])
  const [stockInForm, setStockInForm] = useState(emptyStockIn)
  const [stockOutForm, setStockOutForm] = useState(emptyStockOut)
  const [wasteForm, setWasteForm] = useState(emptyWaste)
  const [closingForm, setClosingForm] = useState(emptyClosing)
  const [recipeMenuId, setRecipeMenuId] = useState('')
  const [recipeMenuCategory, setRecipeMenuCategory] = useState('')
  const [recipeRows, setRecipeRows] = useState([])
  const [newRecipeModal, setNewRecipeModal] = useState({ open: false })
  const [newRecipeForm, setNewRecipeForm] = useState({ menuCategory: '', menuItem: '', ingredients: [] })
  const [categoryModal, setCategoryModal] = useState({ open: false, editing: null })
  const [categoryForm, setCategoryForm] = useState({ name: '' })
  const formsInitialized = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [inventoryRes, dashboardRes, txRes] = await Promise.all([
        api.get('/api/inventory', { params: { page, limit: pageLength, search: query, category: categoryFilter } }),
        api.get('/api/inventory/dashboard'),
        api.get('/api/inventory/transactions'),
      ])
      setItems(inventoryRes.data.items)
      setAllProducts(inventoryRes.data.items)
      setPagination(inventoryRes.data.pagination)
      setDashboard(dashboardRes.data)
      setTransactions(txRes.data.items)

      if (canAccessMenu || isReception) {
        try {
          const menuRes = await menuService.items({ limit: 1000 })
          setMenuItems(menuRes.items)
          setCanManageRecipes(true)
          setRecipeMenuId((id) => id || menuRes.items[0]?._id || '')
        } catch (menuError) {
          if (menuError.message === 'Forbidden') {
            setMenuItems([])
            setRecipeRows([])
            setCanManageRecipes(false)
          } else {
            throw menuError
          }
        }
      } else {
        setMenuItems([])
        setRecipeRows([])
        setCanManageRecipes(false)
      }
    } catch (e) {
      notify.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [canAccessMenu, isReception, notify, page, pageLength, query, categoryFilter])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (active !== 'Stock In' && active !== 'Stock Out' && active !== 'Waste' && active !== 'Recipes') return
    api.get('/api/inventory', { params: { limit: 1000 } })
      .then((res) => setAllProducts(res.data.items))
      .catch((e) => console.error('Failed to load all products:', e))
  }, [active])

  useEffect(() => {
    if (formsInitialized.current || !allProducts.length) return
    const first = allProducts[0]
    setStockInForm((f) => (f.productId ? f : { ...f, productId: first._id, unit: first.unit }))
    setStockOutForm((f) => (f.productId ? f : { ...f, productId: first._id, unit: first.unit }))
    setWasteForm((f) => (f.productId ? f : { ...f, productId: first._id, unit: first.unit }))
    formsInitialized.current = true
  }, [allProducts])

  useEffect(() => {
    if (!canManageRecipes && active === 'Recipes') setActive('Dashboard')
  }, [active, canManageRecipes])

  useEffect(() => {
    const menu = menuItems.find((item) => item._id === recipeMenuId)
    setRecipeRows((menu?.recipe || []).map((row) => ({
      inventoryItem: row.inventoryItem?._id || row.inventoryItem || '',
      quantity: row.quantity || 0,
      unit: row.unit || 'PCS',
    })))
  }, [recipeMenuId, menuItems])

  const categories = useMemo(() => [...new Set(items.map((it) => it.category || 'General'))], [items])

  useEffect(() => {
    setPage(1)
  }, [query, categoryFilter, pageLength])

  function selectProduct(setter, productId) {
    const product = allProducts.find((it) => it._id === productId)
    setter((form) => ({ ...form, productId, unit: product?.unit || form.unit }))
  }

  function openProduct(row = null) {
    if (row) {
      setProductForm({
        sku: row.sku,
        name: row.name,
        category: row.category,
        quantity: row.quantity,
        minStock: row.minStock,
        unit: row.unit,
        supplier: row.supplier || '',
        expiryDate: row.expiryDate ? row.expiryDate.slice(0, 10) : '',
        purchasePrice: row.purchasePrice || 0,
      })
      setProductModal({ open: true, editing: row._id })
    } else {
      setProductForm(emptyProduct)
      setProductModal({ open: true, editing: null })
    }
  }

  function openBulkExpiryModal() {
    setBulkExpiryData(items.map((item) => ({
      _id: item._id,
      name: item.name,
      sku: item.sku,
      expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : '',
    })))
    setBulkExpiryModal({ open: true })
  }

  function openCategoryModal(categoryName = null) {
    if (categoryName) {
      setCategoryForm({ name: categoryName })
      setCategoryModal({ open: true, editing: categoryName })
    } else {
      setCategoryForm({ name: '' })
      setCategoryModal({ open: true, editing: null })
    }
  }

  async function saveCategory() {
    if (!categoryForm.name.trim()) {
      notify.error('Category name is required')
      return
    }

    const newName = categoryForm.name.trim()
    const oldName = categoryModal.editing

    if (oldName) {
      // Editing existing category - update all items with that category
      try {
        await api.patch('/api/inventory/bulk-category', { oldCategory: oldName, newCategory: newName })
        notify.success('Category updated successfully')
        setCategoryModal({ open: false, editing: null })
        setCategoryForm({ name: '' })
        load()
      } catch (e) {
        notify.error(e.message)
      }
    } else {
      // Adding new category - just show success (categories are created when items are added)
      notify.success('Category added. You can now use it when creating products.')
      setCategoryModal({ open: false, editing: null })
      setCategoryForm({ name: '' })
    }
  }

  async function deleteCategory(categoryName) {
    if (!window.confirm(`Delete category "${categoryName}"? This will remove the category from all products using it.`)) return

    try {
      await api.patch('/api/inventory/bulk-category', { oldCategory: categoryName, newCategory: '' })
      notify.success('Category deleted')
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function saveBulkExpiry() {
    try {
      const updates = bulkExpiryData.filter((item) => item.expiryDate).map((item) => ({
        _id: item._id,
        expiryDate: item.expiryDate,
      }))
      await api.patch('/api/inventory/bulk-expiry', { updates })
      notify.success('Expiry dates updated successfully')
      setBulkExpiryModal({ open: false })
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function saveProduct() {
    try {
      const body = { ...productForm, sku: productForm.sku || slugify(productForm.name).replaceAll('-', '').slice(0, 10).toUpperCase() }
      if (productModal.editing) await api.patch(`/api/inventory/${productModal.editing}`, body)
      else await api.post('/api/inventory', body)
      notify.success('Product saved')
      setProductModal({ open: false, editing: null })
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function removeProduct(id) {
    if (!window.confirm('Delete product from inventory?')) return
    try {
      await api.delete(`/api/inventory/${id}`)
      notify.success('Product deleted')
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function submitMovement(path, form, success, reset) {
    try {
      await api.post(path, form)
      notify.success(success)
      reset()
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function removeExpired(id) {
    try {
      await api.post(`/api/inventory/${id}/remove-expired`)
      notify.success('Expired stock removed')
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function saveRecipe() {
    const menu = menuItems.find((item) => item._id === recipeMenuId)
    if (!menu) return
    try {
      const recipe = recipeRows.filter((row) => row.inventoryItem && Number(row.quantity) > 0)
      await menuService.saveItem({
        _id: menu._id,
        name: menu.name,
        slug: menu.slug,
        description: menu.description,
        price: menu.price,
        priceVariant: menu.priceVariant,
        category: menu.category?._id || menu.category,
        available: menu.available,
        featured: menu.featured,
        tags: menu.tags || [],
        recipe,
      })
      notify.success('Recipe mapping saved')
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  function addIngredient() {
    if (!newRecipeForm.tempCategory || !newRecipeForm.tempProduct || !newRecipeForm.tempQuantity) {
      notify.error('Please select category, product, and enter quantity')
      return
    }

    const existingIngredient = newRecipeForm.ingredients.find((ing) => ing.inventoryItem === newRecipeForm.tempProduct)
    if (existingIngredient) {
      notify.error('This ingredient is already added')
      return
    }

    const product = allProducts.find((p) => p._id === newRecipeForm.tempProduct)
    const productCategory = typeof product?.category === 'object' ? product.category?.name || product.category?._id : product?.category
    setNewRecipeForm({
      ...newRecipeForm,
      ingredients: [
        ...newRecipeForm.ingredients,
        {
          category: productCategory || newRecipeForm.tempCategory,
          inventoryItem: newRecipeForm.tempProduct,
          quantity: newRecipeForm.tempQuantity,
          unit: newRecipeForm.tempUnit || 'PCS',
        },
      ],
      tempCategory: '',
      tempProduct: '',
      tempQuantity: '',
      tempUnit: 'PCS',
    })
  }

  function removeIngredient(index) {
    setNewRecipeForm({
      ...newRecipeForm,
      ingredients: newRecipeForm.ingredients.filter((_, idx) => idx !== index),
    })
  }

  async function saveNewRecipe() {
    if (!newRecipeForm.menuCategory) {
      notify.error('Please select a menu category')
      return
    }
    if (!newRecipeForm.menuItem) {
      notify.error('Please select a menu item')
      return
    }
    if (newRecipeForm.ingredients.length === 0) {
      notify.error('Please add at least one ingredient')
      return
    }

    const menu = menuItems.find((item) => item._id === newRecipeForm.menuItem)
    if (!menu) {
      notify.error('Menu item not found')
      return
    }

    try {
      const recipe = newRecipeForm.ingredients.filter((ing) => ing.inventoryItem && Number(ing.quantity) > 0)
      await menuService.saveItem({
        _id: menu._id,
        name: menu.name,
        slug: menu.slug,
        description: menu.description,
        price: menu.price,
        priceVariant: menu.priceVariant,
        category: menu.category?._id || menu.category,
        available: menu.available,
        featured: menu.featured,
        tags: menu.tags || [],
        recipe,
      })
      notify.success('Recipe saved successfully')
      setNewRecipeModal({ open: false })
      setNewRecipeForm({ menuCategory: '', menuItem: '', ingredients: [] })
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function refreshClosing(date) {
    try {
      const { data } = await api.get('/api/inventory/closing/preview', { params: { date } })
      setClosingPreview(data)
    } catch (e) {
      notify.error(e.message)
    }
  }

  // Lazy load closing preview when Closing tab is active
  useEffect(() => {
    if (active === 'Closing' && !closingPreview) {
      refreshClosing()
    }
  }, [active])

  async function closeDailyStock() {
    try {
      await api.post('/api/inventory/closing', closingForm)
      notify.success('Daily stock closed and locked')
      setClosingForm(emptyClosing)
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  function exportCsv(name, rows, headers) {
    const safeRows = rows || []
    if (!safeRows.length) {
      notify.error('No rows to export')
      return
    }
    const csv = [headers.join(','), ...safeRows.map((row) => headers.map((key) => `"${String(row[key] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPdf() {
    window.print()
  }

  const chartData = [
    { name: 'Stock In', value: dashboard?.metrics?.todayStockIn || 0 },
    { name: 'Stock Out', value: dashboard?.metrics?.todayStockOut || 0 },
    { name: 'Waste', value: dashboard?.metrics?.wasteItemsToday || 0 },
  ]
  const statusData = [
    { name: 'Healthy', value: Math.max(0, (dashboard?.metrics?.totalProducts || 0) - (dashboard?.metrics?.lowStockItems || 0) - (dashboard?.metrics?.outOfStockItems || 0) - (dashboard?.metrics?.expiredItems || 0)) },
    { name: 'Low', value: dashboard?.metrics?.lowStockItems || 0 },
    { name: 'Out', value: dashboard?.metrics?.outOfStockItems || 0 },
    { name: 'Expired', value: dashboard?.metrics?.expiredItems || 0 },
  ]
  const pageTone = theme === 'light' ? 'bg-white/[0.08]' : ''
  const viewTabs = canManageRecipes ? tabs : tabs.filter((tab) => tab !== 'Recipes')
  const dash = dashboard || emptyDashboard
  const recipeItems = useMemo(() => menuItems.filter((item) => item.recipe && item.recipe.length > 0), [menuItems])

  if (loading) return <Loader label="Loading inventory module" />

  return (
    <div className={`space-y-4 ${pageTone}`}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-nb-white">Inventory Management</h1>
          {/* <p className="text-sm text-nb-gray">Stock in, stock out, waste, recipes, closing stock, and reports.</p> */}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => setTheme((v) => (v === 'dark' ? 'light' : 'dark'))}>
            {theme === 'dark' ? <FiSun /> : <FiMoon />} {theme === 'dark' ? 'Light' : 'Dark'}
          </Button>
          <Button onClick={() => setActive('Closing')} disabled={dash.closedToday}>
            <FiCheckCircle /> Daily Closing
          </Button>
        </div>
      </div>

      {dash.closedToday && (
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          Inventory is locked for {dash.closing.dateKey}. Next stock movement should be entered for the next business day.
        </div>
      )}

      <Card className="!p-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin">
          {viewTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActive(tab)}
              className={`shrink-0 rounded-xl px-3 py-2 text-sm transition ${active === tab ? 'bg-nb-neon-orange text-nb-bg' : 'text-nb-gray hover:bg-white/10 hover:text-nb-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </Card>

      {active === 'Dashboard' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Total Products" value={dash.metrics.totalProducts} />
            <Stat label="Low Stock Items" value={dash.metrics.lowStockItems} tone="warning" icon={FiAlertTriangle} />
            <Stat label="Out of Stock Items" value={dash.metrics.outOfStockItems} tone="danger" icon={FiAlertTriangle} />
            <Stat label="Expired Items" value={dash.metrics.expiredItems} tone="danger" icon={FiTrash2} />
            <Stat label="Today Stock In" value={dash.metrics.todayStockIn} tone="success" />
            <Stat label="Today Stock Out" value={dash.metrics.todayStockOut} />
            <Stat label="Waste Today" value={dash.metrics.wasteItemsToday} tone="warning" />
            <Stat label="Inventory Value" value={money(dash.metrics.currentInventoryValue)} tone="success" />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <h2 className="mb-4 font-heading text-lg font-semibold">Daily Movement (Last 7 Days)</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard?.dailyMovement || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
                    <XAxis dataKey="date" stroke="#a0a0a0" />
                    <YAxis stroke="#a0a0a0" />
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,.12)' }} />
                    <Legend />
                    <Bar dataKey="stockIn" name="Stock In" radius={[4, 4, 0, 0]} fill="#22c55e" />
                    <Bar dataKey="stockOut" name="Stock Out" radius={[4, 4, 0, 0]} fill="#ff7a00" />
                    <Bar dataKey="waste" name="Waste" radius={[4, 4, 0, 0]} fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card>
              <h2 className="mb-4 font-heading text-lg font-semibold">Stock Health</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" innerRadius={55} outerRadius={95} paddingAngle={4}>
                      {['#22c55e', '#ffc857', '#ff3b30', '#8b0000'].map((color) => <Cell key={color} fill={color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,.12)' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <AlertList title="Low Stock Alerts" rows={dash.lowStock} action="Restock soon" />
            <AlertList title="Expiry Alerts" rows={dash.nearExpiry} action="Review expiry" onRemove={removeExpired} />
          </div>
        </div>
      )}

      {active === 'Products' && (
        <div className="space-y-4">
          <Card className="grid gap-3 lg:grid-cols-[180px_180px_120px_120px_auto] lg:items-end">
            <Select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">Select category</option>
              <option value="Frozen">Frozen</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Cooking Material">Cooking Material</option>
              <option value="Packaging">Packaging</option>
              <option value="Cleaning material">Cleaning material</option>
              <option value="Stationary">Stationary</option>
              <option value="Masala">Masala</option>
              <option value="Breads">Breads</option>
              <option value="Cold drinks">Cold drinks</option>
              <option value="Sauces">Sauces</option>
              <option value="Syrups">Syrups</option>
            </Select>
            <Select label="Rows" value={pageLength} onChange={(e) => setPageLength(Number(e.target.value))}>
              {pageLengthOptions.map((n) => <option key={n}>{n}</option>)}
            </Select>
            <Button onClick={() => openCategoryModal()}><FiPlus /> Category</Button>
            <Button onClick={() => openProduct()}><FiPlus /> Product</Button>
            <Button variant="ghost" onClick={() => openBulkExpiryModal()}><FiEdit2 /> Update Expiry</Button>
          </Card>
          <ProductTable rows={items} onEdit={openProduct} onDelete={removeProduct} onRemoveExpired={removeExpired} onEditCategory={openCategoryModal} onDeleteCategory={deleteCategory} />
          <Pagination currentPage={pagination.page} totalPages={pagination.pages} total={pagination.total} setPage={setPage} />
        </div>
      )}

      {active === 'Stock In' && (
        <MovementCard title="Add Stock In" button="Add Stock In" onSubmit={() => submitMovement('/api/inventory/stock-in', stockInForm, 'Stock added', () => setStockInForm({ ...emptyStockIn, category: stockInForm.category }))}>
          <FieldGrid>
            <Select label="Category" value={stockInForm.category} onChange={(e) => setStockInForm((f) => ({ ...f, category: e.target.value, productId: '' }))}>
              <option value="">Select category</option>
              <option value="Frozen">Frozen</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Cooking Material">Cooking Material</option>
              <option value="Packaging">Packaging</option>
              <option value="Cleaning material">Cleaning material</option>
              <option value="Stationary">Stationary</option>
              <option value="Masala">Masala</option>
              <option value="Breads">Breads</option>
              <option value="Cold drinks">Cold drinks</option>
              <option value="Sauces">Sauces</option>
              <option value="Syrups">Syrups</option>
            </Select>
            <ProductSelect label="Product Name" items={stockInForm.category ? allProducts.filter((it) => it.category?.toLowerCase() === stockInForm.category.toLowerCase()) : allProducts} value={stockInForm.productId} onChange={(id) => selectProduct(setStockInForm, id)} />
            <Input label="Quantity Added" type="number" value={stockInForm.quantity} onChange={(e) => setStockInForm({ ...stockInForm, quantity: Number(e.target.value) })} />
            <UnitSelect value={stockInForm.unit} onChange={(unit) => setStockInForm({ ...stockInForm, unit })} />
            <Input label="Purchase Price" type="number" value={stockInForm.purchasePrice} onChange={(e) => setStockInForm({ ...stockInForm, purchasePrice: Number(e.target.value) })} />
            <Input label="Supplier Name" value={stockInForm.supplierName} onChange={(e) => setStockInForm({ ...stockInForm, supplierName: e.target.value })} />
            <Input label="Invoice Number" value={stockInForm.invoiceNumber} onChange={(e) => setStockInForm({ ...stockInForm, invoiceNumber: e.target.value })} />
            <CalendarDatePicker label="Date" value={stockInForm.date} onChange={(val) => setStockInForm({ ...stockInForm, date: val })} />
            <Input label="Notes" value={stockInForm.notes} onChange={(e) => setStockInForm({ ...stockInForm, notes: e.target.value })} />
          </FieldGrid>
        </MovementCard>
      )}

      {active === 'Stock Out' && (
        <MovementCard title="Manual Stock Out" button="Add Stock Out" onSubmit={() => submitMovement('/api/inventory/stock-out', stockOutForm, 'Stock deducted', () => setStockOutForm({ ...emptyStockOut, category: stockOutForm.category }))}>
          <FieldGrid>
            <Select label="Category" value={stockOutForm.category} onChange={(e) => setStockOutForm((f) => ({ ...f, category: e.target.value, productId: '' }))}>
              <option value="">Select category</option>
              <option value="Frozen">Frozen</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Cooking Material">Cooking Material</option>
              <option value="Packaging">Packaging</option>
              <option value="Cleaning material">Cleaning material</option>
              <option value="Stationary">Stationary</option>
              <option value="Masala">Masala</option>
              <option value="Breads">Breads</option>
              <option value="Cold drinks">Cold drinks</option>
              <option value="Sauces">Sauces</option>
              <option value="Syrups">Syrups</option>
            </Select>
            <ProductSelect label="Product Name" items={stockOutForm.category ? allProducts.filter((it) => it.category?.toLowerCase() === stockOutForm.category.toLowerCase()) : allProducts} value={stockOutForm.productId} onChange={(id) => selectProduct(setStockOutForm, id)} />
            <Input label="Quantity Used" type="number" value={stockOutForm.quantity} onChange={(e) => setStockOutForm({ ...stockOutForm, quantity: Number(e.target.value) })} />
            <UnitSelect value={stockOutForm.unit} onChange={(unit) => setStockOutForm({ ...stockOutForm, unit })} />
            <Select label="Reason" value={stockOutForm.reason} onChange={(e) => setStockOutForm({ ...stockOutForm, reason: e.target.value })}>
              {['Kitchen Use', 'Damage', 'Adjustment'].map((v) => <option key={v}>{v}</option>)}
            </Select>
            <Select label="Department" value={stockOutForm.department} onChange={(e) => setStockOutForm({ ...stockOutForm, department: e.target.value })}>
              {['Kitchen', 'Cafe', 'Store'].map((v) => <option key={v}>{v}</option>)}
            </Select>
            <CalendarDatePicker label="Date" value={stockOutForm.date} onChange={(val) => setStockOutForm({ ...stockOutForm, date: val })} />
            <Input label="Approved By" value={stockOutForm.approvedBy} onChange={(e) => setStockOutForm({ ...stockOutForm, approvedBy: e.target.value })} />
          </FieldGrid>
        </MovementCard>
      )}

      {active === 'Waste' && (
        <MovementCard title="Waste and Damage" button="Add Waste Entry" onSubmit={() => submitMovement('/api/inventory/waste', wasteForm, 'Waste recorded', () => setWasteForm({ ...emptyWaste, category: wasteForm.category }))}>
          <FieldGrid>
            <Select label="Category" value={wasteForm.category} onChange={(e) => setWasteForm((f) => ({ ...f, category: e.target.value, productId: '' }))}>
              <option value="">Select category</option>
              <option value="Frozen">Frozen</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Cooking Material">Cooking Material</option>
              <option value="Packaging">Packaging</option>
              <option value="Cleaning material">Cleaning material</option>
              <option value="Stationary">Stationary</option>
              <option value="Masala">Masala</option>
              <option value="Breads">Breads</option>
              <option value="Cold drinks">Cold drinks</option>
              <option value="Sauces">Sauces</option>
              <option value="Syrups">Syrups</option>
            </Select>
            <ProductSelect label="Product Name" items={wasteForm.category ? allProducts.filter((it) => it.category?.toLowerCase() === wasteForm.category.toLowerCase()) : allProducts} value={wasteForm.productId} onChange={(id) => selectProduct(setWasteForm, id)} />
            <Input label="Quantity" type="number" value={wasteForm.quantity} onChange={(e) => setWasteForm({ ...wasteForm, quantity: Number(e.target.value) })} />
            <UnitSelect value={wasteForm.unit} onChange={(unit) => setWasteForm({ ...wasteForm, unit })} />
            <Select label="Reason" value={wasteForm.reason} onChange={(e) => setWasteForm({ ...wasteForm, reason: e.target.value })}>
              {['Expired', 'Spilled', 'Burnt', 'Broken'].map((v) => <option key={v}>{v}</option>)}
            </Select>
            <CalendarDatePicker label="Date" value={wasteForm.date} onChange={(val) => setWasteForm({ ...wasteForm, date: val })} />
            <Input label="Staff Name" value={wasteForm.staffName} onChange={(e) => setWasteForm({ ...wasteForm, staffName: e.target.value })} />
          </FieldGrid>
        </MovementCard>
      )}

      {active === 'Recipes' && (
        <Card className="space-y-4 overflow-hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-nb-white">Recipe Management</h2>
            </div>
            <Button
              fullWidth
              className="sm:w-auto"
              onClick={() => {
                setNewRecipeForm({ menuCategory: '', menuItem: '', ingredients: [] })
                setNewRecipeModal({ open: true })
              }}
            >
              <FiPlus /> New Recipe
            </Button>
          </div>

          {recipeItems.length > 0 ? (
            <div className="space-y-3">
              <div className="space-y-3 md:hidden">
                {recipeItems.map((item) => {
                  const itemCategory = typeof item.category === 'object' ? item.category?.name || item.category?._id : item.category
                  return (
                    <div key={item._id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-words font-medium text-nb-white">{item.name}</p>
                          <p className="mt-1 text-xs text-nb-gray">{itemCategory || 'N/A'}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={() => {
                            const currentCategory = typeof item.category === 'object' ? item.category?.name || item.category?._id : item.category
                            setNewRecipeForm({
                              menuCategory: currentCategory || '',
                              menuItem: item._id,
                              ingredients: (item.recipe || []).map((ing) => {
                                const product = resolveInventoryProduct(ing.inventoryItem, allProducts)
                                return {
                                  inventoryItem: inventoryItemId(ing.inventoryItem),
                                  quantity: ing.quantity,
                                  unit: ing.unit,
                                  category: inventoryProductCategory(product) || ing.category || '',
                                }
                              }),
                            })
                            setNewRecipeModal({ open: true })
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                      <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
                        {item.recipe.map((ing, idx) => {
                          const product = resolveInventoryProduct(ing.inventoryItem, allProducts)
                          return (
                            <div key={idx} className="rounded-xl bg-white/[0.03] px-3 py-2">
                              <p className="break-words text-sm text-nb-white">{product?.name || 'Unknown'}</p>
                              <p className="text-xs text-nb-gray">{ing.quantity} {ing.unit}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="pb-2 pl-2 font-medium text-nb-gray">Menu Item</th>
                      <th className="pb-2 pl-2 font-medium text-nb-gray">Category</th>
                      <th className="pb-2 pl-2 font-medium text-nb-gray">Ingredients</th>
                      <th className="pb-2 pl-2 font-medium text-nb-gray">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipeItems.map((item) => {
                      const itemCategory = typeof item.category === 'object' ? item.category?.name || item.category?._id : item.category
                      return (
                        <tr key={item._id} className="border-b border-white/5">
                          <td className="py-3 pl-2 font-medium text-nb-white">{item.name}</td>
                          <td className="py-3 pl-2 text-nb-gray">{itemCategory || 'N/A'}</td>
                          <td className="py-3 pl-2 text-nb-gray">
                            {item.recipe.map((ing, idx) => {
                              const product = resolveInventoryProduct(ing.inventoryItem, allProducts)
                              return (
                                <div key={idx} className="text-xs">
                                  {product?.name || 'Unknown'} - {ing.quantity} {ing.unit}
                                </div>
                              )
                            })}
                          </td>
                          <td className="py-3 pl-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const currentCategory = typeof item.category === 'object' ? item.category?.name || item.category?._id : item.category
                                setNewRecipeForm({
                                  menuCategory: currentCategory || '',
                                  menuItem: item._id,
                                  ingredients: (item.recipe || []).map((ing) => {
                                    const product = resolveInventoryProduct(ing.inventoryItem, allProducts)
                                    return {
                                      inventoryItem: inventoryItemId(ing.inventoryItem),
                                      quantity: ing.quantity,
                                      unit: ing.unit,
                                      category: inventoryProductCategory(product) || ing.category || '',
                                    }
                                  }),
                                })
                                setNewRecipeModal({ open: true })
                              }}
                            >
                              Edit
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-nb-gray">No recipes saved</p>
          )}
        </Card>
      )}

      {active === 'Closing' && (
        <Card className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <Input label="Date" type="date" value={closingForm.date} onChange={(e) => { setClosingForm({ ...closingForm, date: e.target.value }); refreshClosing(e.target.value) }} />
            <Input label="Opening Stock" value={closingPreview?.openingStock || 0} disabled />
            <Input label="Total Stock In" value={closingPreview?.totalStockIn || 0} disabled />
            <Input label="Total Stock Out" value={closingPreview?.totalStockOut || 0} disabled />
            <Input label="Total Waste" value={closingPreview?.totalWaste || 0} disabled />
            <Input label="Calculated Closing" value={closingPreview?.calculatedClosing || 0} disabled />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input label="Final Stock (Current)" value={closingPreview?.finalStock || 0} disabled />
            <Input label="Inventory Value" value={money(closingPreview?.inventoryValue || 0)} disabled />
          </div>
          <TextArea label="Closing Notes" value={closingForm.notes} onChange={(e) => setClosingForm({ ...closingForm, notes: e.target.value })} />
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <Input label="Closed By" value={closingForm.closedBy} onChange={(e) => setClosingForm({ ...closingForm, closedBy: e.target.value })} />
            <label className="flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-nb-gray">
              <input type="checkbox" checked={closingForm.confirmed} onChange={(e) => setClosingForm({ ...closingForm, confirmed: e.target.checked })} />
              Confirm and lock inventory
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={closeDailyStock} disabled={Boolean(closingPreview?.closed) || !closingForm.closedBy?.trim() || !closingForm.confirmed}>Close Daily Stock</Button>
            <Button variant="ghost" onClick={() => exportCsv('daily-closing-lines', closingPreview?.lines || [])}><FiDownload /> Excel</Button>
            <Button variant="ghost" onClick={exportPdf}><FiFileText /> PDF</Button>
          </div>
        </Card>
      )}

      <Modal
        open={productModal.open}
        onClose={() => setProductModal({ open: false, editing: null })}
        title={productModal.editing ? 'Edit Product' : 'New Product'}
        wide
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setProductModal({ open: false, editing: null })}>Cancel</Button>
            <Button onClick={saveProduct}>Save Product</Button>
          </div>
        }
      >
        <FieldGrid>
          <Input label="Product Name" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
          <Input label="SKU" value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })} disabled={Boolean(productModal.editing)} />
          <Select label="Category" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}>
            <option value="">Select category</option>
            <option value="Frozen">Frozen</option>
            <option value="Vegetables">Vegetables</option>
            <option value="Cooking Material">Cooking Material</option>
            <option value="Packaging">Packaging</option>
            <option value="Cleaning material">Cleaning material</option>
            <option value="Stationary">Stationary</option>
            <option value="Masala">Masala</option>
            <option value="Breads">Breads</option>
            <option value="Cold drinks">Cold drinks</option>
            <option value="Sauces">Sauces</option>
            <option value="Syrups">Syrups</option>
          </Select>
          <Input label="Current Stock" type="number" value={productForm.quantity} onChange={(e) => setProductForm({ ...productForm, quantity: Number(e.target.value) })} />
          <UnitSelect value={productForm.unit} onChange={(unit) => setProductForm({ ...productForm, unit })} />
          <Input label="Minimum Stock Level" type="number" value={productForm.minStock} onChange={(e) => setProductForm({ ...productForm, minStock: Number(e.target.value) })} />
          <CalendarDatePicker label="Expiry Date" value={productForm.expiryDate} onChange={(val) => setProductForm({ ...productForm, expiryDate: val })} required={false} />
          <Input label="Purchase Price" type="number" value={productForm.purchasePrice} onChange={(e) => setProductForm({ ...productForm, purchasePrice: Number(e.target.value) })} />
          <Input label="Supplier Name" value={productForm.supplier} onChange={(e) => setProductForm({ ...productForm, supplier: e.target.value })} />
        </FieldGrid>
      </Modal>

      <Modal
        open={bulkExpiryModal.open}
        onClose={() => setBulkExpiryModal({ open: false })}
        title="Bulk Expiry Update"
        wide
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setBulkExpiryModal({ open: false })}>Cancel</Button>
            <Button onClick={saveBulkExpiry}>Save All Expiry Dates</Button>
          </div>
        }
      >
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {bulkExpiryData.map((item) => (
            <div key={item._id} className="grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3 md:grid-cols-[1fr_140px]">
              <div>
                <p className="font-medium text-nb-white">{item.name}</p>
                <p className="text-xs text-nb-gray">{item.sku}</p>
              </div>
              <CalendarDatePicker
                label="Expiry Date"
                value={item.expiryDate}
                onChange={(val) => setBulkExpiryData((data) => data.map((d) => (d._id === item._id ? { ...d, expiryDate: val } : d)))}
                required={false}
              />
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={categoryModal.open}
        onClose={() => setCategoryModal({ open: false, editing: null })}
        title={categoryModal.editing ? 'Edit Category' : 'New Category'}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setCategoryModal({ open: false, editing: null })}>Cancel</Button>
            <Button onClick={saveCategory}>Save</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            value={categoryForm.name}
            onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
            placeholder="Enter category name"
          />
          {categoryModal.editing && (
            <p className="text-sm text-nb-gray">
              Editing category will update all products currently assigned to "{categoryModal.editing}"
            </p>
          )}
        </div>
      </Modal>

      <Modal
        open={newRecipeModal.open}
        onClose={() => setNewRecipeModal({ open: false })}
        title={newRecipeForm.menuItem ? 'Edit Recipe' : 'New Recipe'}
        wide
        sheet
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setNewRecipeModal({ open: false })}>Cancel</Button>
            <Button onClick={saveNewRecipe}>Save Recipe</Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <Select
              label="Menu Category"
              value={newRecipeForm.menuCategory}
              onChange={(e) => setNewRecipeForm({ ...newRecipeForm, menuCategory: e.target.value, menuItem: '', ingredients: [] })}
            >
              <option value="">Select category</option>
              <option value="Pizza">Pizza</option>
              <option value="Burger">Burger</option>
              <option value="Fries">Fries</option>
              <option value="Sandwich">Sandwich</option>
              <option value="Pasta">Pasta</option>
              <option value="Drinks">Drinks</option>
              <option value="Dessert">Dessert</option>
            </Select>
            <Select
              label="Menu Item"
              value={newRecipeForm.menuItem}
              onChange={(e) => setNewRecipeForm({ ...newRecipeForm, menuItem: e.target.value })}
              disabled={!newRecipeForm.menuCategory}
            >
              <option value="">Select menu item</option>
              {newRecipeForm.menuCategory ? menuItems.filter((item) => {
                const itemCategory = typeof item.category === 'object' ? item.category?.name || item.category?._id : item.category
                return itemCategory?.toLowerCase() === newRecipeForm.menuCategory.toLowerCase() || item._id === newRecipeForm.menuItem
              }).map((item) => <option key={item._id} value={item._id}>{item.name}</option>) : menuItems.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </Select>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4 sm:p-5">
            <div className="mb-3 flex flex-col gap-1">
              <h3 className="font-heading text-sm font-semibold text-nb-white">Ingredients</h3>
              <p className="text-xs text-nb-gray">Add the ingredients used in this menu item.</p>
            </div>

            <div className="mb-3 grid gap-3 rounded-lg border border-white/10 bg-black/30 p-3 sm:grid-cols-2 lg:grid-cols-[180px_1fr_100px_80px_auto] lg:items-end">
              <Select
                label="Product Category"
                value={newRecipeForm.tempCategory || ''}
                onChange={(e) => setNewRecipeForm({ ...newRecipeForm, tempCategory: e.target.value })}
              >
                <option value="">Select category</option>
                <option value="Frozen">Frozen</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Cooking Material">Cooking Material</option>
                <option value="Packaging">Packaging</option>
                <option value="Cleaning material">Cleaning material</option>
                <option value="Stationary">Stationary</option>
                <option value="Masala">Masala</option>
                <option value="Breads">Breads</option>
                <option value="Cold drinks">Cold drinks</option>
                <option value="Sauces">Sauces</option>
                <option value="Syrups">Syrups</option>
              </Select>
              <Select
                label="Product Name"
                value={newRecipeForm.tempProduct || ''}
                onChange={(e) => setNewRecipeForm({ ...newRecipeForm, tempProduct: e.target.value })}
                disabled={!newRecipeForm.tempCategory}
              >
                <option value="">Select product</option>
                {newRecipeForm.tempCategory ? allProducts.filter((it) => {
                  const itemCategory = typeof it.category === 'object' ? it.category?.name || it.category?._id : it.category
                  return itemCategory?.toLowerCase() === newRecipeForm.tempCategory.toLowerCase()
                }).map((item) => <option key={item._id} value={item._id}>{item.name}</option>) : allProducts.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
              </Select>
              <Input
                label="Quantity"
                type="number"
                value={newRecipeForm.tempQuantity || ''}
                onChange={(e) => setNewRecipeForm({ ...newRecipeForm, tempQuantity: Number(e.target.value) })}
              />
              <Select
                label="Unit"
                value={newRecipeForm.tempUnit || 'PCS'}
                onChange={(e) => setNewRecipeForm({ ...newRecipeForm, tempUnit: e.target.value })}
              >
                {units.map((unit) => <option key={unit}>{unit}</option>)}
              </Select>
              <Button
                fullWidth
                className="lg:mt-[22px] lg:w-auto"
                onClick={addIngredient}
                disabled={!newRecipeForm.tempCategory || !newRecipeForm.tempProduct || !newRecipeForm.tempQuantity}
              >
                <FiPlus /> Add
              </Button>
            </div>

            {newRecipeForm.ingredients.length > 0 && (
              <div className="space-y-3">
                <div className="space-y-2 md:hidden">
                  {newRecipeForm.ingredients.map((ing, idx) => {
                    const product = resolveInventoryProduct(ing.inventoryItem, allProducts)
                    const productCategory = ing.category || inventoryProductCategory(product)
                    const productName = product?.name || 'Unknown'
                    return (
                      <div key={idx} className="rounded-xl border border-white/10 bg-black/25 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words text-sm font-medium text-nb-white">{productName}</p>
                            <p className="break-words text-xs text-nb-gray">{productCategory || 'N/A'}</p>
                          </div>
                          <Button variant="danger" size="sm" className="shrink-0" onClick={() => removeIngredient(idx)}>
                            <FiTrash2 />
                          </Button>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-nb-gray">
                          <div className="rounded-lg bg-white/[0.03] px-3 py-2">
                            <span className="block text-[10px] uppercase tracking-wide">Quantity</span>
                            <span className="text-nb-white">{ing.quantity}</span>
                          </div>
                          <div className="rounded-lg bg-white/[0.03] px-3 py-2">
                            <span className="block text-[10px] uppercase tracking-wide">Unit</span>
                            <span className="text-nb-white">{ing.unit}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left">
                        <th className="pb-2 pl-2 font-medium text-nb-gray">Product Category</th>
                        <th className="pb-2 pl-2 font-medium text-nb-gray">Product Name</th>
                        <th className="pb-2 pl-2 font-medium text-nb-gray">Quantity</th>
                        <th className="pb-2 pl-2 font-medium text-nb-gray">Unit</th>
                        <th className="pb-2 pl-2 font-medium text-nb-gray">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newRecipeForm.ingredients && newRecipeForm.ingredients.length > 0 ? newRecipeForm.ingredients.map((ing, idx) => {
                        const product = resolveInventoryProduct(ing.inventoryItem, allProducts)
                        const productCategory = ing.category || inventoryProductCategory(product)
                        const productName = product?.name || 'Unknown'
                        return (
                          <tr key={idx} className="border-b border-white/5">
                            <td className="py-2 pl-2 text-nb-white">{productCategory || 'N/A'}</td>
                            <td className="py-2 pl-2 text-nb-white">{productName}</td>
                            <td className="py-2 pl-2 text-nb-white">{ing.quantity}</td>
                            <td className="py-2 pl-2 text-nb-white">{ing.unit}</td>
                            <td className="py-2 pl-2">
                              <Button variant="danger" size="sm" onClick={() => removeIngredient(idx)}><FiTrash2 /></Button>
                            </td>
                          </tr>
                        )
                      }) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!newRecipeForm.ingredients.length && <p className="py-4 text-center text-sm text-nb-gray">No ingredients added yet.</p>}
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ProductSelect({ label, items, value, onChange }) {
  return (
    <Select label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select product</option>
      {items.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
    </Select>
  )
}

function UnitSelect({ value, onChange }) {
  return (
    <Select label="Unit" value={value} onChange={(e) => onChange(e.target.value)}>
      {units.map((unit) => <option key={unit}>{unit}</option>)}
    </Select>
  )
}

function MovementCard({ title, button, onSubmit, children }) {
  return (
    <Card className="space-y-4">
      <h2 className="font-heading text-lg font-semibold">{title}</h2>
      {children}
      <Button onClick={onSubmit}>{button}</Button>
    </Card>
  )
}

function ProductTable({ rows, onEdit, onDelete, onRemoveExpired, onEditCategory, onDeleteCategory }) {
  const groupedRows = rows.reduce((acc, item) => {
    const category = item.category || 'General'
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {})

  return (
    <Card>
      <Table>
        <thead>
          <tr>
            <Th>Category</Th>
            <Th>Product</Th>
            <Th>Stock</Th>
            <Th>Min</Th>
            <Th>Expiry</Th>
            <Th>Value</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(groupedRows).map(([category, items]) => (
            <React.Fragment key={`group-${category}`}>
              <tr key={`cat-${category}`} className="bg-nb-neon-orange/20">
                <Td colSpan="7" className="py-2 font-heading font-bold text-nb-neon-orange">
                  <div className="flex items-center justify-between">
                    <span>{category}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => onEditCategory && onEditCategory(category)}><FiEdit2 /></Button>
                      <Button size="sm" variant="danger" onClick={() => onDeleteCategory && onDeleteCategory(category)}><FiTrash2 /></Button>
                    </div>
                  </div>
                </Td>
              </tr>
              {items.map((it) => {
                const low = it.quantity <= it.minStock
                const expired = it.expiryDate && new Date(it.expiryDate) < new Date()
                return (
                  <Tr key={it._id} className={low || expired ? 'bg-nb-neon-red/[0.06]' : ''}>
                    <Td>{it.category}</Td>
                    <Td>
                      <div className="font-medium">{it.name}</div>
                      <div className="font-mono text-xs text-nb-gold">{it.sku}</div>
                    </Td>
                    <Td><Badge tone={low ? 'danger' : 'success'}>{it.quantity} {it.unit}</Badge></Td>
                    <Td>{it.minStock}</Td>
                    <Td>{it.expiryDate ? new Date(it.expiryDate).toLocaleDateString() : 'None'} {expired && <Badge tone="danger">Expired</Badge>}</Td>
                    <Td>{money((it.quantity || 0) * (it.purchasePrice || 0))}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        {expired && <Button size="sm" variant="danger" onClick={() => onRemoveExpired(it._id)}>Remove</Button>}
                        <Button size="sm" variant="ghost" onClick={() => onEdit(it)}><FiEdit2 /></Button>
                        <Button size="sm" variant="danger" onClick={() => onDelete(it._id)}><FiTrash2 /></Button>
                      </div>
                    </Td>
                  </Tr>
                )
              })}
            </React.Fragment>
          ))}
        </tbody>
      </Table>
    </Card>
  )
}

function TransactionTable({ rows }) {
  return (
    <Card>
      <Table>
        <thead>
          <tr>
            <Th>Date</Th>
            <Th>Product</Th>
            <Th>Type</Th>
            <Th>Qty</Th>
            <Th>Reason</Th>
            <Th>Staff</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((tx) => (
            <Tr key={tx._id}>
              <Td>{new Date(tx.date).toLocaleDateString()}</Td>
              <Td>{tx.productName}</Td>
              <Td>{tx.type.replaceAll('_', ' ')}</Td>
              <Td>{tx.quantity} {tx.unit}</Td>
              <Td>{tx.reason || tx.department || 'Stock movement'}</Td>
              <Td>{tx.staffName || tx.approvedBy || '-'}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Card>
  )
}

function AlertList({ title, rows, action, onRemove }) {
  return (
    <Card>
      <h2 className="mb-3 font-heading text-lg font-semibold">{title}</h2>
      <div className="space-y-2">
        {rows?.length ? rows.slice(0, 8).map((row) => (
          <div key={row._id} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{row.name}</p>
              <p className="text-xs text-nb-gray">{row.quantity} {row.unit} available | Min {row.minStock}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="danger">{action}</Badge>
              {onRemove && new Date(row.expiryDate) < new Date() && <Button size="sm" variant="danger" onClick={() => onRemove(row._id)}>Remove</Button>}
            </div>
          </div>
        )) : <p className="py-6 text-center text-sm text-nb-gray">No alerts right now.</p>}
      </div>
    </Card>
  )
}

function Pagination({ currentPage, totalPages, total, setPage }) {
  return (
    <div className="flex flex-col gap-2 text-sm text-nb-gray sm:flex-row sm:items-center sm:justify-between">
      <span>{total} products</span>
      <div className="flex items-center gap-4">
        <button type="button" className="hover:text-nb-white disabled:opacity-40" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
        <span>Page {currentPage} / {totalPages}</span>
        <button type="button" className="hover:text-nb-white disabled:opacity-40" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  )
}
