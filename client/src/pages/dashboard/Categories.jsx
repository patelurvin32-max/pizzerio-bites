import { useCallback, useEffect, useState } from 'react'
import Card from '../../components/common/Card.jsx'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Modal from '../../components/common/Modal.jsx'
import Table, { Th, Tr, Td } from '../../components/common/Table.jsx'
import Loader from '../../components/common/Loader.jsx'
import { menuService } from '../../services/menuService.js'
import { useNotify } from '../../context/NotificationContext.jsx'
import { slugify } from '../../utils/helpers.js'

const emptyCat = { name: '', slug: '', description: '', sortOrder: 0, active: true, dualPricing: false, variantLabel: 'Extra Cheese' }

export default function Categories() {
  const notify = useNotify()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, editing: null })
  const [form, setForm] = useState(emptyCat)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const c = await menuService.categories()
      setItems(c.items)
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
    setForm(emptyCat)
    setModal({ open: true, editing: null })
  }

  function openEdit(row) {
    setForm({
      name: row.name,
      slug: row.slug,
      description: row.description,
      sortOrder: row.sortOrder,
      active: row.active,
      dualPricing: Boolean(row.dualPricing),
      variantLabel: row.variantLabel || 'Extra Cheese',
    })
    setModal({ open: true, editing: row._id })
  }

  async function save() {
    try {
      const body = { ...form, slug: form.slug || slugify(form.name) }
      await menuService.saveCategory(modal.editing ? { _id: modal.editing, ...body } : body)
      notify.success('Category saved')
      setModal({ open: false, editing: null })
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete category?')) return
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-nb-white">Categories</h1>
          <p className="text-sm text-nb-gray">Structure the menu lanes for Pizzerio Bites service.</p>
        </div>
        <Button onClick={openCreate}>Add category</Button>
      </div>
      <Card>
        {loading ? (
          <Loader />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Slug</Th>
                <Th>Order</Th>
                <Th>Active</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <Tr key={c._id}>
                  <Td className="font-medium">{c.name}</Td>
                  <Td className="font-mono text-xs">{c.slug}</Td>
                  <Td>{c.sortOrder}</Td>
                  <Td>{c.active ? 'Yes' : 'No'}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => remove(c._id)}>
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
        title={modal.editing ? 'Edit category' : 'New category'}
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
