import { useCallback, useEffect, useState } from 'react'
import Card from '../../components/common/Card.jsx'
import Button from '../../components/common/Button.jsx'
import Table, { Th, Tr, Td } from '../../components/common/Table.jsx'
import Badge from '../../components/common/Badge.jsx'
import Loader from '../../components/common/Loader.jsx'
import api from '../../services/api.js'
import { useNotify } from '../../context/NotificationContext.jsx'
import { formatDate } from '../../utils/helpers.js'

export default function Messages() {
  const notify = useNotify()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/messages')
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

  async function markRead(id, read) {
    try {
      await api.patch(`/api/messages/${id}`, { read })
      notify.success('Updated')
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-nb-white">Contact messages</h1>
          <p className="text-sm text-nb-gray">Concierge inbox synced with the public Pizzerio Bites site.</p>
        </div>
        <Button variant="ghost" onClick={load}>
          Refresh
        </Button>
      </div>
      <Card>
        {loading ? (
          <Loader />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>From</Th>
                <Th>Subject</Th>
                <Th>Received</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((m) => (
                <Tr key={m._id}>
                  <Td>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-nb-gray">{m.email}</div>
                  </Td>
                  <Td className="max-w-xs truncate">{m.subject || '—'}</Td>
                  <Td className="text-xs text-nb-gray">{formatDate(m.createdAt)}</Td>
                  <Td>
                    <Badge tone={m.read ? 'success' : 'warning'}>{m.read ? 'read' : 'new'}</Badge>
                  </Td>
                  <Td className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => markRead(m._id, !m.read)}>
                      Toggle read
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  )
}
