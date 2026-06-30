import { Router } from 'express'
import * as c from '../controllers/analyticsController.js'
import { protect } from '../middleware/auth.js'
import { requireMinRole } from '../middleware/requireRole.js'
import { ROLES } from '../utils/roles.js'

const r = Router()
r.use(protect, requireMinRole(ROLES.STAFF))
r.get('/operations', c.operationsSummary)
r.use(requireMinRole(ROLES.MANAGER))
r.get('/summary', c.dashboardSummary)
r.get('/sales', c.salesSeries)
r.get('/cafe', c.cafeAnalytics)
r.get('/traffic', c.trafficStub)
r.get('/order-report', c.orderReport)

export default r
