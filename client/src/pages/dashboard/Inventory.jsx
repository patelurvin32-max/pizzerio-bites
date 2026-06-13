import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { FiAlertTriangle, FiBox, FiCheckCircle, FiDownload, FiEdit2, FiFileText, FiMoon, FiPlus, FiSearch, FiSun, FiTrash2 } from 'react-icons/fi'
import Card from '../../components/common/Card.jsx'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Select from '../../components/common/Select.jsx'
import Modal from '../../components/common/Modal.jsx'
import Table, { Th, Tr, Td } from '../../components/common/Table.jsx'
import Badge from '../../components/common/Badge.jsx'
import Loader from '../../components/common/Loader.jsx'
import api from '../../services/api.js'
import { menuService } from '../../services/menuService.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useNotify } from '../../context/NotificationContext.jsx'
import { slugify } from '../../utils/helpers.js'

const units = ['KG', 'LTR', 'PCS', 'GM', 'ML']
const tabs = ['Dashboard', 'Products', 'Stock In', 'Stock Out', 'Waste', 'Recipes', 'Closing', 'Reports']
const pageLengthOptions = [8, 15, 25, 50]
const today = () => new Date().toISOString().slice(0, 10)
const money = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0)
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
  category: 'Ingredients',
  quantity: 0,
  minStock: 5,
  unit: 'PCS',
  supplier: '',
  expiryDate: '',
  purchasePrice: 0,
}
const emptyStockIn = { productId: '', quantity: 0, unit: 'PCS', purchasePrice: 0, supplierName: '', invoiceNumber: '', date: today(), notes: '' }
const emptyStockOut = { productId: '', quantity: 0, unit: 'PCS', reason: 'Kitchen Use', department: 'Kitchen', date: today(), approvedBy: '' }
const emptyWaste = { productId: '', quantity: 0, unit: 'PCS', reason: 'Expired', date: today(), staffName: '' }
const emptyClosing = { date: today(), notes: '', confirmed: false, closedBy: '' }

