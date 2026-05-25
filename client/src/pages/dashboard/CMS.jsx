import { useCallback, useEffect, useState } from 'react'
import Card from '../../components/common/Card.jsx'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Modal from '../../components/common/Modal.jsx'
import Table, { Th, Tr, Td } from '../../components/common/Table.jsx'
import Loader from '../../components/common/Loader.jsx'
import api from '../../services/api.js'
import { useNotify } from '../../context/NotificationContext.jsx'

const presets = [
  { key: 'hero', section: 'homepage', hint: 'Hero headline & CTAs' },
  { key: 'footer', section: 'layout', hint: 'Footer copy & links' },
  { key: 'social', section: 'layout', hint: 'Social URLs' },
  { key: 'contact', section: 'layout', hint: 'Phone, address, hours' },
]

export default function CMS() {
  const notify = useNotify()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, row: null })
  const [json, setJson] = useState('{}')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/cms')
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

  function open(row) {
    setModal({ open: true, row })
    setJson(JSON.stringify(row.value, null, 2))
  }

  async function save() {
    try {
      const value = JSON.parse(json)
      await api.post('/api/cms', { key: modal.row.key, section: modal.row.section, value })
      notify.success('CMS block saved')
      setModal({ open: false, row: null })
      load()
    } catch (e) {
      notify.error(e.message || 'Invalid JSON')
    }
  }

  async function seed() {
    try {
      for (const p of presets) {
        const exists = items.find((i) => i.key === p.key)
        if (!exists) {
          await api.post('/api/cms', {
            key: p.key,
            section: p.section,
            value: p.key === 'hero' ? { title: 'Pizzerio Bites', subtitle: 'Fresh pizza, bold flavor' } : { body: 'Update me' },
          })
        }
      }
      notify.success('Presets ensured')
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-nb-white">Website CMS</h1>
          <p className="text-sm text-nb-gray">Hero, banners, offers copy, testimonials, and contact blocks.</p>
        </div>
        <Button variant="ghost" onClick={seed}>
          Ensure presets
        </Button>
      </div>
      <Card>
        {loading ? (
          <Loader />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Key</Th>
                <Th>Section</Th>
                <Th>Preview</Th>
                <Th className="text-right">Edit</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <Tr key={row._id}>
                  <Td className="font-mono text-xs text-nb-gold">{row.key}</Td>
                  <Td>{row.section}</Td>
                  <Td className="max-w-md truncate text-xs text-nb-gray">{JSON.stringify(row.value)}</Td>
                  <Td className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => open(row)}>
                      Edit JSON
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, row: null })}
        title={`Edit ${modal.row?.key || ''}`}
        wide
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal({ open: false, row: null })}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </>
        }
      >
        <label className="block space-y-2 text-xs font-semibold uppercase tracking-wide text-nb-gray">
          Value (JSON)
          <textarea
            className="min-h-[240px] w-full rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-nb-white outline-none focus:border-nb-neon-orange/50"
            value={json}
            onChange={(e) => setJson(e.target.value)}
          />
        </label>
      </Modal>
    </div>
  )
}
