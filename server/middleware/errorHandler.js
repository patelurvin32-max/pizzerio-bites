export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` })
}

export function errorHandler(err, req, res, _next) {
  const status = err.statusCode || err.status || 500
  const message = status >= 500 && process.env.NODE_ENV === 'production' ? 'Server error' : err.message || 'Server error'
  if (process.env.NODE_ENV !== 'production') {
    console.error(err)
  }
  res.status(status).json({ message })
}
