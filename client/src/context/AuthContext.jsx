import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authApi from '../services/authService.js'
import { getAccessToken } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [showAttendancePopup, setShowAttendancePopup] = useState(false)

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
    setPermissions(null)
    setTodayAttendance(null)
    setShowAttendancePopup(false)
  }, [])

  const refresh = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setUser(null)
      setPermissions(null)
      setLoading(false)
      return
    }
    try {
      const [u, p] = await Promise.all([authApi.me(), authApi.fetchRolePermissions()])
      setUser(u)
      setPermissions(p.permissions || {})
    } catch {
      await authApi.logout()
      setUser(null)
      setPermissions(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password })
    setUser(data.user)
    setTodayAttendance(data.todayAttendance || null)
    
    // Show attendance popup for Reception users if they haven't checked in today
    if (data.user.role === 'RECEPTION' && (!data.todayAttendance || !data.todayAttendance.check_in_time)) {
      setShowAttendancePopup(true)
    }
    
    try {
      const p = await authApi.fetchRolePermissions()
      setPermissions(p.permissions || {})
    } catch {
      setPermissions({})
    }
    return data.user
  }, [])

  const value = useMemo(
    () => ({
      user,
      permissions,
      loading,
      login,
      logout,
      refresh,
      isAuthenticated: Boolean(user),
      todayAttendance,
      setTodayAttendance,
      showAttendancePopup,
      setShowAttendancePopup,
    }),
    [user, permissions, loading, login, logout, refresh, todayAttendance, showAttendancePopup]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
