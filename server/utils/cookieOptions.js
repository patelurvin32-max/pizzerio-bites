function hasHttpsClientUrl() {
  return (process.env.CLIENT_URL || '')
    .split(',')
    .map((url) => url.trim())
    .some((url) => url.startsWith('https://'))
}

export function shouldUseSecureCookies() {
  return (
    process.env.COOKIE_SECURE === 'true' ||
    process.env.NODE_ENV === 'production' ||
    process.env.RENDER === 'true' ||
    hasHttpsClientUrl()
  )
}

export function sameSiteForCookies() {
  return shouldUseSecureCookies() ? 'none' : 'lax'
}
