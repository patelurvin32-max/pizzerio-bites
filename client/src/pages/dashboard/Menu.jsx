import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/common/Card.jsx'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Select from '../../components/common/Select.jsx'
import Modal from '../../components/common/Modal.jsx'
import Table, { Th, Tr, Td } from '../../components/common/Table.jsx'
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

const pageLengthOptions = [10, 25, 50, 100]

export default function Menu() {
  const notify = useNotify()
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, editing: null })
  const [form, setForm] = useState(emptyItem)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [pageLength, setPageLength] = useState(10)
  const [page, setPage] = useState(1)

  const selectedCategory = useMemo(
    () => categories.find((c) => c._id === form.category),
    [categories, form.category]
  )
  const dualPricing = categoryHasDualPricing(selectedCategory)
  const variantLabel = getVariantLabel(selectedCategory)
  const filteredItems = useMemo(() => {
    if (!categoryFilter) return items
    return items.filter((item) => (item.category?._id || item.category) === categoryFilter)
  }, [items, categoryFilter])
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageLength))
  const currentPage = Math.min(page, totalPages)
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageLength
    return filteredItems.slice(start, start + pageLength)
  }, [filteredItems, currentPage, pageLength])
  const pageStart = filteredItems.length ? (currentPage - 1) * pageLength + 1 : 0
  const pageEnd = Math.min(currentPage * pageLength, filteredItems.length)

  useEffect(() => {
    setPage(1)
  }, [categoryFilter, pageLength])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, m] = await Promise.all([menuService.categories(), menuService.items()])
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

  function openCreate() {
    if (!categories.length) {
      notify.error('Add at least one category before creating menu items.')
      return
    }
    setForm({ ...emptyItem, category: categories[0]._id })
    setModal({ open: true, editing: null })
  }

  function openEdit(row) {
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
    setModal({ open: true, editing: row._id })
  }

  async function save() {
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
      setModal({ open: false, editing: null })
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete item?')) return
    try {
      await menuService.deleteItem(id)
      notify.success('Removed')
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
        <Button onClick={openCreate}>Add item</Button>
      </div>

      <Card className="flex flex-col gap-2 !p-3 sm:flex-row sm:items-end sm:gap-4">
        <div className="w-full sm:w-28">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-nb-gray">Page length</p>
          <Select value={pageLength} onChange={(e) => setPageLength(Number(e.target.value))}>
            {pageLengthOptions.map((length) => (
              <option key={length} value={length}>
                {length}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-full sm:w-52">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-nb-gray">Filter category</p>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {!loading && !categories.length && (
        <p className="rounded-xl border border-nb-neon-orange/30 bg-nb-neon-orange/10 px-4 py-3 text-sm text-nb-cream">
          No categories yet.{' '}
          <Link to="/dashboard/categories" className="font-semibold text-nb-neon-orange underline-offset-2 hover:underline">
            Create categories
          </Link>{' '}
          first, then add menu items.
        </p>
      )}

      <Card>
        {loading ? (
          <Loader />
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-nb-gray">
            No menu items yet. Click <span className="text-nb-cream">Add item</span> to create your first dish.
          </p>
        ) : filteredItems.length === 0 ? (
          <p className="py-10 text-center text-sm text-nb-gray">No menu items match this category.</p>
        ) : (
          <>
            <div className="space-y-3 sm:hidden">
              {pagedItems.map((it) => (
                <div key={it._id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="grid grid-cols-2 gap-2 text-xs uppercase tracking-wide text-nb-gray">
                    <span>Category</span>
                    <span>Item</span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-sm text-nb-white">
                    <span>{it.category?.name || '—'}</span>
                    <span className="font-medium">{it.name}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-nb-gray">Price</span>
                    <span className="text-nb-white">{formatMenuItemPrice(it, it.category)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {it.featured && <Badge tone="warning">Featured</Badge>}
                    {it.tags?.includes('popular') && <Badge tone="info">Popular</Badge>}
                    <Badge tone={it.available ? 'success' : 'danger'}>{it.available ? 'Available' : 'Hidden'}</Badge>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="ghost" className="flex-1" onClick={() => openEdit(it)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" className="flex-1" onClick={() => remove(it._id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden sm:block">
              <Table>
                <thead>
                  <tr>
                    <Th>Category</Th>
                    <Th>Item</Th>
                    <Th>Price</Th>
                    <Th>Flags</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {pagedItems.map((it) => (
                    <Tr key={it._id}>
                      <Td>{it.category?.name || '—'}</Td>
                      <Td className="font-medium">{it.name}</Td>
                      <Td>{formatMenuItemPrice(it, it.category)}</Td>
                      <Td className="space-x-2">
                        {it.featured && <Badge tone="warning">Featured</Badge>}
                        {it.tags?.includes('popular') && <Badge tone="info">Popular</Badge>}
                        <Badge tone={it.available ? 'success' : 'danger'}>{it.available ? 'Available' : 'Hidden'}</Badge>
                      </Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(it)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => remove(it._id)}>
                            Delete
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div className="mt-4 flex flex-col gap-3 text-sm text-nb-gray sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {pageStart}-{pageEnd} of {filteredItems.length}
              </span>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <button type="button" className="hover:text-nb-white disabled:opacity-40" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </button>
                <span>
                  Page {currentPage} / {totalPages}
                </span>
                <button type="button" className="hover:text-nb-white disabled:opacity-40" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        title={modal.editing ? 'Edit menu item' : 'New menu item'}
        wide
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button variant="ghost" onClick={() => setModal({ open: false, editing: null })}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter item name" />
          <Input label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from name if empty" />
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
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
    </div>
  )
}
