import ErrorLog from '../models/ErrorLog.js'

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` })
}

export function errorHandler(err, req, res, _next) {
  const status = err.statusCode || err.status || 500
  const message = status >= 500 && process.env.NODE_ENV === 'production' ? 'Server error' : err.message || 'Server error'
  
  if (process.env.NODE_ENV !== 'production') {
    console.error(err)
  }

  ErrorLog.create({
    message: err.message,
    stack: err.stack,
    type: categorizeError(err),
    endpoint: req.path,
    method: req.method,
    userId: req.user?._id,
    ipAddress: req.ip,
    responseStatus: status,
    severity: status >= 500 ? 'high' : 'medium',
    environment: process.env.NODE_ENV || 'development',
    requestBody: sanitize(req.body),
  }).catch(logErr => {
    console.error('Failed to log error:', logErr.message)
  })

  res.status(status).json({ message })
}

function categorizeError(err) {
  if (err.statusCode === 400) return 'validation_error'
  if (err.statusCode === 401) return 'auth_error'
  if (err.statusCode === 404) return 'not_found'
  if (err.statusCode >= 500) return 'server_error'
  return 'server_error'
}

function sanitize(body) {
  if (!body) return null
  const sanitized = { ...body }
  delete sanitized.password
  delete sanitized.token
  delete sanitized.refreshToken
  return sanitized
}
