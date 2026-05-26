import api, { setAccessToken } from './api.js'

export async function login(payload) {
  const { data } = await api.post('/api/auth/login', payload)
  setAccessToken(data.token)
  return data
}

export async function logout() {
  try {
    await api.post('/api/auth/logout')
  } catch {
    /* session may already be invalid */
  }
  setAccessToken(null)
}

export async function me() {
  const { data } = await api.get('/api/auth/me')
  return data
}

export async function fetchRolePermissions() {
  const { data } = await api.get('/api/roles/me')
  return data
}
