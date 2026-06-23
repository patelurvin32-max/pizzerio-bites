/**
 * GPS Utility Functions for Attendance System
 * Calculates distance between two coordinates using Haversine formula
 */

// Cafe location coordinates
export const CAFE_LOCATION = {
  latitude: 20.4108163,
  longitude: 72.8621349,
}

// Allowed attendance radius in meters
export const ALLOWED_ATTENDANCE_RADIUS = 300

// Strict attendance radius for check-in (200 meters as per requirements)
export const CHECK_IN_RADIUS = 200

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Check if user is within allowed attendance radius
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {number} radius - Radius in meters (default: CHECK_IN_RADIUS)
 * @returns {boolean} True if within radius
 */
export function isWithinRadius(userLat, userLon, radius = CHECK_IN_RADIUS) {
  const distance = calculateDistance(userLat, userLon, CAFE_LOCATION.latitude, CAFE_LOCATION.longitude)
  return distance <= radius
}

/**
 * Get distance from cafe location
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @returns {number} Distance in meters
 */
export function getDistanceFromCafe(userLat, userLon) {
  return calculateDistance(userLat, userLon, CAFE_LOCATION.latitude, CAFE_LOCATION.longitude)
}

/**
 * Calculate attendance status based on check-in time
 * @param {Date} checkInTime - Check-in timestamp
 * @returns {string} Attendance status: 'Present' or 'Late'
 */
export function calculateAttendanceStatus(checkInTime) {
  if (!checkInTime) return 'Pending'
  
  const checkInDate = new Date(checkInTime)
  const standardStartTime = new Date(checkInDate)
  standardStartTime.setHours(9, 0, 0, 0) // 9:00 AM standard start time
  
  // If check-in is after 9:30 AM, mark as Late
  const lateThreshold = new Date(checkInDate)
  lateThreshold.setHours(9, 30, 0, 0)
  
  return checkInDate > lateThreshold ? 'Late' : 'Present'
}

/**
 * Generate Google Maps URL for a location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {string} Google Maps URL
 */
export function getGoogleMapsUrl(lat, lon) {
  return `https://www.google.com/maps?q=${lat},${lon}`
}
