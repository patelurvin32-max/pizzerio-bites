import Attendance from '../models/Attendance.js'
import User from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { isWithinRadius, getDistanceFromCafe, calculateAttendanceStatus } from '../utils/gpsUtils.js'
import { ROLES } from '../utils/roles.js'

/**
 * Get today's attendance for the current user
 */
export const getTodayAttendance = asyncHandler(async (req, res) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const attendance = await Attendance.findOne({
    user_id: req.user.id,
    attendance_date: {
      $gte: today,
      $lt: tomorrow,
    },
  }).populate('user_id', 'name email role')
  
  res.json({ attendance })
})

/**
 * Check In - Mark attendance with GPS verification
 */
export const checkIn = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body
  
  if (!latitude || !longitude) {
    return res.status(400).json({ message: 'Latitude and longitude are required' })
  }
  
  // Verify GPS coordinates are valid
  if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ message: 'Invalid GPS coordinates' })
  }
  
  // Calculate distance from cafe
  const distance = getDistanceFromCafe(latitude, longitude)
  
  // Verify user is within allowed radius (200 meters)
  if (!isWithinRadius(latitude, longitude, 200)) {
    return res.status(403).json({
      message: 'Attendance cannot be marked because you are outside the permitted attendance area.',
      distance,
      allowedRadius: 200,
    })
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  // Check if attendance already exists for today
  const existingAttendance = await Attendance.findOne({
    user_id: req.user.id,
    attendance_date: {
      $gte: today,
      $lt: tomorrow,
    },
  })
  
  if (existingAttendance) {
    if (existingAttendance.check_in_time) {
      return res.status(400).json({ message: 'You have already checked in today' })
    }
  }
  
  // Calculate attendance status based on check-in time
  const checkInTime = new Date()
  const attendanceStatus = calculateAttendanceStatus(checkInTime)
  
  // Create or update attendance record
  const attendance = await Attendance.findOneAndUpdate(
    {
      user_id: req.user.id,
      attendance_date: {
        $gte: today,
        $lt: tomorrow,
      },
    },
    {
      check_in_time: checkInTime,
      latitude,
      longitude,
      distance_in_meters: distance,
      attendance_status: 'Checked In',
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  ).populate('user_id', 'name email role')
  
  res.json({
    message: 'Check-in successful',
    attendance,
    locationVerified: true,
    distance,
  })
})

/**
 * Check Out - Mark check-out time
 */
export const checkOut = asyncHandler(async (req, res) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  // Find today's attendance
  const attendance = await Attendance.findOne({
    user_id: req.user.id,
    attendance_date: {
      $gte: today,
      $lt: tomorrow,
    },
  })
  
  if (!attendance) {
    return res.status(400).json({ message: 'No attendance record found for today. Please check in first.' })
  }
  
  if (!attendance.check_in_time) {
    return res.status(400).json({ message: 'You must check in before checking out' })
  }
  
  if (attendance.check_out_time) {
    return res.status(400).json({ message: 'You have already checked out today' })
  }
  
  // Update check-out time and final status
  attendance.check_out_time = new Date()
  attendance.attendance_status = calculateAttendanceStatus(attendance.check_in_time)
  await attendance.save()
  
  await attendance.populate('user_id', 'name email role')
  
  res.json({
    message: 'Check-out successful',
    attendance,
  })
})

/**
 * Get attendance history for current user
 */
export const getMyAttendanceHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, startDate, endDate } = req.query
  
  const query = { user_id: req.user.id }
  
  if (startDate || endDate) {
    query.attendance_date = {}
    if (startDate) query.attendance_date.$gte = new Date(startDate)
    if (endDate) query.attendance_date.$lte = new Date(endDate)
  }
  
  const attendance = await Attendance.find(query)
    .populate('user_id', 'name email role')
    .sort({ attendance_date: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
  
  const total = await Attendance.countDocuments(query)
  
  res.json({
    attendance,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  })
})

/**
 * Get all attendance records (Admin/Manager only)
 */
