import ApiRequestLog from '../models/ApiRequestLog.js'

export const logApiRequest = (req, res, next) => {
  const startTime = Date.now()

  res.on('finish', () => {
    const responseTime = Date.now() - startTime

    if (req.path.startsWith('/api/')) {
      ApiRequestLog.create({
        method: req.method,
        endpoint: req.path,
        statusCode: res.statusCode,
        responseTime,
        userId: req.user?._id,
        ipAddress: req.ip,
        requestSize: req.headers['content-length'] || 0,
        responseSize: res.get('content-length') || 0,
        queryParams: req.query,
      }).catch(err => {
        console.error('Failed to log API request:', err.message)
      })
    }
  })

  next()
}
