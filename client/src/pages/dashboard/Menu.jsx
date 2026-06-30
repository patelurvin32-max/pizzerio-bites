import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { FiChevronDown, FiChevronRight, FiEdit2, FiTrash2 } from 'react-icons/fi'
import Card from '../../components/common/Card.jsx'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Modal from '../../components/common/Modal.jsx'
import Badge from '../../components/common/Badge.jsx'
import Loader from '../../components/common/Loader.jsx'
import { menuService } from '../../services/menuService.js'
import { useNotify } from '../../context/NotificationContext.jsx'
import { slugify } from '../../utils/helpers.js'
import { categoryHasDualPricing, formatMenuItemPrice, getVariantLabel } from '../../utils/menuPricing.js'

const emptyItem = {
  name: '',
  slug: '',
  description: '',
  price: 0,
  priceVariant: 0,
  category: '',
  available: true,
  featured: false,
  tagsInput: '',
}

const emptyCat = { name: '', slug: '', description: '', sortOrder: 0, active: true, dualPricing: false, variantLabel: 'Extra Cheese' }

const pageLengthOptions = [10, 25, 50]

export default function Menu() {
  const notify = useNotify()
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, editing: null, type: 'item' })
  const [form, setForm] = useState(emptyItem)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageLength, setPageLength] = useState(10)
  const [categoryFilter, setCategoryFilter] = useState('all')

  const selectedCategory = useMemo(
    () => categories.find((c) => c._id === form.category),
    [categories, form.category]
  )
  const dualPricing = categoryHasDualPricing(selectedCategory)
  const variantLabel = getVariantLabel(selectedCategory)

  const categoriesWithItems = useMemo(() => {
    return categories
      .map((cat) => ({
        ...cat,
        items: items.filter((item) => (item.category?._id || item.category) === cat._id),
      }))
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  }, [categories, items])

  const allProductsWithCategory = useMemo(() => {
    const result = []
    categoriesWithItems.forEach((cat) => {
      cat.items.forEach((item) => {
        result.push({ ...item, category: cat })
      })
    })
    if (categoryFilter !== 'all') {
      return result.filter((item) => (item.category?._id || item.category) === categoryFilter)
    }
    return result
  }, [categoriesWithItems, categoryFilter])

  const paginatedProducts = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(allProductsWithCategory.length / pageLength))
    const currentPageSafe = Math.min(currentPage, totalPages)
    const start = (currentPageSafe - 1) * pageLength
    const end = start + pageLength
    const pageProducts = allProductsWithCategory.slice(start, end)
    
    return {
      products: pageProducts,
      currentPage: currentPageSafe,
      totalPages,
      totalItems: allProductsWithCategory.length,
      pageStart: allProductsWithCategory.length ? start + 1 : 0,
      pageEnd: Math.min(end, allProductsWithCategory.length),
    }
  }, [allProductsWithCategory, currentPage, pageLength])

  useEffect(() => {
    setCurrentPage(1)
  }, [pageLength, categoryFilter])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, m] = await Promise.all([
        menuService.categories(),
        menuService.items({ limit: 1000 })
      ])
      setCategories(c.items)
      setItems(m.items)
    } catch (e) {
      notify.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    load()
  }, [load])

  function openCreateItem() {
    if (!categories.length) {
      notify.error('Add at least one category before creating menu items.')
      return
    }
    setForm({ ...emptyItem, category: categories[0]._id })
    setModal({ open: true, editing: null, type: 'item' })
  }

  function openEditItem(row) {
    setForm({
      name: row.name,
      slug: row.slug,
      description: row.description,
      price: row.price,
      priceVariant: row.priceVariant ?? 0,
      category: row.category?._id || row.category,
      available: row.available,
      featured: row.featured,
      tagsInput: (row.tags || []).join(', '),
    })
    setModal({ open: true, editing: row._id, type: 'item' })
  }

  function openCreateCategory() {
    setForm(emptyCat)
    setModal({ open: true, editing: null, type: 'category' })
  }

  function openEditCategory(cat) {
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      sortOrder: cat.sortOrder,
      active: cat.active,
      dualPricing: Boolean(cat.dualPricing),
      variantLabel: cat.variantLabel || 'Extra Cheese',
    })
    setModal({ open: true, editing: cat._id, type: 'category' })
  }

  async function saveItem() {
    if (!form.category) {
      notify.error('Select a category for this item.')
      return
    }
    const cat = categories.find((c) => c._id === form.category)
    if (categoryHasDualPricing(cat)) {
      if (!form.price || !form.priceVariant) {
        notify.error(`Enter both Regular and ${getVariantLabel(cat)} prices.`)
        return
      }
    } else if (!form.price) {
      notify.error('Enter a price.')
      return
    }

    try {
      const { tagsInput, ...rest } = form
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      const body = {
        ...rest,
        tags,
        slug: form.slug || slugify(form.name),
        price: Number(form.price) || 0,
      }
      if (categoryHasDualPricing(cat)) {
        body.priceVariant = Number(form.priceVariant) || 0
      } else {
        body.priceVariant = null
      }
      await menuService.saveItem(modal.editing ? { _id: modal.editing, ...body } : body)
      notify.success('Menu item saved')
      setModal({ open: false, editing: null, type: 'item' })
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function saveCategory() {
    try {
      const body = { ...form, slug: form.slug || slugify(form.name) }
      await menuService.saveCategory(modal.editing ? { _id: modal.editing, ...body } : body)
      notify.success('Category saved')
      setModal({ open: false, editing: null, type: 'category' })
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function removeItem(id) {
    if (!window.confirm('Delete item?')) return
    try {
      await menuService.deleteItem(id)
      notify.success('Removed')
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function removeCategory(id) {
    if (!window.confirm('Delete category? This will also remove all items in this category.')) return
    try {
      await menuService.deleteCategory(id)
      notify.success('Deleted')
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }


  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-nb-white">Menu</h1>
          
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
          <Button variant="ghost" onClick={openCreateCategory} className="w-full sm:w-auto">
            Add Category
          </Button>
          <Button onClick={openCreateItem} className="w-full sm:w-auto">Add Product</Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <Loader />
        </Card>
      ) : categories.length === 0 ? (
        <Card>
          <p className="py-10 text-center text-sm text-nb-gray">
            No categories yet. Click <span className="text-nb-cream">Add Category</span> to create your first category.
          </p>
        </Card>
      ) : allProductsWithCategory.length === 0 ? (
        <Card>
          <p className="py-10 text-center text-sm text-nb-gray">
            No menu items yet. Click <span className="text-nb-cream">Add Product</span> to create your first item.
          </p>
        </Card>
      ) : (
        <Card>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-medium uppercase tracking-wide text-nb-gray">Rows per page:</span>
              <select
                value={pageLength}
                onChange={(e) => setPageLength(Number(e.target.value))}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-nb-white focus:border-nb-neon-orange focus:outline-none focus:ring-1 focus:ring-nb-neon-orange"
              >
                {pageLengthOptions.map((length) => (
                  <option key={length} value={length}>
                    {length}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-3 flex-1 mx-0 sm:mx-3">
              <div className="flex overflow-x-auto gap-2 sm:flex-wrap sm:justify-center scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`touch-manipulation min-h-[44px] shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition active:scale-95 ${
                    categoryFilter === 'all'
                      ? 'border-nb-neon-orange bg-nb-neon-orange text-black shadow-[0_0_18px_rgba(255,122,0,0.3)]'
                      : 'border-white/10 bg-black/40 text-nb-gray hover:border-nb-neon-orange/40 hover:text-nb-cream'
                  }`}
                >
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => setCategoryFilter(c._id)}
                    className={`touch-manipulation min-h-[44px] shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition active:scale-95 ${
                      categoryFilter === c._id
                        ? 'border-nb-neon-orange bg-nb-neon-orange text-black shadow-[0_0_18px_rgba(255,122,0,0.3)]'
                        : 'border-white/10 bg-black/40 text-nb-gray hover:border-nb-neon-orange/40 hover:text-nb-cream'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-nb-gray shrink-0">
              Showing {paginatedProducts.pageStart}-{paginatedProducts.pageEnd} of {paginatedProducts.totalItems} records
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-nb-gray">Category</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-nb-gray">Item</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-nb-gray">Price</th>
                  <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-nb-gray">Flags</th>
                  <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-nb-gray">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.products.map((product, index) => {
                  const showCategoryHeader = index === 0 || product.category._id !== paginatedProducts.products[index - 1]?.category?._id
                  return (
                    <React.Fragment key={product._id}>
                      {showCategoryHeader && (
                        <tr className="bg-white/[0.02]">
                          <td colSpan={5} className="px-3 py-2">
                            <div className="flex items-center justify-between">
                              <h3 className="font-heading text-sm font-semibold text-nb-white">{product.category.name}</h3>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="ghost" onClick={() => openEditCategory(product.category)} className="min-h-[44px] min-w-[44px]">
                                  <FiEdit2 className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => removeCategory(product.category._id)} className="min-h-[44px] min-w-[44px]">
                                  <FiTrash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr className="border-b border-white/5 last:border-0">
                        <td className="px-3 py-3 text-sm text-nb-gray">
                          {showCategoryHeader ? product.category.name : ''}
                        </td>
                        <td className="px-3 py-3 text-sm font-medium text-nb-white max-w-[200px] truncate" title={product.name}>{product.name}</td>
                        <td className="px-3 py-3 text-sm text-nb-white">{formatMenuItemPrice(product, product.category)}</td>
                        <td className="px-3 py-3 text-sm">
                          <div className="flex gap-2">
                            {product.featured && <Badge tone="warning">Featured</Badge>}
                            {product.tags?.includes('popular') && <Badge tone="info">Popular</Badge>}
                            <Badge tone={product.available ? 'success' : 'danger'}>{product.available ? 'Available' : 'Hidden'}</Badge>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => openEditItem(product)} className="min-h-[44px] min-w-[44px]">
                              Edit
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => removeItem(product._id)} className="min-h-[44px] min-w-[44px]">
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-3 text-sm text-nb-gray sm:flex-row sm:items-center sm:justify-between">
            <span>{paginatedProducts.totalItems} items</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="min-h-[44px] min-w-[80px] rounded-lg border border-white/10 px-3 py-2 hover:border-nb-neon-orange/40 hover:text-nb-white disabled:opacity-40 transition"
                disabled={paginatedProducts.currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                Previous
              </button>
              <span className="min-h-[44px] flex items-center">Page {paginatedProducts.currentPage} / {paginatedProducts.totalPages}</span>
              <button
                type="button"
                className="min-h-[44px] min-w-[80px] rounded-lg border border-white/10 px-3 py-2 hover:border-nb-neon-orange/40 hover:text-nb-white disabled:opacity-40 transition"
                disabled={paginatedProducts.currentPage >= paginatedProducts.totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </Card>
      )}

      <Modal
        open={modal.open && modal.type === 'item'}
        onClose={() => setModal({ open: false, editing: null, type: 'item' })}
        title={modal.editing ? 'Edit menu item' : 'New menu item'}
        wide
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button variant="ghost" onClick={() => setModal({ open: false, editing: null, type: 'item' })}>
              Cancel
            </Button>
            <Button onClick={saveItem}>Save</Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter item name" />
          <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from name if empty" />
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-nb-gray">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-nb-white focus:border-nb-neon-orange focus:outline-none focus:ring-1 focus:ring-nb-neon-orange"
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {dualPricing ? (
            <>
              <Input
                label="Regular Price"
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                placeholder="Enter regular price"
              />
              <Input
                label={`${variantLabel} Price`}
                type="number"
                min="0"
                step="1"
                value={form.priceVariant}
                onChange={(e) => setForm({ ...form, priceVariant: Number(e.target.value) })}
                placeholder="Enter Extra Cheese price"
              />
            </>
          ) : (
            <Input
              label="Price (Rs)"
              type="number"
              min="0"
              step="1"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              placeholder="Enter price"
            />
          )}
          <label className="flex flex-wrap items-center gap-3 text-sm text-nb-gray sm:col-span-2">
            <span className="inline-flex items-center gap-2">
              <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
              Available
            </span>
            <span className="inline-flex items-center gap-2">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
              Featured
            </span>
          </label>
          <Input
            label="Tags"
            value={form.tagsInput}
            onChange={(e) => setForm({ ...form, tagsInput: e.target.value })}
            placeholder="popular (comma-separated)"
            className="sm:col-span-2"
          />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="sm:col-span-2" />
        </div>
      </Modal>

      <Modal
        open={modal.open && modal.type === 'category'}
        onClose={() => setModal({ open: false, editing: null, type: 'category' })}
        title={modal.editing ? 'Edit category' : 'New category'}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button variant="ghost" onClick={() => setModal({ open: false, editing: null, type: 'category' })}>
              Cancel
            </Button>
            <Button onClick={saveCategory}>Save</Button>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <Input label="Sort order" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
          <label className="flex items-center gap-2 text-sm text-nb-gray">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active
          </label>
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="sm:col-span-2" />
          <label className="flex items-center gap-2 text-sm text-nb-gray sm:col-span-2">
            <input
              type="checkbox"
              checked={form.dualPricing}
              onChange={(e) => setForm({ ...form, dualPricing: e.target.checked })}
            />
            Two prices (Regular + variant, e.g. Pizza / Burger)
          </label>
          {form.dualPricing && (
            <Input
              label="Variant label"
              value={form.variantLabel}
              onChange={(e) => setForm({ ...form, variantLabel: e.target.value })}
              placeholder="Extra Cheese or With Cheese"
              className="sm:col-span-2"
            />
          )}
        </div>
      </Modal>
    </div>
  )
}
