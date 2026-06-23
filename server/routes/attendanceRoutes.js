import express from 'express'
import {
  getTodayAttendance,
  checkIn,
  checkOut,
  getMyAttendanceHistory,
  getAllAttendance,
  getTodayAttendanceSummary,
  getMonthlyAttendance,
  getEmployeeAttendance,
  getAttendanceAnalytics,
  verifyLocation,
} from '../controllers/attendanceController.js'
import { protect } from '../middleware/auth.js'
import { requireMinRole } from '../middleware/requireRole.js'
import { ROLES } from '../utils/roles.js'

const router = express.Router()

// All routes require authentication
router.use(protect)

// Current user attendance routes
router.get('/today', getTodayAttendance)
router.post('/check-in', checkIn)
router.post('/check-out', checkOut)
router.get('/my-history', requireMinRole(ROLES.STAFF), getMyAttendanceHistory)
router.post('/verify-location', verifyLocation)

// Manager and Admin routes
router.get('/today-summary', requireMinRole(ROLES.MANAGER), getTodayAttendanceSummary)
router.get('/monthly', requireMinRole(ROLES.MANAGER), getMonthlyAttendance)

// Admin only routes
router.get('/all', requireMinRole(ROLES.ADMIN), getAllAttendance)
router.get('/employee/:userId', requireMinRole(ROLES.ADMIN), getEmployeeAttendance)
router.get('/analytics', requireMinRole(ROLES.ADMIN), getAttendanceAnalytics)

export default router
