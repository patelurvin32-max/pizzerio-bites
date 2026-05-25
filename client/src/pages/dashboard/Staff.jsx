import { useCallback, useEffect, useState } from 'react'
import Card from '../../components/common/Card.jsx'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Select from '../../components/common/Select.jsx'
import Modal from '../../components/common/Modal.jsx'
import Table, { Th, Tr, Td } from '../../components/common/Table.jsx'
import Loader from '../../components/common/Loader.jsx'
import { staffService } from '../../services/staffService.js'
import { ROLES, formatRoleLabel } from '../../utils/constants.js'
import { formatCurrency } from '../../utils/helpers.js'
import { useNotify } from '../../context/NotificationContext.jsx'

const emptyStaff = {
  name: '',
  email: '',
  phone: '',
  department: 'Front of house',
  role: ROLES.STAFF,
  salary: 0,
  performanceScore: 80,
  status: 'active',
}

export default function Staff() {
  const notify = useNotify()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, editing: null })
  const [form, setForm] = useState(emptyStaff)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await staffService.list()
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

  function openCreate() {
    setForm(emptyStaff)
    setModal({ open: true, editing: null })
  }

  function openEdit(row) {
    setForm({
      name: row.name,
      email: row.email,
      phone: row.phone,
      department: row.department,
      role: row.role,
      salary: row.salary,
      performanceScore: row.performanceScore,
      status: row.status,
    })
    setModal({ open: true, editing: row._id })
  }

  async function save() {
    try {
      if (modal.editing) await staffService.update(modal.editing, form)
      else await staffService.create(form)
      notify.success('Staff saved')
      setModal({ open: false, editing: null })
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function remove(id) {
    if (!window.confirm('Remove staff profile?')) return
    try {
      await staffService.remove(id)
      notify.success('Removed')
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function markAttendance(row) {
    try {
      await staffService.addAttendance(row._id, { date: new Date(), status: 'present', note: 'Admin check-in' })
      notify.success('Attendance logged')
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-nb-white">Staff</h1>
          <p className="text-sm text-nb-gray">Profiles, shifts, salary notes, and live attendance markers.</p>
        </div>
        <Button onClick={openCreate}>Add staff</Button>
      </div>
      <Card>
        {loading ? (
          <Loader />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Department</Th>
                <Th>Role</Th>
                <Th>Salary</Th>
                <Th>Score</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <Tr key={s._id}>
                  <Td className="font-medium">{s.name}</Td>
                  <Td>{s.department}</Td>
                  <Td>{s.role.replaceAll('_', ' ')}</Td>
                  <Td>{formatCurrency(s.salary)}</Td>
                  <Td>{s.performanceScore}</Td>
                  <Td className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => markAttendance(s)}>
                        Attendance
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => remove(s._id)}>
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
        title={modal.editing ? 'Edit staff' : 'New staff'}
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
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {Object.values(ROLES).map((r) => (
              <option key={r} value={r}>
                {formatRoleLabel(r)}
              </option>
            ))}
          </Select>
          <Input label="Salary" type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })} />
          <Input label="Performance (0-100)" type="number" value={form.performanceScore} onChange={(e) => setForm({ ...form, performanceScore: Number(e.target.value) })} />
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </Select>
        </div>
      </Modal>
    </div>
  )
}
