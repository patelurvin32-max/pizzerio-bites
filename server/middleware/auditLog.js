import AuditLog from '../models/AuditLog.js'

export const logAudit = (action, resource) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res)
    res.json = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        AuditLog.create({
          actorId: req.user?._id?.toString() || '',
          actorEmail: req.user?.email || '',
          action,
          targetType: resource,
          targetId: req.params.id || '',
          meta: {},
          ip: req.ip,
        }).catch(err => {
          console.error('Failed to log audit:', err.message)
        })
      }
      return originalJson(data)
    }
    next()
  }
}
