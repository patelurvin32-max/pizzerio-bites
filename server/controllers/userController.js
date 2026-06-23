import User from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ROLES } from '../utils/roles.js'
import { pick, USER_CREATE_FIELDS, USER_UPDATE_FIELDS } from '../utils/pick.js'
import { validatePassword } from '../utils/passwordPolicy.js'
import { assertCanAssignRole, canAssignRole } from '../utils/roleHierarchy.js'
import { searchRegex } from '../utils/escapeRegex.js'
import { writeAudit } from '../utils/auditLog.js'

const allowedRoles = new Set(Object.values(ROLES))

function toUserResponse(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    avatar: user.avatar,
    phone: user.phone,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
  }
}

export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10))
  const q = (req.query.search || '').trim()
  const role = req.query.role
  const status = req.query.status
  const filter = {}
  const regex = searchRegex(q)
  if (regex) {
    filter.$or = [{ name: regex }, { email: regex }]
  }
  if (role && allowedRoles.has(role)) filter.role = role
  if (status) filter.status = status
  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ])
  res.json({
    items: items.map(toUserResponse),
    page,
    limit,
    total,
    pages: Math.ceil(total / limit) || 1,
  })
})

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).lean()
  if (!user) return res.status(404).json({ message: 'User not found' })
  if (!canAssignRole(req.user.role, user.role) && req.params.id !== req.user.id) {
    return res.status(403).json({ message: 'Insufficient permissions' })
  }
  res.json(toUserResponse(user))
})

export const createUser = asyncHandler(async (req, res) => {
  const body = pick(req.body, USER_CREATE_FIELDS)
  const { name, email, password, role, status, phone } = body
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password required' })
  }
  const policy = validatePassword(password)
  if (!policy.ok) return res.status(400).json({ message: policy.message })
  const targetRole = role || ROLES.STAFF
  if (!allowedRoles.has(targetRole)) return res.status(400).json({ message: 'Invalid role' })
  assertCanAssignRole(req.user.role, targetRole)
  const exists = await User.findOne({ email: email.toLowerCase() }).select('_id').lean()
  if (exists) return res.status(409).json({ message: 'Email already registered' })
  const user = await User.create({
    name,
    email,
    password,
    role: targetRole,
    status: status || 'active',
    phone: phone || '',
  })
  await writeAudit(req, {
    action: 'user.create',
    targetType: 'user',
    targetId: user._id,
    meta: { role: user.role, email: user.email },
  })
  res.status(201).json(toUserResponse(user))
})

export const updateUser = asyncHandler(async (req, res) => {
  const body = pick(req.body, USER_UPDATE_FIELDS)
  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).json({ message: 'User not found' })
  if (!canAssignRole(req.user.role, user.role)) {
    return res.status(403).json({ message: 'Cannot manage this user' })
  }
  if (body.name) user.name = body.name
  if (body.phone !== undefined) user.phone = body.phone
  if (body.avatar !== undefined) user.avatar = body.avatar
  if (body.status) {
    if (req.params.id === req.user.id && body.status !== 'active') {
      return res.status(400).json({ message: 'Cannot deactivate your own account' })
    }
    user.status = body.status
  }
  if (body.role) {
    if (body.role === 'SUPER_ADMIN' || user.role === 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'SUPER_ADMIN role can only be changed directly in the database' })
    }
    if (!allowedRoles.has(body.role)) return res.status(400).json({ message: 'Invalid role' })
    assertCanAssignRole(req.user.role, body.role)
    if (req.params.id === req.user.id && body.role !== user.role) {
      return res.status(400).json({ message: 'Cannot change your own role' })
    }
    user.role = body.role
  }
  if (body.password) {
    const policy = validatePassword(body.password)
    if (!policy.ok) return res.status(400).json({ message: policy.message })
    user.password = body.password
    user.tokenVersion = (user.tokenVersion || 0) + 1
    user.refreshTokenHash = ''
    user.refreshTokenExpires = undefined
  }
  if (body.status && body.status !== 'active') {
    user.tokenVersion = (user.tokenVersion || 0) + 1
    user.refreshTokenHash = ''
    user.refreshTokenExpires = undefined
  }
  await user.save()
  await writeAudit(req, {
    action: 'user.update',
    targetType: 'user',
    targetId: user._id,
    meta: { role: user.role, status: user.status },
  })
  res.json(toUserResponse(user))
})

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: 'Cannot delete your own account' })
  }
  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).json({ message: 'User not found' })
  if (!canAssignRole(req.user.role, user.role)) {
    return res.status(403).json({ message: 'Cannot delete this user' })
  }
  await User.findByIdAndDelete(req.params.id)
  await writeAudit(req, {
    action: 'user.delete',
    targetType: 'user',
    targetId: req.params.id,
    meta: { email: user.email },
  })
  res.json({ message: 'Deleted' })
})
