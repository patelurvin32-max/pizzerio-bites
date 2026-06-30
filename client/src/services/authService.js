import api, { setAccessToken } from './api.js'

const RETRYABLE = /timeout|network error|unable to reach|econnrefused|econnreset/i

function isRetryableError(err) {
  return RETRYABLE.test(err?.message || '')
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function refreshSession() {
  const { data } = await api.post('/api/auth/refresh')
  setAccessToken(data.token)
  return data
}

export async function login(payload, retries = 1) {
  try {
    const { data } = await api.post('/api/auth/login', payload)
    setAccessToken(data.token)
    return data
  } catch (err) {
    if (retries > 0 && isRetryableError(err)) {
      console.warn('[auth] Login failed, retrying…', err.message)
      await wait(800)
      return login(payload, retries - 1)
    }
    throw err
  }
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

export function parseTokenExp(token) {
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 : null
  } catch {
    return null
  }
}
