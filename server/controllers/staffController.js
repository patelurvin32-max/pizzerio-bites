import Staff from '../models/Staff.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ROLES } from '../utils/roles.js'
import { pick, STAFF_FIELDS, STAFF_ATTENDANCE_FIELDS } from '../utils/pick.js'

const roles = new Set(Object.values(ROLES))

export const listStaff = asyncHandler(async (req, res) => {
  const items = await Staff.find().sort({ updatedAt: -1 }).lean()
  res.json({ items })
})

export const createStaff = asyncHandler(async (req, res) => {
  const body = pick(req.body, STAFF_FIELDS)
  if (!body.name || !body.email) return res.status(400).json({ message: 'Name and email required' })
  if (body.role && !roles.has(body.role)) return res.status(400).json({ message: 'Invalid role' })
  const staff = await Staff.create(body)
  res.status(201).json(staff)
})

export const updateStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findByIdAndUpdate(req.params.id, pick(req.body, STAFF_FIELDS), {
    new: true,
    runValidators: true,
  })
  if (!staff) return res.status(404).json({ message: 'Not found' })
  res.json(staff)
})

export const deleteStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findByIdAndDelete(req.params.id)
  if (!staff) return res.status(404).json({ message: 'Not found' })
  res.json({ message: 'Deleted' })
})

export const addAttendance = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id)
  if (!staff) return res.status(404).json({ message: 'Not found' })
  staff.attendance.push(pick(req.body, STAFF_ATTENDANCE_FIELDS))
  await staff.save()
  res.json(staff)
})