function Stat({ label, value, tone = 'default', icon: Icon = FiBox }) {
  const tones = {
    default: 'from-white/10 to-white/[0.02] text-nb-white',
    warning: 'from-nb-gold/25 to-white/[0.02] text-nb-gold',
    danger: 'from-nb-neon-red/25 to-white/[0.02] text-nb-neon-red',
    success: 'from-emerald-400/20 to-white/[0.02] text-emerald-300',
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
  const { permissions } = useAuth()
  const canAccessMenu = Boolean(permissions?.menu)
  const [active, setActive] = useState('Dashboard')
  const [items, setItems] = useState([])
  const [transactions, setTransactions] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [closingPreview, setClosingPreview] = useState(null)
  const [reports, setReports] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [canManageRecipes, setCanManageRecipes] = useState(false)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState('dark')
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [pageLength, setPageLength] = useState(8)
  const [page, setPage] = useState(1)
  const [productModal, setProductModal] = useState({ open: false, editing: null })
  const [productForm, setProductForm] = useState(emptyProduct)
  const [stockInForm, setStockInForm] = useState(emptyStockIn)
  const [stockOutForm, setStockOutForm] = useState(emptyStockOut)
  const [wasteForm, setWasteForm] = useState(emptyWaste)
  const [closingForm, setClosingForm] = useState(emptyClosing)
  const [recipeMenuId, setRecipeMenuId] = useState('')
  const [recipeRows, setRecipeRows] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [inventoryRes, dashboardRes, txRes, previewRes, reportRes] = await Promise.all([
        api.get('/api/inventory'),
        api.get('/api/inventory/dashboard'),
        api.get('/api/inventory/transactions'),
        api.get('/api/inventory/closing/preview'),
        api.get('/api/inventory/reports'),
      ])
      setItems(inventoryRes.data.items)
      setDashboard(dashboardRes.data)
      setTransactions(txRes.data.items)
      setClosingPreview(previewRes.data)
      setReports(reportRes.data)
      if (!stockInForm.productId && inventoryRes.data.items[0]) {
        const first = inventoryRes.data.items[0]
        setStockInForm((f) => ({ ...f, productId: first._id, unit: first.unit }))
        setStockOutForm((f) => ({ ...f, productId: first._id, unit: first.unit }))
        setWasteForm((f) => ({ ...f, productId: first._id, unit: first.unit }))
      }

      if (canAccessMenu) {
        try {
          const menuRes = await menuService.items()
          setMenuItems(menuRes.items)
          setCanManageRecipes(true)
          if (!recipeMenuId && menuRes.items[0]) setRecipeMenuId(menuRes.items[0]._id)
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
  }, [canAccessMenu, notify, recipeMenuId, stockInForm.productId])

  useEffect(() => {
    load()
  }, [load])

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
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((it) => {
      const matchesQuery = !q || [it.name, it.sku, it.supplier, it.category].some((v) => String(v || '').toLowerCase().includes(q))
      const matchesCategory = !categoryFilter || it.category === categoryFilter
      return matchesQuery && matchesCategory
    })
  }, [items, query, categoryFilter])
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageLength))
  const currentPage = Math.min(page, totalPages)
  const pagedItems = filteredItems.slice((currentPage - 1) * pageLength, currentPage * pageLength)

  useEffect(() => {
    setPage(1)
  }, [query, categoryFilter, pageLength])

  function selectProduct(setter, productId) {
    const product = items.find((it) => it._id === productId)
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

  async function refreshClosing(date) {
    try {
      const { data } = await api.get('/api/inventory/closing/preview', { params: { date } })
      setClosingPreview(data)
    } catch (e) {
      notify.error(e.message)
    }
  }

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

  function exportCsv(name, rows) {
    const safeRows = rows || []
    if (!safeRows.length) {
      notify.error('No rows to export')
      return
    }
    const keys = Object.keys(safeRows[0]).filter((key) => !key.startsWith('_') && typeof safeRows[0][key] !== 'object')
    const csv = [keys.join(','), ...safeRows.map((row) => keys.map((key) => `"${String(row[key] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n')
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
    { name: 'Healthy', value: Math.max(0, (dashboard?.metrics?.totalProducts || 0) - (dashboard?.metrics?.lowStockItems || 0)) },
    { name: 'Low', value: dashboard?.metrics?.lowStockItems || 0 },
    { name: 'Out', value: dashboard?.metrics?.outOfStockItems || 0 },
  ]
  const pageTone = theme === 'light' ? 'bg-white/[0.08]' : ''
  const viewTabs = canManageRecipes ? tabs : tabs.filter((tab) => tab !== 'Recipes')
  const dash = dashboard || emptyDashboard

  if (loading) return <Loader label="Loading inventory module" />

  return (
    <div className={`space-y-4 ${pageTone}`}>
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-nb-white">Inventory Management</h1>
          <p className="text-sm text-nb-gray">Stock in, stock out, waste, recipes, closing stock, and reports.</p>
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
              <h2 className="mb-4 font-heading text-lg font-semibold">Daily Movement</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
                    <XAxis dataKey="name" stroke="#a0a0a0" />
                    <YAxis stroke="#a0a0a0" />
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,.12)' }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#ff7a00" />
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
                      {['#22c55e', '#ffc857', '#ff3b30'].map((color) => <Cell key={color} fill={color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,.12)' }} />
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
          <Card className="grid gap-3 lg:grid-cols-[1fr_180px_120px_120px] lg:items-end">
            <Input label="Search products" value={query} onChange={(e) => setQuery(e.target.value)} rightAddon={<FiSearch className="text-nb-gray" />} />
            <Select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All</option>
              {categories.map((cat) => <option key={cat}>{cat}</option>)}
            </Select>
            <Select label="Rows" value={pageLength} onChange={(e) => setPageLength(Number(e.target.value))}>
              {pageLengthOptions.map((n) => <option key={n}>{n}</option>)}
            </Select>
            <Button onClick={() => openProduct()}><FiPlus /> Product</Button>
          </Card>
          <ProductTable rows={pagedItems} onEdit={openProduct} onDelete={removeProduct} onRemoveExpired={removeExpired} />
          <Pagination currentPage={currentPage} totalPages={totalPages} total={filteredItems.length} setPage={setPage} />
        </div>
      )}

      {active === 'Stock In' && (
        <MovementCard title="Add Stock In" button="Add Stock In" onSubmit={() => submitMovement('/api/inventory/stock-in', stockInForm, 'Stock added', () => setStockInForm({ ...emptyStockIn, productId: stockInForm.productId, unit: stockInForm.unit }))}>
          <FieldGrid>
            <ProductSelect label="Product Name" items={items} value={stockInForm.productId} onChange={(id) => selectProduct(setStockInForm, id)} />
            <Input label="Category" value={items.find((it) => it._id === stockInForm.productId)?.category || ''} disabled />
            <Input label="Quantity Added" type="number" value={stockInForm.quantity} onChange={(e) => setStockInForm({ ...stockInForm, quantity: Number(e.target.value) })} />
            <UnitSelect value={stockInForm.unit} onChange={(unit) => setStockInForm({ ...stockInForm, unit })} />
            <Input label="Purchase Price" type="number" value={stockInForm.purchasePrice} onChange={(e) => setStockInForm({ ...stockInForm, purchasePrice: Number(e.target.value) })} />
            <Input label="Supplier Name" value={stockInForm.supplierName} onChange={(e) => setStockInForm({ ...stockInForm, supplierName: e.target.value })} />
            <Input label="Invoice Number" value={stockInForm.invoiceNumber} onChange={(e) => setStockInForm({ ...stockInForm, invoiceNumber: e.target.value })} />
            <Input label="Date" type="date" value={stockInForm.date} onChange={(e) => setStockInForm({ ...stockInForm, date: e.target.value })} />
            <Input label="Notes" value={stockInForm.notes} onChange={(e) => setStockInForm({ ...stockInForm, notes: e.target.value })} />
          </FieldGrid>
        </MovementCard>
      )}

      {active === 'Stock Out' && (
        <MovementCard title="Manual Stock Out" button="Add Stock Out" onSubmit={() => submitMovement('/api/inventory/stock-out', stockOutForm, 'Stock deducted', () => setStockOutForm({ ...emptyStockOut, productId: stockOutForm.productId, unit: stockOutForm.unit }))}>
          <FieldGrid>
            <ProductSelect label="Product Name" items={items} value={stockOutForm.productId} onChange={(id) => selectProduct(setStockOutForm, id)} />
            <Input label="Quantity Used" type="number" value={stockOutForm.quantity} onChange={(e) => setStockOutForm({ ...stockOutForm, quantity: Number(e.target.value) })} />
            <UnitSelect value={stockOutForm.unit} onChange={(unit) => setStockOutForm({ ...stockOutForm, unit })} />
            <Select label="Reason" value={stockOutForm.reason} onChange={(e) => setStockOutForm({ ...stockOutForm, reason: e.target.value })}>
              {['Kitchen Use', 'Damage', 'Adjustment'].map((v) => <option key={v}>{v}</option>)}
            </Select>
            <Select label="Department" value={stockOutForm.department} onChange={(e) => setStockOutForm({ ...stockOutForm, department: e.target.value })}>
              {['Kitchen', 'Cafe', 'Store'].map((v) => <option key={v}>{v}</option>)}
            </Select>
            <Input label="Date" type="date" value={stockOutForm.date} onChange={(e) => setStockOutForm({ ...stockOutForm, date: e.target.value })} />
            <Input label="Approved By" value={stockOutForm.approvedBy} onChange={(e) => setStockOutForm({ ...stockOutForm, approvedBy: e.target.value })} />
          </FieldGrid>
        </MovementCard>
      )}

      {active === 'Waste' && (
        <MovementCard title="Waste and Damage" button="Add Waste Entry" onSubmit={() => submitMovement('/api/inventory/waste', wasteForm, 'Waste recorded', () => setWasteForm({ ...emptyWaste, productId: wasteForm.productId, unit: wasteForm.unit }))}>
          <FieldGrid>
            <ProductSelect label="Product Name" items={items} value={wasteForm.productId} onChange={(id) => selectProduct(setWasteForm, id)} />
            <Input label="Quantity" type="number" value={wasteForm.quantity} onChange={(e) => setWasteForm({ ...wasteForm, quantity: Number(e.target.value) })} />
            <UnitSelect value={wasteForm.unit} onChange={(unit) => setWasteForm({ ...wasteForm, unit })} />
            <Select label="Reason" value={wasteForm.reason} onChange={(e) => setWasteForm({ ...wasteForm, reason: e.target.value })}>
              {['Expired', 'Spilled', 'Burnt', 'Broken'].map((v) => <option key={v}>{v}</option>)}
            </Select>
            <Input label="Date" type="date" value={wasteForm.date} onChange={(e) => setWasteForm({ ...wasteForm, date: e.target.value })} />
            <Input label="Staff Name" value={wasteForm.staffName} onChange={(e) => setWasteForm({ ...wasteForm, staffName: e.target.value })} />
          </FieldGrid>
        </MovementCard>
      )}

      {active === 'Recipes' && (
        <Card className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <Select label="Menu Item" value={recipeMenuId} onChange={(e) => setRecipeMenuId(e.target.value)}>
              {menuItems.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </Select>
            <Button onClick={() => setRecipeRows((rows) => [...rows, { inventoryItem: items[0]?._id || '', quantity: 1, unit: items[0]?.unit || 'PCS' }])}><FiPlus /> Ingredient</Button>
          </div>
          <div className="space-y-3">
            {recipeRows.map((row, idx) => (
              <div key={idx} className="grid gap-3 rounded-xl border border-white/10 bg-black/20 p-3 md:grid-cols-[1fr_140px_140px_44px]">
                <ProductSelect label="Ingredient" items={items} value={row.inventoryItem} onChange={(id) => {
                  const item = items.find((it) => it._id === id)
                  setRecipeRows((rows) => rows.map((r, i) => i === idx ? { ...r, inventoryItem: id, unit: item?.unit || r.unit } : r))
                }} />
                <Input label="Qty per order" type="number" value={row.quantity} onChange={(e) => setRecipeRows((rows) => rows.map((r, i) => i === idx ? { ...r, quantity: Number(e.target.value) } : r))} />
                <UnitSelect value={row.unit} onChange={(unit) => setRecipeRows((rows) => rows.map((r, i) => i === idx ? { ...r, unit } : r))} />
                <Button variant="danger" size="sm" className="self-end" onClick={() => setRecipeRows((rows) => rows.filter((_, i) => i !== idx))}><FiTrash2 /></Button>
              </div>
            ))}
            {!recipeRows.length && <p className="py-8 text-center text-sm text-nb-gray">No ingredients mapped yet.</p>}
          </div>
          <Button onClick={saveRecipe}>Save Recipe Mapping</Button>
        </Card>
      )}

      {active === 'Closing' && (
        <Card className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <Input label="Date" type="date" value={closingForm.date} onChange={(e) => { setClosingForm({ ...closingForm, date: e.target.value }); refreshClosing(e.target.value) }} />
            <Input label="Total Stock In" value={closingPreview?.totalStockIn || 0} disabled />
            <Input label="Total Stock Out" value={closingPreview?.totalStockOut || 0} disabled />
            <Input label="Total Waste" value={closingPreview?.totalWaste || 0} disabled />
            <Input label="Final Stock" value={closingPreview?.finalStock || 0} disabled />
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
            <Button onClick={closeDailyStock} disabled={Boolean(closingPreview?.closed)}>Close Daily Stock</Button>
            <Button variant="ghost" onClick={() => exportCsv('daily-closing-lines', closingPreview?.lines || [])}><FiDownload /> Excel</Button>
            <Button variant="ghost" onClick={exportPdf}><FiFileText /> PDF</Button>
          </div>
        </Card>
      )}

      {active === 'Reports' && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => exportCsv('stock-in-report', reports?.stockIn)}><FiDownload /> Stock In Excel</Button>
              <Button variant="ghost" onClick={() => exportCsv('stock-out-report', reports?.stockOut)}><FiDownload /> Stock Out Excel</Button>
              <Button variant="ghost" onClick={() => exportCsv('waste-report', reports?.waste)}><FiDownload /> Waste Excel</Button>
              <Button variant="ghost" onClick={() => exportCsv('inventory-summary', reports?.summary)}><FiDownload /> Summary Excel</Button>
              <Button variant="ghost" onClick={() => exportCsv('daily-closing-report', reports?.closing)}><FiDownload /> Closing Excel</Button>
              <Button variant="ghost" onClick={exportPdf}><FiFileText /> PDF</Button>
            </div>
          </Card>
          <Card>
            <h2 className="mb-4 font-heading text-lg font-semibold">Movement Trend</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={transactions.slice(0, 30).reverse().map((tx, idx) => ({ name: String(idx + 1), qty: tx.quantity }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
                  <XAxis dataKey="name" stroke="#a0a0a0" />
                  <YAxis stroke="#a0a0a0" />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid rgba(255,255,255,.12)' }} />
                  <Line type="monotone" dataKey="qty" stroke="#ffc857" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <TransactionTable rows={transactions.slice(0, 80)} />
        </div>
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
          <Input label="Category" value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} />
          <Input label="Current Stock" type="number" value={productForm.quantity} onChange={(e) => setProductForm({ ...productForm, quantity: Number(e.target.value) })} />
          <UnitSelect value={productForm.unit} onChange={(unit) => setProductForm({ ...productForm, unit })} />
          <Input label="Minimum Stock Level" type="number" value={productForm.minStock} onChange={(e) => setProductForm({ ...productForm, minStock: Number(e.target.value) })} />
          <Input label="Expiry Date" type="date" value={productForm.expiryDate} onChange={(e) => setProductForm({ ...productForm, expiryDate: e.target.value })} />
          <Input label="Purchase Price" type="number" value={productForm.purchasePrice} onChange={(e) => setProductForm({ ...productForm, purchasePrice: Number(e.target.value) })} />
          <Input label="Supplier Name" value={productForm.supplier} onChange={(e) => setProductForm({ ...productForm, supplier: e.target.value })} />
        </FieldGrid>
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

function ProductTable({ rows, onEdit, onDelete, onRemoveExpired }) {
  return (
    <Card>
      <Table>
        <thead>
          <tr>
            <Th>Product</Th>
            <Th>Category</Th>
            <Th>Stock</Th>
            <Th>Min</Th>
            <Th>Expiry</Th>
            <Th>Value</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((it) => {
            const low = it.quantity <= it.minStock
            const expired = it.expiryDate && new Date(it.expiryDate) < new Date()
            return (
              <Tr key={it._id} className={low || expired ? 'bg-nb-neon-red/[0.06]' : ''}>
                <Td>
                  <div className="font-medium">{it.name}</div>
                  <div className="font-mono text-xs text-nb-gold">{it.sku}</div>
                </Td>
                <Td>{it.category}</Td>
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
