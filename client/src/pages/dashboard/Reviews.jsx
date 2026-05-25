import { useCallback, useEffect, useState } from 'react'
import Card from '../../components/common/Card.jsx'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Modal from '../../components/common/Modal.jsx'
import Table, { Th, Tr, Td } from '../../components/common/Table.jsx'
import Loader from '../../components/common/Loader.jsx'
import api from '../../services/api.js'
import { useNotify } from '../../context/NotificationContext.jsx'

const empty = { authorName: '', authorTitle: '', rating: 5, body: '', featured: false, visible: true }

export default function Reviews() {
  const notify = useNotify()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, editing: null })
  const [form, setForm] = useState(empty)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/reviews')
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
      if (modal.editing) await api.patch(`/api/reviews/${modal.editing}`, form)
      else await api.post('/api/reviews', form)
      notify.success('Review saved')
      setModal({ open: false, editing: null })
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete review?')) return
    try {
      await api.delete(`/api/reviews/${id}`)
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
          <h1 className="font-heading text-2xl font-bold text-nb-white">Reviews & testimonials</h1>
          <p className="text-sm text-nb-gray">Spotlight VIP quotes for the public site.</p>
        </div>
        <Button onClick={() => { setForm(empty); setModal({ open: true, editing: null }) }}>Add review</Button>
      </div>
      <Card>
        {loading ? (
          <Loader />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Author</Th>
                <Th>Rating</Th>
                <Th>Body</Th>
                <Th>Flags</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <Tr key={r._id}>
                  <Td>
                    <div className="font-medium">{r.authorName}</div>
                    <div className="text-xs text-nb-gray">{r.authorTitle}</div>
                  </Td>
                  <Td>{r.rating}★</Td>
                  <Td className="max-w-xs truncate text-sm text-nb-gray">{r.body}</Td>
                  <Td className="text-xs text-nb-gray">
                    {r.featured ? 'featured ' : ''}
                    {r.visible ? 'visible' : 'hidden'}
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setForm({
                            authorName: r.authorName,
                            authorTitle: r.authorTitle,
                            rating: r.rating,
                            body: r.body,
                            featured: r.featured,
                            visible: r.visible,
                          })
                          setModal({ open: true, editing: r._id })
                        }}
                      >
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => remove(r._id)}>
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
        title="Review"
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
          <Input label="Author" value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} />
          <Input label="Title / role" value={form.authorTitle} onChange={(e) => setForm({ ...form, authorTitle: e.target.value })} />
          <Input label="Rating" type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
          <label className="flex items-center gap-2 text-sm text-nb-gray">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
            Featured
          </label>
          <label className="flex items-center gap-2 text-sm text-nb-gray sm:col-span-2">
            <input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} />
            Visible on site
          </label>
          <Input label="Quote" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="sm:col-span-2" />
        </div>
      </Modal>
    </div>
  )
}
