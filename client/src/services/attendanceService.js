import api from './api.js'

/**
 * Get today's attendance for current user
 */
export async function getTodayAttendance() {
  const response = await api.get('/api/attendance/today')
  return response.data
}

/**
 * Check in with GPS coordinates
 */
export async function checkIn(latitude, longitude) {
  const response = await api.post('/api/attendance/check-in', { latitude, longitude })
  return response.data
}

/**
 * Check out
 */
export async function checkOut() {
  const response = await api.post('/api/attendance/check-out')
  return response.data
}

/**
 * Get my attendance history
 */
export async function getMyAttendanceHistory(params = {}) {
  const response = await api.get('/api/attendance/my-history', { params })
  return response.data
}

/**
 * Get all attendance records (Admin/Manager)
 */
export async function getAllAttendance(params = {}) {
  const response = await api.get('/api/attendance/all', { params })
  return response.data
}

/**
 * Get today's attendance summary (Admin/Manager)
 */
export async function getTodayAttendanceSummary() {
  const response = await api.get('/api/attendance/today-summary')
  return response.data
}

/**
 * Get monthly attendance report (Admin/Manager)
 */
export async function getMonthlyAttendance(params = {}) {
  const response = await api.get('/api/attendance/monthly', { params })
  return response.data
}

/**
 * Get employee attendance history (Admin)
 */
export async function getEmployeeAttendance(userId, params = {}) {
  const response = await api.get(`/api/attendance/employee/${userId}`, { params })
  return response.data
}

/**
 * Get attendance analytics (Admin)
 */
export async function getAttendanceAnalytics(params = {}) {
  const response = await api.get('/api/attendance/analytics', { params })
  return response.data
}

/**
 * Verify location (frontend validation)
 */
export async function verifyLocation(latitude, longitude) {
  const response = await api.post('/api/attendance/verify-location', { latitude, longitude })
  return response.data
}
