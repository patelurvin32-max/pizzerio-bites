import { useState, useEffect } from 'react'
import { FiUsers, FiClock, FiAlertTriangle, FiMapPin, FiSearch, FiFilter, FiEye, FiCheckCircle, FiDownload } from 'react-icons/fi'
import * as attendanceService from '../../services/attendanceService.js'
import { getGoogleMapsUrl } from '../../utils/gpsUtils.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function Attendance() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('today')
  const [loading, setLoading] = useState(false)
  const [todayData, setTodayData] = useState(null)
  const [monthlyData, setMonthlyData] = useState(null)
  const [allAttendance, setAllAttendance] = useState(null)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    status: '',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const isReception = user?.role === 'RECEPTION'

  useEffect(() => {
    if (activeTab === 'today') {
      fetchTodayAttendance()
    } else if (activeTab === 'monthly') {
      fetchMonthlyAttendance()
    } else if (activeTab === 'all') {
      fetchAllAttendance()
    }
  }, [activeTab])

  const fetchTodayAttendance = async () => {
    setLoading(true)
    try {
      // Reception users fetch their own attendance, Manager/Admin fetch summary
      const data = isReception
        ? await attendanceService.getTodayAttendance()
        : await attendanceService.getTodayAttendanceSummary()
      setTodayData(data)
    } catch (error) {
      console.error('Failed to fetch today attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMonthlyAttendance = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const data = await attendanceService.getMonthlyAttendance({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      })
      setMonthlyData(data)
    } catch (error) {
      console.error('Failed to fetch monthly attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllAttendance = async () => {
    setLoading(true)
    try {
      const data = await attendanceService.getAllAttendance(filters)
      setAllAttendance(data)
    } catch (error) {
      console.error('Failed to fetch all attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    fetchAllAttendance()
  }

  const openGoogleMaps = (lat, lon) => {
    window.open(getGoogleMapsUrl(lat, lon), '_blank')
  }

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return

    const headers = ['Date', 'Employee Name', 'Email', 'Role', 'Check In', 'Check Out', 'Status', 'Distance (m)']
    const csvContent = [
      headers.join(','),
      ...data.map((att) => [
        new Date(att.attendance_date).toLocaleDateString('en-US'),
        att.user_id?.name || '',
        att.user_id?.email || '',
        att.user_id?.role || '',
        att.check_in_time ? new Date(att.check_in_time).toLocaleTimeString('en-US') : '',
        att.check_out_time ? new Date(att.check_out_time).toLocaleTimeString('en-US') : '',
        att.attendance_status || '',
        att.distance_in_meters || '',
      ].join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportCSV = () => {
    const dataToExport = activeTab === 'today' ? todayData?.attendance : activeTab === 'monthly' ? monthlyData?.attendance : filteredAttendance
    const filename = `attendance-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`
    exportToCSV(dataToExport, filename)
  }

  const handlePrint = () => {
    window.print()
  }

  const filteredAttendance = allAttendance?.attendance?.filter((att) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      att.user_id?.name?.toLowerCase().includes(query) ||
      att.user_id?.email?.toLowerCase().includes(query) ||
      att.user_id?.role?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-nb-white">Attendance Management</h1>
          <p className="text-nb-gray mt-1">Track and manage staff attendance</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-nb-surface-2 hover:bg-white/20 text-nb-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <FiDownload className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-nb-surface-2 hover:bg-white/20 text-nb-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <FiDownload className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-nb-surface p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'today'
              ? 'bg-nb-neon-orange text-white'
              : 'text-nb-gray hover:text-nb-white'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'monthly'
              ? 'bg-nb-neon-orange text-white'
              : 'text-nb-gray hover:text-nb-white'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-nb-neon-orange text-white'
              : 'text-nb-gray hover:text-nb-white'
          }`}
        >
          All Records
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nb-neon-orange"></div>
        </div>
      ) : (
        <>
          {/* Today's Attendance */}
          {activeTab === 'today' && todayData && (
            <div className="space-y-6">
              {/* Show summary for Manager/Admin, show individual attendance for Reception */}
              {!isReception && todayData.summary ? (
                <div>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-nb-surface border border-nb-maroon/15 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          <FiUsers className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-nb-white">{todayData.summary.total}</p>
                          <p className="text-xs text-nb-gray">Total Staff</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-nb-surface border border-nb-maroon/15 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                          <FiCheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-nb-white">{todayData.summary.present}</p>
                          <p className="text-xs text-nb-gray">Present</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-nb-surface border border-nb-maroon/15 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                          <FiClock className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-nb-white">{todayData.summary.late}</p>
                          <p className="text-xs text-nb-gray">Late</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-nb-surface border border-nb-maroon/15 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-nb-neon-orange/20 flex items-center justify-center">
                          <FiEye className="w-5 h-5 text-nb-neon-orange" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-nb-white">{todayData.summary.checkedIn}</p>
                          <p className="text-xs text-nb-gray">Checked In</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Late Employees */}
                  {todayData.lateEmployees && todayData.lateEmployees.length > 0 && (
                    <div className="bg-nb-surface border border-nb-maroon/15 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <FiAlertTriangle className="w-5 h-5 text-yellow-400" />
                        <h3 className="text-lg font-semibold text-nb-white">Late Arrivals Today</h3>
                      </div>
                      <div className="space-y-3">
                        {todayData.lateEmployees.map((employee) => (
                          <div
                            key={employee.id}
                            className="flex items-center justify-between p-3 bg-nb-surface rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-nb-white">{employee.name}</p>
                              <p className="text-sm text-nb-gray">{employee.role}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-nb-white">
                                {new Date(employee.checkInTime).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              <p className="text-xs text-nb-gray">{Math.round(employee.distance)}m from cafe</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Reception user sees their own attendance */
                <div>
                  {todayData.attendance ? (
                    <div className="bg-nb-surface border border-nb-maroon/15 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-nb-white mb-4">Your Attendance Today</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-nb-surface rounded-lg p-4">
                          <p className="text-sm text-nb-gray mb-1">Check In Time</p>
                          <p className="text-lg font-medium text-nb-white">
                            {todayData.attendance.check_in_time
                              ? new Date(todayData.attendance.check_in_time).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Not checked in'}
                          </p>
                        </div>
                        <div className="bg-nb-surface rounded-lg p-4">
                          <p className="text-sm text-nb-gray mb-1">Check Out Time</p>
                          <p className="text-lg font-medium text-nb-white">
                            {todayData.attendance.check_out_time
                              ? new Date(todayData.attendance.check_out_time).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Not checked out'}
                          </p>
                        </div>
                        <div className="bg-nb-surface rounded-lg p-4">
                          <p className="text-sm text-nb-gray mb-1">Status</p>
                          <p className="text-lg font-medium text-nb-white">{todayData.attendance.attendance_status || 'Pending'}</p>
                        </div>
                        {todayData.attendance.distance_in_meters && (
                          <div className="bg-nb-surface rounded-lg p-4">
                            <p className="text-sm text-nb-gray mb-1">Distance from Cafe</p>
                            <p className="text-lg font-medium text-nb-white">{Math.round(todayData.attendance.distance_in_meters)}m</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-nb-surface border border-nb-maroon/15 rounded-xl p-6">
                      <p className="text-nb-gray">No attendance record for today. Please check in using the attendance popup.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Today's Attendance List */}
              {!isReception && todayData.attendance && (
                <div className="bg-nb-surface border border-nb-maroon/15 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-nb-maroon/15">
                    <h3 className="font-semibold text-nb-white">Today's Attendance Records</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-nb-surface">
                        <tr>
                          <th className="text-left p-4 text-sm font-medium text-nb-gray">Employee</th>
                          <th className="text-left p-4 text-sm font-medium text-nb-gray">Role</th>
                          <th className="text-left p-4 text-sm font-medium text-nb-gray">Check In</th>
                          <th className="text-left p-4 text-sm font-medium text-nb-gray">Check Out</th>
                          <th className="text-left p-4 text-sm font-medium text-nb-gray">Status</th>
                          <th className="text-left p-4 text-sm font-medium text-nb-gray">Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todayData.attendance.map((att) => (
                          <tr key={att._id} className="border-t border-nb-maroon/15">
                            <td className="p-4">
                              <p className="font-medium text-nb-white">{att.user_id?.name}</p>
                              <p className="text-sm text-nb-gray">{att.user_id?.email}</p>
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-1 bg-nb-surface-2 rounded text-xs text-nb-white">
                                {att.user_id?.role}
                              </span>
                            </td>
                            <td className="p-4 text-nb-white">
                              {att.check_in_time
                                ? new Date(att.check_in_time).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '--:--'}
                            </td>
                            <td className="p-4 text-nb-white">
                              {att.check_out_time
                                ? new Date(att.check_out_time).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '--:--'}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  att.attendance_status === 'Present' || att.attendance_status === 'Checked In'
                                    ? 'bg-green-500/20 text-green-400'
                                    : att.attendance_status === 'Late'
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : att.attendance_status === 'Checked Out'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-gray-500/20 text-gray-400'
                                }`}
                              >
                                {att.attendance_status}
                              </span>
                            </td>
                            <td className="p-4">
                              {att.latitude && att.longitude && (
                                <button
                                  onClick={() => openGoogleMaps(att.latitude, att.longitude)}
                                  className="flex items-center gap-1 text-nb-neon-orange hover:text-nb-neon-red transition-colors text-sm"
                                >
                                  <FiMapPin className="w-4 h-4" />
                                  View
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Monthly Attendance */}
          {activeTab === 'monthly' && monthlyData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-nb-surface border border-nb-maroon/15 rounded-xl p-4">
                  <p className="text-2xl font-bold text-nb-white">{monthlyData.summary.total}</p>
                  <p className="text-xs text-nb-gray">Total Records</p>
                </div>
                <div className="bg-nb-surface border border-nb-maroon/15 rounded-xl p-4">
                  <p className="text-2xl font-bold text-green-400">{monthlyData.summary.present}</p>
                  <p className="text-xs text-nb-gray">Present</p>
                </div>
                <div className="bg-nb-surface border border-nb-maroon/15 rounded-xl p-4">
                  <p className="text-2xl font-bold text-yellow-400">{monthlyData.summary.late}</p>
                  <p className="text-xs text-nb-gray">Late</p>
                </div>
                <div className="bg-nb-surface border border-nb-maroon/15 rounded-xl p-4">
                  <p className="text-2xl font-bold text-red-400">{monthlyData.summary.absent}</p>
                  <p className="text-xs text-nb-gray">Absent</p>
                </div>
              </div>

              <div className="bg-nb-surface border border-nb-maroon/15 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-nb-maroon/15">
                  <h3 className="font-semibold text-nb-white">
                    Monthly Attendance - {monthlyData.period.month}/{monthlyData.period.year}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-nb-surface">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-nb-gray">Date</th>
                        <th className="text-left p-4 text-sm font-medium text-nb-gray">Employee</th>
                        <th className="text-left p-4 text-sm font-medium text-nb-gray">Check In</th>
                        <th className="text-left p-4 text-sm font-medium text-nb-gray">Check Out</th>
                        <th className="text-left p-4 text-sm font-medium text-nb-gray">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.attendance.map((att) => (
                        <tr key={att._id} className="border-t border-nb-maroon/15">
                          <td className="p-4 text-nb-white">
                            {new Date(att.attendance_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="p-4">
                            <p className="font-medium text-nb-white">{att.user_id?.name}</p>
                          </td>
                          <td className="p-4 text-nb-white">
                            {att.check_in_time
                              ? new Date(att.check_in_time).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '--:--'}
                          </td>
                          <td className="p-4 text-nb-white">
                            {att.check_out_time
                              ? new Date(att.check_out_time).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '--:--'}
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                att.attendance_status === 'Present'
                                  ? 'bg-green-500/20 text-green-400'
                                  : att.attendance_status === 'Late'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {att.attendance_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* All Records */}
          {activeTab === 'all' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-nb-surface border border-nb-maroon/15 rounded-xl p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nb-gray" />
                      <input
                        type="text"
                        placeholder="Search by name, email, or role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-nb-surface border border-nb-maroon/15 rounded-lg text-nb-white placeholder-nb-gray focus:outline-none focus:border-nb-neon-orange"
                      />
                    </div>
                  </div>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="px-4 py-2 bg-nb-surface border border-nb-maroon/15 rounded-lg text-nb-white focus:outline-none focus:border-nb-neon-orange"
                  />
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="px-4 py-2 bg-nb-surface border border-nb-maroon/15 rounded-lg text-nb-white focus:outline-none focus:border-nb-neon-orange"
                  />
                  <button
                    onClick={applyFilters}
                    className="px-4 py-2 bg-nb-neon-orange hover:bg-nb-neon-red text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <FiFilter className="w-4 h-4" />
                    Apply Filters
                  </button>
                </div>
              </div>

              {/* Results */}
              {allAttendance && (
                <div className="bg-nb-surface border border-nb-maroon/15 rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-nb-maroon/15 flex items-center justify-between">
                    <h3 className="font-semibold text-nb-white">
                      All Records ({filteredAttendance?.length || 0})
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-nb-surface">
                        <tr>
                          <th className="text-left p-4 text-sm font-medium text-nb-gray">Date</th>
                          <th className="text-left p-4 text-sm font-medium text-nb-gray">Employee</th>
                          <th className="text-left p-4 text-sm font-medium text-nb-gray">Role</th>
                          <th className="text-left p-4 text-sm font-medium text-nb-gray">Check In</th>
                          <th className="text-left p-4 text-sm font-medium text-nb-gray">Check Out</th>
                          <th className="text-left p-4 text-sm font-medium text-nb-gray">Status</th>
                          <th className="text-left p-4 text-sm font-medium text-nb-gray">Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAttendance?.map((att) => (
                          <tr key={att._id} className="border-t border-nb-maroon/15">
                            <td className="p-4 text-nb-white">
                              {new Date(att.attendance_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="p-4">
                              <p className="font-medium text-nb-white">{att.user_id?.name}</p>
                              <p className="text-sm text-nb-gray">{att.user_id?.email}</p>
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-1 bg-nb-surface-2 rounded text-xs text-nb-white">
                                {att.user_id?.role}
                              </span>
                            </td>
                            <td className="p-4 text-nb-white">
                              {att.check_in_time
                                ? new Date(att.check_in_time).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '--:--'}
                            </td>
                            <td className="p-4 text-nb-white">
                              {att.check_out_time
                                ? new Date(att.check_out_time).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '--:--'}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  att.attendance_status === 'Present' || att.attendance_status === 'Checked In'
                                    ? 'bg-green-500/20 text-green-400'
                                    : att.attendance_status === 'Late'
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : att.attendance_status === 'Checked Out'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-gray-500/20 text-gray-400'
                                }`}
                              >
                                {att.attendance_status}
                              </span>
                            </td>
                            <td className="p-4">
                              {att.latitude && att.longitude && (
                                <button
                                  onClick={() => openGoogleMaps(att.latitude, att.longitude)}
                                  className="flex items-center gap-1 text-nb-neon-orange hover:text-nb-neon-red transition-colors text-sm"
                                >
                                  <FiMapPin className="w-4 h-4" />
                                  View
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
