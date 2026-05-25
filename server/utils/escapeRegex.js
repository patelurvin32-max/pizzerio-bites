/** Escape user input for safe use inside RegExp. */
export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function searchRegex(query, maxLen = 80) {
  const trimmed = String(query || '').trim().slice(0, maxLen)
  if (!trimmed) return null
  return new RegExp(escapeRegex(trimmed), 'i')
}
