import { useCallback, useEffect, useState } from 'react'
import Card from '../../components/common/Card.jsx'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Select from '../../components/common/Select.jsx'
import Modal from '../../components/common/Modal.jsx'
import Table, { Th, Tr, Td } from '../../components/common/Table.jsx'
import Badge from '../../components/common/Badge.jsx'
import Loader from '../../components/common/Loader.jsx'
import api from '../../services/api.js'
import { useNotify } from '../../context/NotificationContext.jsx'
import { formatCurrency, formatDate } from '../../utils/helpers.js'

const emptyOffer = { title: '', description: '', code: '', discountType: 'percent', discountValue: 10, active: true }

export default function Offers() {
  const notify = useNotify()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, editing: null })
  const [form, setForm] = useState(emptyOffer)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/offers')
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
      if (modal.editing) await api.patch(`/api/offers/${modal.editing}`, form)
      else await api.post('/api/offers', form)
      notify.success('Offer saved')
      setModal({ open: false, editing: null })
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete offer?')) return
    try {
      await api.delete(`/api/offers/${id}`)
      notify.success('Deleted')
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  function openCreate() {
    setForm(emptyOffer)
    setModal({ open: true, editing: null })
  }

  function openEdit(row) {
    setForm({
      title: row.title,
      description: row.description,
      code: row.code,
      discountType: row.discountType,
      discountValue: row.discountValue,
      active: row.active,
    })
    setModal({ open: true, editing: row._id })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-nb-white">Offers & discounts</h1>
          <p className="text-sm text-nb-gray">Campaign codes, happy-hour math, and promo windows.</p>
        </div>
        <Button onClick={openCreate}>New offer</Button>
      </div>
      <Card>
        {loading ? (
          <Loader />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Code</Th>
                <Th>Value</Th>
                <Th>Window</Th>
                <Th>Active</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <Tr key={o._id}>
                  <Td className="font-medium">{o.title}</Td>
                  <Td className="font-mono text-xs text-nb-gold">{o.code || '—'}</Td>
                  <Td>
                    {o.discountType === 'percent' ? `${o.discountValue}%` : formatCurrency(o.discountValue)}
                  </Td>
                  <Td className="text-xs text-nb-gray">
                    {o.startsAt ? formatDate(o.startsAt) : 'open'} → {o.endsAt ? formatDate(o.endsAt) : 'open'}
                  </Td>
                  <Td>
                    <Badge tone={o.active ? 'success' : 'warning'}>{o.active ? 'live' : 'paused'}</Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(o)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => remove(o._id)}>
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
        title={modal.editing ? 'Edit offer' : 'Create offer'}
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
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="sm:col-span-2" />
          <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          <Select label="Discount type" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
            <option value="percent">Percent</option>
            <option value="fixed">Fixed amount</option>
          </Select>
          <Input label="Value" type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} />
          <label className="flex items-center gap-2 text-sm text-nb-gray">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active
          </label>
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="sm:col-span-2" />
        </div>
      </Modal>
    </div>
  )
}
