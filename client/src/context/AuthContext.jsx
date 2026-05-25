import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as authApi from '../services/authService.js'
import { getAccessToken } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(async () => {
    await authApi.logout()
    setUser(null)
    setPermissions(null)
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
    }),
    [user, permissions, loading, login, logout, refresh]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