export const getAllAttendance = asyncHandler(async (req, res) => {
  const { page = 1, limit = 30, startDate, endDate, userId, status } = req.query
  
  const query = {}
  
  if (startDate || endDate) {
    query.attendance_date = {}
    if (startDate) query.attendance_date.$gte = new Date(startDate)
    if (endDate) query.attendance_date.$lte = new Date(endDate)
  }
  
  if (userId) {
    query.user_id = userId
  }
  
  if (status) {
    query.attendance_status = status
  }
  
  const attendance = await Attendance.find(query)
    .populate('user_id', 'name email role phone')
    .sort({ attendance_date: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
  
  const total = await Attendance.countDocuments(query)
  
  res.json({
    attendance,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  })
})

/**
 * Get today's attendance summary (Admin/Manager only)
 */
export const getTodayAttendanceSummary = asyncHandler(async (req, res) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const attendance = await Attendance.find({
    attendance_date: {
      $gte: today,
      $lt: tomorrow,
    },
  }).populate('user_id', 'name email role phone')
  
  const summary = {
    total: attendance.length,
    present: attendance.filter((a) => a.attendance_status === 'Present' || a.attendance_status === 'Checked In').length,
    late: attendance.filter((a) => a.attendance_status === 'Late').length,
    checkedIn: attendance.filter((a) => a.check_in_time && !a.check_out_time).length,
    checkedOut: attendance.filter((a) => a.check_out_time).length,
    pending: attendance.filter((a) => a.attendance_status === 'Pending').length,
  }
  
  // Get late employees
  const lateEmployees = attendance
    .filter((a) => a.attendance_status === 'Late')
    .map((a) => ({
      id: a.user_id._id,
      name: a.user_id.name,
      email: a.user_id.email,
      role: a.user_id.role,
      checkInTime: a.check_in_time,
      distance: a.distance_in_meters,
    }))
  
  res.json({
    attendance,
    summary,
    lateEmployees,
  })
})

/**
 * Get monthly attendance report (Admin/Manager only)
 */
export const getMonthlyAttendance = asyncHandler(async (req, res) => {
  const { year, month, userId } = req.query
  
  const currentDate = new Date()
  const selectedYear = year ? parseInt(year) : currentDate.getFullYear()
  const selectedMonth = month ? parseInt(month) - 1 : currentDate.getMonth()
  
  const startDate = new Date(selectedYear, selectedMonth, 1)
  const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59)
  
  const query = {
    attendance_date: {
      $gte: startDate,
      $lte: endDate,
    },
  }
  
  if (userId) {
    query.user_id = userId
  }
  
  const attendance = await Attendance.find(query)
    .populate('user_id', 'name email role phone')
    .sort({ attendance_date: -1 })
  
  const summary = {
    total: attendance.length,
    present: attendance.filter((a) => a.attendance_status === 'Present').length,
    late: attendance.filter((a) => a.attendance_status === 'Late').length,
    absent: attendance.filter((a) => a.attendance_status === 'Absent').length,
  }
  
  res.json({
    attendance,
    summary,
    period: {
      year: selectedYear,
      month: selectedMonth + 1,
    },
  })
})

/**
 * Get employee attendance history (Admin/Manager only)
 */
export const getEmployeeAttendance = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { page = 1, limit = 30, startDate, endDate } = req.query
  
  const query = { user_id: userId }
  
  if (startDate || endDate) {
    query.attendance_date = {}
    if (startDate) query.attendance_date.$gte = new Date(startDate)
    if (endDate) query.attendance_date.$lte = new Date(endDate)
  }
  
  const attendance = await Attendance.find(query)
    .populate('user_id', 'name email role phone')
    .sort({ attendance_date: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
  
  const total = await Attendance.countDocuments(query)
  
  // Get employee details
  const employee = await User.findById(userId).select('name email role phone avatar')
  
  res.json({
    employee,
    attendance,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  })
})

/**
 * Get attendance analytics (Admin only)
 */
export const getAttendanceAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query
  
  const matchStage = {}
  
  if (startDate || endDate) {
    matchStage.attendance_date = {}
    if (startDate) matchStage.attendance_date.$gte = new Date(startDate)
    if (endDate) matchStage.attendance_date.$lte = new Date(endDate)
  }
  
  const analytics = await Attendance.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$attendance_status',
        count: { $sum: 1 },
      },
    },
  ])
  
  const statusCounts = {
    Present: 0,
    Late: 0,
    Absent: 0,
    'Checked In': 0,
    'Checked Out': 0,
    Pending: 0,
  }
  
  analytics.forEach((item) => {
    statusCounts[item._id] = item.count
  })
  
  // Get daily attendance trend
  const dailyTrend = await Attendance.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$attendance_date' },
        },
        count: { $sum: 1 },
        present: {
          $sum: {
            $cond: [{ $eq: ['$attendance_status', 'Present'] }, 1, 0],
          },
        },
        late: {
          $sum: {
            $cond: [{ $eq: ['$attendance_status', 'Late'] }, 1, 0],
          },
        },
      },
    },
    { $sort: { _id: 1 } },
  ])
  
  res.json({
    statusCounts,
    dailyTrend,
  })
})

/**
 * Verify location (for frontend validation)
 */
export const verifyLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body
  
  if (!latitude || !longitude) {
    return res.status(400).json({ message: 'Latitude and longitude are required' })
  }
  
  const distance = getDistanceFromCafe(latitude, longitude)
  const isAllowed = isWithinRadius(latitude, longitude, 200)
  
  res.json({
    isAllowed,
    distance,
    allowedRadius: 200,
    cafeLocation: {
      latitude: 20.4108163,
      longitude: 72.8621349,
    },
  })
})
