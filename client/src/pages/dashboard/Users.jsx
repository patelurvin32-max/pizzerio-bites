import { useCallback, useEffect, useState } from 'react'
import Card from '../../components/common/Card.jsx'
import Button from '../../components/common/Button.jsx'
import Input from '../../components/common/Input.jsx'
import PasswordInput from '../../components/common/PasswordInput.jsx'
import Select from '../../components/common/Select.jsx'
import Modal from '../../components/common/Modal.jsx'
import Table, { Th, Tr, Td } from '../../components/common/Table.jsx'
import Badge from '../../components/common/Badge.jsx'
import UserRoleBadge from '../../components/users/UserRoleBadge.jsx'
import Loader from '../../components/common/Loader.jsx'
import { userService } from '../../services/userService.js'
import { ROLES, assignableRoles, formatRoleLabel } from '../../utils/constants.js'
import { useNotify } from '../../context/NotificationContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

const emptyForm = { name: '', email: '', password: '', role: ROLES.STAFF, status: 'active', phone: '' }

export default function Users() {
  const notify = useNotify()
  const { user: currentUser } = useAuth()
  const roleOptions = assignableRoles(currentUser?.role)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, editing: null })
  const [form, setForm] = useState(emptyForm)
  const [modalLoading, setModalLoading] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await userService.list({ page, limit: 8, search })
      setItems(data.items)
      setTotalPages(data.pages || 1)
    } catch (e) {
      notify.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, search, notify])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setForm({ ...emptyForm, role: roleOptions[0] || ROLES.STAFF })
    setModal({ open: true, editing: null })
  }

  async function openEdit(row) {
    setModal({ open: true, editing: row.id })
    setModalLoading(true)
    try {
      const user = await userService.get(row.id)
      setForm({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        status: user.status,
        phone: user.phone || '',
      })
    } catch (e) {
      notify.error(e.message)
      setModal({ open: false, editing: null })
    } finally {
      setModalLoading(false)
    }
  }

  async function save() {
    const isEdit = Boolean(modal.editing)
    if (!isEdit && (!form.password || form.password.length < 10)) {
      notify.error('Password must be at least 10 characters with letters and numbers')
      return
    }
    if (isEdit && form.password && form.password.length < 10) {
      notify.error('New password must be at least 10 characters with letters and numbers')
      return
    }
    if (!roleOptions.includes(form.role)) {
      notify.error('You cannot assign that role')
      return
    }

    try {
      if (isEdit) {
        const payload = { name: form.name, role: form.role, status: form.status, phone: form.phone }
        if (form.password) payload.password = form.password
        await userService.update(modal.editing, payload)
        notify.success('User updated')
      } else {
        await userService.create(form)
        notify.success('User created')
      }
      setModal({ open: false, editing: null })
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this user?')) return
    try {
      await userService.remove(id)
      notify.success('User removed')
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-nb-white">Users</h1>
          <p className="text-sm text-nb-gray">Search, filter, assign roles, and control access.</p>
        </div>
        <Button onClick={openCreate}>Add user</Button>
      </div>

      <Card className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input label="Search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Name or email" className="sm:flex-1" />
        <Button
          variant="ghost"
          onClick={() => {
            setSearch(searchInput)
            setPage(1)
          }}
        >
          Search
        </Button>
      </Card>

      <Card>
        {loading ? (
          <Loader />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <Tr key={u.id}>
                  <Td className="font-medium">{u.name}</Td>
                  <Td>{u.email}</Td>
                  <Td>
                    <UserRoleBadge role={u.role} />
                  </Td>
                  <Td>
                    <Badge tone={u.status === 'active' ? 'success' : 'warning'}>{u.status}</Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(u)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => remove(u.id)}>
                        Delete
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        <div className="mt-4 flex items-center justify-between text-sm text-nb-gray">
          <button type="button" className="hover:text-nb-white disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button type="button" className="hover:text-nb-white disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      </Card>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, editing: null })}
        title={modal.editing ? 'Edit user' : 'Create user'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal({ open: false, editing: null })}>
              Cancel
            </Button>
            <Button onClick={save} disabled={modalLoading}>
              Save
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {modalLoading ? (
            <div className="sm:col-span-2 py-8">
              <Loader />
            </div>
          ) : (
            <>
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={Boolean(modal.editing)} />
          <div className="sm:col-span-2">
            <PasswordInput
              resetKey={modal.editing || 'create'}
              label={modal.editing ? 'New password (optional)' : 'Password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
              placeholder={modal.editing ? 'Leave blank to keep current password' : 'Min. 10 characters'}
              hint={
                modal.editing
                  ? 'For security, existing passwords cannot be displayed. Type a new password only to change it.'
                  : undefined
              }
              required={!modal.editing}
              minLength={10}
            />
          </div>
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {formatRoleLabel(r)}
              </option>
            ))}
          </Select>
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {['active', 'inactive', 'suspended'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
