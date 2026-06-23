import { motion, AnimatePresence } from 'framer-motion'
import { FiMapPin, FiClock, FiCheckCircle, FiLogOut, FiLoader, FiAlertCircle, FiX } from 'react-icons/fi'
import { useState, useEffect } from 'react'
import * as attendanceService from '../../services/attendanceService.js'
import { getCurrentLocation, isWithinRadius, getDistanceFromCafe, CHECK_IN_RADIUS } from '../../utils/gpsUtils.js'

export default function AttendancePopup({ isOpen, onClose, initialAttendance }) {
  const [attendance, setAttendance] = useState(initialAttendance)
  const [location, setLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [locationStatus, setLocationStatus] = useState('pending') // pending, verified, denied, error

  useEffect(() => {
    if (isOpen && !attendance?.check_in_time) {
      verifyLocation()
    }
  }, [isOpen, attendance])

  const verifyLocation = async () => {
    setIsVerifying(true)
    setLocationError(null)
    setLocationStatus('pending')

    try {
      const userLocation = await getCurrentLocation()
      setLocation(userLocation)

      const distance = getDistanceFromCafe(userLocation.latitude, userLocation.longitude)
      const isAllowed = isWithinRadius(userLocation.latitude, userLocation.longitude, CHECK_IN_RADIUS)

      if (isAllowed) {
        setLocationStatus('verified')
      } else {
        setLocationStatus('denied')
        setLocationError(`You are ${Math.round(distance)} meters away from the cafe. Attendance can only be marked within ${CHECK_IN_RADIUS} meters.`)
      }
    } catch (error) {
      setLocationStatus('error')
      setLocationError(error.message)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleCheckIn = async () => {
    if (!location || locationStatus !== 'verified') {
      setLocationError('Please verify your location first')
      return
    }

    setIsCheckingIn(true)
    try {
      const response = await attendanceService.checkIn(location.latitude, location.longitude)
      setAttendance(response.attendance)
      setLocationStatus('verified')
    } catch (error) {
      setLocationError(error.message || 'Failed to check in')
    } finally {
      setIsCheckingIn(false)
    }
  }

  const handleCheckOut = async () => {
    setIsCheckingOut(true)
    try {
      const response = await attendanceService.checkOut()
      setAttendance(response.attendance)
    } catch (error) {
      setLocationError(error.message || 'Failed to check out')
    } finally {
      setIsCheckingOut(false)
    }
  }

  const canCheckIn = !attendance?.check_in_time && locationStatus === 'verified'
  const canCheckOut = attendance?.check_in_time && !attendance?.check_out_time

  const getStatusMessage = () => {
    if (attendance?.check_out_time) {
      return 'Checked Out'
    }
    if (attendance?.check_in_time) {
      return 'Checked In'
    }
    if (locationStatus === 'verified') {
      return 'Location Verified Successfully'
    }
    if (locationStatus === 'denied') {
      return 'Outside permitted area'
    }
    if (locationStatus === 'error') {
      return 'Location verification failed'
    }
    return 'Verifying location...'
  }

  const getStatusColor = () => {
    if (attendance?.check_out_time) return 'text-green-400'
    if (attendance?.check_in_time) return 'text-blue-400'
    if (locationStatus === 'verified') return 'text-green-400'
    if (locationStatus === 'denied') return 'text-red-400'
    if (locationStatus === 'error') return 'text-red-400'
    return 'text-yellow-400'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative w-full max-w-md bg-nb-surface border border-nb-maroon/15 rounded-2xl shadow-glass p-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-nb-white">Mark Attendance</h2>
                <p className="text-sm text-nb-gray mt-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-nb-gray hover:text-nb-white transition-colors"
                aria-label="Close"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Location Status */}
            <div className="bg-nb-surface rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                {isVerifying ? (
                  <FiLoader className="w-5 h-5 text-yellow-400 animate-spin" />
                ) : locationStatus === 'verified' || attendance?.check_in_time ? (
                  <FiCheckCircle className="w-5 h-5 text-green-400" />
                ) : locationStatus === 'denied' || locationStatus === 'error' ? (
                  <FiAlertCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <FiMapPin className="w-5 h-5 text-yellow-400" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${getStatusColor()}`}>{getStatusMessage()}</p>
                  {location && (
                    <p className="text-xs text-nb-gray mt-1">
                      Distance: {Math.round(getDistanceFromCafe(location.latitude, location.longitude))}m from cafe
                    </p>
                  )}
                </div>
              </div>

              {locationError && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{locationError}</p>
                </div>
              )}

              {locationStatus !== 'verified' && !attendance?.check_in_time && (
                <button
                  onClick={verifyLocation}
                  disabled={isVerifying}
                  className="mt-3 w-full py-2 px-4 bg-nb-neon-orange/20 hover:bg-nb-neon-orange/30 text-nb-neon-orange rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isVerifying ? 'Verifying...' : 'Verify Location'}
                </button>
              )}
            </div>

            {/* Attendance Times */}
            {attendance && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-nb-surface rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FiClock className="w-4 h-4 text-nb-gray" />
                    <span className="text-xs text-nb-gray">Check In</span>
                  </div>
                  <p className="text-nb-white font-medium">
                    {attendance.check_in_time
                      ? new Date(attendance.check_in_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '--:--'}
                  </p>
                </div>
                <div className="bg-nb-surface rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FiLogOut className="w-4 h-4 text-nb-gray" />
                    <span className="text-xs text-nb-gray">Check Out</span>
                  </div>
                  <p className="text-nb-white font-medium">
                    {attendance.check_out_time
                      ? new Date(attendance.check_out_time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '--:--'}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCheckIn}
                disabled={!canCheckIn || isCheckingIn}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-nb-neon-orange to-nb-neon-red text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCheckingIn ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    Checking In...
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="w-5 h-5" />
                    Check In
                  </>
                )}
              </button>
              <button
                onClick={handleCheckOut}
                disabled={!canCheckOut || isCheckingOut}
                className="flex-1 py-3 px-4 bg-nb-surface-2 hover:bg-white/20 text-nb-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCheckingOut ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    Checking Out...
                  </>
                ) : (
                  <>
                    <FiLogOut className="w-5 h-5" />
                    Check Out
                  </>
                )}
              </button>
            </div>

            {/* Info Text */}
            <p className="text-xs text-nb-gray text-center mt-4">
              Attendance can only be marked within {CHECK_IN_RADIUS} meters of the cafe location.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
