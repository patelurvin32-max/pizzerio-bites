import AuditLog from '../models/AuditLog.js'

export async function writeAudit(req, { action, targetType, targetId, meta }) {
  try {
    await AuditLog.create({
      actorId: req.user?.id || null,
      actorEmail: req.user?.email || '',
      action,
      targetType,
      targetId: targetId ? String(targetId) : '',
      meta: meta || {},
      ip: req.ip || req.headers['x-forwarded-for'] || '',
    })
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[audit] failed to write log:', err.message)
    }
  }
}
