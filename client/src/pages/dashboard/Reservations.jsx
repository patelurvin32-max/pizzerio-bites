import { useCallback, useEffect, useState } from 'react'
import { FiPlus } from 'react-icons/fi'
import Card from '../../components/common/Card.jsx'
import Button from '../../components/common/Button.jsx'
import Select from '../../components/common/Select.jsx'
import Table, { Th, Tr, Td } from '../../components/common/Table.jsx'
import Badge from '../../components/common/Badge.jsx'
import Loader from '../../components/common/Loader.jsx'
import ReservationFormModal from '../../components/reservations/ReservationFormModal.jsx'
import { reservationService } from '../../services/reservationService.js'
import { RESERVATION_STATUS_OPTIONS, canCreateReservation } from '../../utils/constants.js'
import { formatDate } from '../../utils/helpers.js'
import { useNotify } from '../../context/NotificationContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Reservations() {
  const notify = useNotify()
  const { user } = useAuth()
  const [filter, setFilter] = useState('pending')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const showCreate = canCreateReservation(user?.role)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await reservationService.list(filter ? { status: filter } : {})
      setItems(data.items)
    } catch (e) {
      notify.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [filter, notify])

  useEffect(() => {
    load()
  }, [load])

  async function patch(id, status) {
    try {
      await reservationService.update(id, { status })
      notify.success('Reservation updated')
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1 sm:max-w-xs">
          <h1 className="font-heading text-xl font-bold text-nb-white sm:text-2xl">Reservations</h1>
          <Select
            label="Status"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="mt-3 min-w-0 w-full"
          >
            <option value="">All</option>
            {RESERVATION_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll('_', ' ')}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
          {showCreate && (
            <Button fullWidth onClick={() => setCreateOpen(true)} className="shrink-0">
              <FiPlus className="h-5 w-5 shrink-0" aria-hidden />
              <span>New reservation</span>
            </Button>
          )}
          <Button variant="ghost" fullWidth onClick={load} className="shrink-0 sm:w-auto">
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        {loading ? (
          <Loader />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Guest</Th>
                <Th>Party</Th>
                <Th>When</Th>
                <Th>Slot</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <Tr key={r._id}>
                  <Td>
                    <div className="font-medium">{r.customerName}</div>
                    <div className="text-xs text-nb-gray">{r.customerEmail}</div>
                  </Td>
                  <Td>{r.partySize}</Td>
                  <Td className="text-xs text-nb-gray">{formatDate(r.date)}</Td>
                  <Td>{r.timeSlot}</Td>
                  <Td>
                    <Badge tone={r.status === 'approved' ? 'success' : r.status === 'pending' ? 'warning' : 'default'}>
                      {r.status}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => patch(r._id, 'approved')}>
                        Approve
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => patch(r._id, 'declined')}>
                        Decline
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        {!loading && items.length === 0 && (
          <p className="py-6 text-center text-sm text-nb-gray">No reservations for this status.</p>
        )}
      </Card>

      <ReservationFormModal open={createOpen} onClose={() => setCreateOpen(false)} onSaved={load} />
    </div>
  )
}
