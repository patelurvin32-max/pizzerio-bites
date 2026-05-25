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

export default function Menu() {
  const notify = useNotify()
  const [categories, setCategories] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, editing: null })
  const [form, setForm] = useState(emptyItem)

  const selectedCategory = useMemo(
    () => categories.find((c) => c._id === form.category),
    [categories, form.category]
  )
  const dualPricing = categoryHasDualPricing(selectedCategory)
  const variantLabel = getVariantLabel(selectedCategory)

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
          <p className="text-sm text-nb-gray">
            Changes sync to the public Pizzerio Bites site (menu, featured, and popular sections).
          </p>
        </div>
        <Button onClick={openCreate}>Add item</Button>
      </div>

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
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Item</Th>
                <Th>Category</Th>
                <Th>Price</Th>
                <Th>Flags</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <Tr key={it._id}>
                  <Td className="font-medium">{it.name}</Td>
                  <Td>{it.category?.name || '—'}</Td>
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
        )}
      </Card>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        title={modal.editing ? 'Edit menu item' : 'New menu item'}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal({ open: false, editing: null })}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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
                label="Regular"
                type="number"
                min="0"
                step="1"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
              <Input
                label={variantLabel}
                type="number"
                min="0"
                step="1"
                value={form.priceVariant}
                onChange={(e) => setForm({ ...form, priceVariant: Number(e.target.value) })}
              />
            </>
          ) : (
            <Input
              label="Price (₹)"
              type="number"
              min="0"
              step="1"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          )}
          <label className="flex items-center gap-2 text-sm text-nb-gray sm:col-span-2">
            <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
            Available
            <input className="ml-4" type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
            Featured
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
