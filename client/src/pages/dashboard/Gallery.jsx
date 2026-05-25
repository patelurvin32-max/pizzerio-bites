import { useCallback, useEffect, useState } from 'react'
import Card from '../../components/common/Card.jsx'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Modal from '../../components/common/Modal.jsx'
import Table, { Th, Tr, Td } from '../../components/common/Table.jsx'
import Loader from '../../components/common/Loader.jsx'
import api from '../../services/api.js'
import { useNotify } from '../../context/NotificationContext.jsx'

const empty = { title: '', imageUrl: '', sortOrder: 0, featured: false }

export default function Gallery() {
  const notify = useNotify()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, editing: null })
  const [form, setForm] = useState(empty)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/gallery')
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
      if (modal.editing) await api.patch(`/api/gallery/${modal.editing}`, form)
      else await api.post('/api/gallery', form)
      notify.success('Gallery saved')
      setModal({ open: false, editing: null })
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete image?')) return
    try {
      await api.delete(`/api/gallery/${id}`)
      notify.success('Removed')
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-nb-white">Gallery</h1>
          <p className="text-sm text-nb-gray">Curate cinematic visuals for web, social, and in-venue loops.</p>
        </div>
        <Button onClick={() => { setForm(empty); setModal({ open: true, editing: null }) }}>Add image</Button>
      </div>
      <Card>
        {loading ? (
          <Loader />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Preview</Th>
                <Th>Title</Th>
                <Th>Order</Th>
                <Th>Featured</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((g) => (
                <Tr key={g._id}>
                  <Td>
                    <img src={g.imageUrl} alt="" className="h-14 w-24 rounded-lg object-cover ring-1 ring-white/10" />
                  </Td>
                  <Td>{g.title || '—'}</Td>
                  <Td>{g.sortOrder}</Td>
                  <Td>{g.featured ? 'Yes' : 'No'}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setForm({ title: g.title, imageUrl: g.imageUrl, sortOrder: g.sortOrder, featured: g.featured })
                          setModal({ open: true, editing: g._id })
                        }}
                      >
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => remove(g._id)}>
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
        title="Gallery item"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal({ open: false, editing: null })}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
          <Input label="Sort order" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
          <label className="flex items-center gap-2 text-sm text-nb-gray">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
            Featured
          </label>
        </div>
      </Modal>
    </div>
  )
}
