export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { ok: false, message: 'Password is required' }
  }
  if (password.length < 10) {
    return { ok: false, message: 'Password must be at least 10 characters' }
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { ok: false, message: 'Password must include at least one letter' }
  }
  if (!/\d/.test(password)) {
    return { ok: false, message: 'Password must include at least one number' }
  }
  return { ok: true }
}
