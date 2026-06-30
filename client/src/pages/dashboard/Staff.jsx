import { useCallback, useEffect, useState } from 'react'
import { FiUsers, FiCheckCircle, FiClock, FiUserX, FiLogIn, FiLogOut } from 'react-icons/fi'
import Card from '../../components/common/Card.jsx'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import Select from '../../components/common/Select.jsx'
import Modal from '../../components/common/Modal.jsx'
import Table, { Th, Tr, Td } from '../../components/common/Table.jsx'
import Loader from '../../components/common/Loader.jsx'
import { staffService } from '../../services/staffService.js'
import * as attendanceService from '../../services/attendanceService.js'
import { ROLES, formatRoleLabel } from '../../utils/constants.js'
import { formatCurrency } from '../../utils/helpers.js'
import { useNotify } from '../../context/NotificationContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

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
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, editing: null })
  const [form, setForm] = useState(emptyStaff)
  const [attendanceSummary, setAttendanceSummary] = useState(null)
  const [attendanceLoading, setAttendanceLoading] = useState(true)
  const [staffAttendance, setStaffAttendance] = useState({})

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

  const loadAttendanceSummary = useCallback(async () => {
    setAttendanceLoading(true)
    try {
      const data = await attendanceService.getTodayAttendanceSummary()
      setAttendanceSummary(data.summary)
      
      // Create a map of user_id to attendance status for quick lookup
      const attendanceMap = {}
      if (data.attendance) {
        data.attendance.forEach((att) => {
          if (att.user_id?._id) {
            attendanceMap[att.user_id._id] = {
              status: att.attendance_status,
              checkInTime: att.check_in_time,
              checkOutTime: att.check_out_time,
            }
          }
        })
      }
      setStaffAttendance(attendanceMap)
    } catch (e) {
      console.error('Failed to load attendance summary:', e)
    } finally {
      setAttendanceLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    loadAttendanceSummary()
  }, [load, loadAttendanceSummary])

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

  async function handleCheckIn(staffId) {
    try {
      // For admin check-in, we'll use a simplified approach
      await attendanceService.checkIn(0, 0) // Coordinates can be optional for admin
      notify.success('Check-in recorded')
      loadAttendanceSummary()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function handleCheckOut(staffId) {
    try {
      await attendanceService.checkOut()
      notify.success('Check-out recorded')
      loadAttendanceSummary()
    } catch (e) {
      notify.error(e.message)
    }
  }

  function getAttendanceStatus(staffId) {
    const attendance = staffAttendance[staffId]
    if (!attendance) return { label: 'Not Checked In', color: 'bg-gray-500/20 text-gray-400' }
    
    const status = attendance.status
    if (status === 'Present' || status === 'Checked In') {
      return { label: 'Present', color: 'bg-green-500/20 text-green-400' }
    } else if (status === 'Late') {
      return { label: 'Late', color: 'bg-yellow-500/20 text-yellow-400' }
    } else if (status === 'Checked Out') {
      return { label: 'Checked Out', color: 'bg-blue-500/20 text-blue-400' }
    }
    return { label: status, color: 'bg-gray-500/20 text-gray-400' }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-nb-white">Staff</h1>
        </div>
        <Button onClick={openCreate}>Add staff</Button>
      </div>

      {/* Attendance Summary Cards */}
      {!attendanceLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <FiUsers className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-nb-white">{items.length}</p>
                <p className="text-xs text-nb-gray">Total Staff</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <FiCheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-nb-white">{attendanceSummary?.present || 0}</p>
                <p className="text-xs text-nb-gray">Present Today</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <FiUserX className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-nb-white">{items.length - (attendanceSummary?.present || 0)}</p>
                <p className="text-xs text-nb-gray">Absent Today</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <FiClock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-nb-white">{attendanceSummary?.late || 0}</p>
                <p className="text-xs text-nb-gray">Late Today</p>
              </div>
            </div>
          </Card>
        </div>
      )}

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
                <Th>Attendance</Th>
                <Th>Salary</Th>
                <Th>Score</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => {
                const attendanceStatus = getAttendanceStatus(s._id)
                return (
                  <Tr key={s._id}>
                    <Td className="font-medium">{s.name}</Td>
                    <Td>{s.department}</Td>
                    <Td>{s.role.replaceAll('_', ' ')}</Td>
                    <Td>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${attendanceStatus.color}`}>
                        {attendanceStatus.label}
                      </span>
                    </Td>
                    <Td>{formatCurrency(s.salary)}</Td>
                    <Td>{s.performanceScore}</Td>
                    <Td className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {attendanceStatus.label === 'Not Checked In' ? (
                          <Button size="sm" variant="ghost" onClick={() => handleCheckIn(s._id)}>
                            <FiLogIn /> Check In
                          </Button>
                        ) : attendanceStatus.label === 'Present' || attendanceStatus.label === 'Late' ? (
                          <Button size="sm" variant="ghost" onClick={() => handleCheckOut(s._id)}>
                            <FiLogOut /> Check Out
                          </Button>
                        ) : null}
                        <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => remove(s._id)}>
                          Delete
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        title={modal.editing ? 'Edit staff' : 'New staff'}
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setModal({ open: false, editing: null })}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </div>
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
