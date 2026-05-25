import { useEffect, useState } from 'react'
import Modal from '../common/Modal.jsx'
import Button from '../common/Button.jsx'
import Input from '../common/Input.jsx'
import Select from '../common/Select.jsx'
import CalendarDatePicker from './CalendarDatePicker.jsx'
import { reservationService } from '../../services/reservationService.js'
import {
  GUEST_OPTIONS,
  RESERVATION_STATUS_OPTIONS,
  RESERVATION_TIME_SLOTS,
  TABLE_TYPES,
} from '../../utils/constants.js'
import { useNotify } from '../../context/NotificationContext.jsx'
import { getMinReservationDate } from '../../utils/reservationDates.js'

function tableLabel(value) {
  return TABLE_TYPES.find((t) => t.value === value)?.label || value || ''
}

const initialForm = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  partySize: 2,
  date: getMinReservationDate(),
  timeSlot: '19:00',
  tableType: 'booth',
  status: 'approved',
  notes: '',
}

export default function ReservationFormModal({ open, onClose, onSaved }) {
  const notify = useNotify()
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (open) setForm({ ...initialForm, date: getMinReservationDate() })
  }, [open])

  function resetForm() {
    setForm({ ...initialForm, date: getMinReservationDate() })
  }

  async function handleSubmit() {
    if (!form.customerName.trim()) {
      notify.error('Guest name is required')
      return
    }
    if (!form.date || !form.timeSlot) {
      notify.error('Date and time slot are required')
      return
    }

    const date = new Date(`${form.date}T12:00:00`)
    if (Number.isNaN(date.getTime())) {
      notify.error('Invalid date')
      return
    }

    setSaving(true)
    try {
      await reservationService.create({
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        partySize: Number(form.partySize),
        date: date.toISOString(),
        timeSlot: form.timeSlot,
        tableLabel: tableLabel(form.tableType),
        status: form.status,
        notes: form.notes.trim(),
      })
      notify.success('Reservation created')
      resetForm()
      onClose()
      onSaved?.()
    } catch (e) {
      notify.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        resetForm()
        onClose()
      }}
      title="New reservation"
      wide
      footer={
        <>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              resetForm()
              onClose()
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button fullWidth onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : 'Create reservation'}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Guest name *"
          value={form.customerName}
          onChange={(e) => setForm({ ...form, customerName: e.target.value })}
          className="sm:col-span-2"
        />
        <Input
          label="Phone"
          value={form.customerPhone}
          onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
        />
        <Input
          label="Email"
          type="email"
          value={form.customerEmail}
          onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
        />
        <Select
          label="Party size *"
          value={form.partySize}
          onChange={(e) => setForm({ ...form, partySize: Number(e.target.value) })}
        >
          {GUEST_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'guest' : 'guests'}
            </option>
          ))}
        </Select>
        <CalendarDatePicker
          label="Date"
          required
          value={form.date}
          onChange={(date) => setForm({ ...form, date })}
        />
        <Select
          label="Time slot *"
          value={form.timeSlot}
          onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
        >
          {RESERVATION_TIME_SLOTS.map((slot) => (
            <option key={slot.value} value={slot.value}>
              {slot.label}
            </option>
          ))}
        </Select>
        <Select
          label="Table / area"
          value={form.tableType}
          onChange={(e) => setForm({ ...form, tableType: e.target.value })}
        >
          {TABLE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          {RESERVATION_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll('_', ' ')}
            </option>
          ))}
        </Select>
        <Input
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Allergies, celebration, VIP…"
          className="sm:col-span-2"
        />
      </div>
    </Modal>
  )
}
