import { useCallback, useEffect, useState } from 'react'
import Card from '../../components/common/Card.jsx'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Modal from '../../components/common/Modal.jsx'
import Table, { Th, Tr, Td } from '../../components/common/Table.jsx'
import Loader from '../../components/common/Loader.jsx'
import api from '../../services/api.js'
import { useNotify } from '../../context/NotificationContext.jsx'

const empty = { sku: '', name: '', category: 'General', quantity: 0, minStock: 5, unit: 'unit', supplier: '' }

export default function Inventory() {
  const notify = useNotify()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, editing: null })
  const [form, setForm] = useState(empty)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/inventory')
      setItems(data.items)
    } catch (e) {
      notify.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    load()
  }, [load])

  async function save() {
    try {
      if (modal.editing) await api.patch(`/api/inventory/${modal.editing}`, form)
      else await api.post('/api/inventory', form)
      notify.success('Inventory saved')
      setModal({ open: false, editing: null })
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete SKU?')) return
    try {
      await api.delete(`/api/inventory/${id}`)
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
          <h1 className="font-heading text-2xl font-bold text-nb-white">Inventory</h1>
          <p className="text-sm text-nb-gray">Par levels, suppliers, and low-stock automations.</p>
        </div>
        <Button onClick={() => { setForm(empty); setModal({ open: true, editing: null }) }}>Add SKU</Button>
      </div>
      <Card>
        {loading ? (
          <Loader />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>SKU</Th>
                <Th>Name</Th>
                <Th>Qty</Th>
                <Th>Min</Th>
                <Th>Supplier</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <Tr key={it._id}>
                  <Td className="font-mono text-xs text-nb-gold">{it.sku}</Td>
                  <Td className="font-medium">{it.name}</Td>
                  <Td>{it.quantity}</Td>
                  <Td>{it.minStock}</Td>
                  <Td className="text-xs text-nb-gray">{it.supplier || '—'}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setForm({
                            sku: it.sku,
                            name: it.name,
                            category: it.category,
                            quantity: it.quantity,
                            minStock: it.minStock,
                            unit: it.unit,
                            supplier: it.supplier,
                          })
                          setModal({ open: true, editing: it._id })
                        }}
                      >
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
        title={modal.editing ? 'Edit SKU' : 'New SKU'}
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
          <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} disabled={Boolean(modal.editing)} />
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          <Input label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          <Input label="Minimum" type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} />
          <Input label="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="sm:col-span-2" />
        </div>
      </Modal>
    </div>
  )
}
