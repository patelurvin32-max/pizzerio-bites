import { Router } from 'express'
import * as c from '../controllers/uploadController.js'
import { protect } from '../middleware/auth.js'
import { requireMinRole } from '../middleware/requireRole.js'
import { upload } from '../middleware/upload.js'
import { validateUploadedImage } from '../middleware/validateImage.js'
import { ROLES } from '../utils/roles.js'

const r = Router()
r.post(
  '/image',
  protect,
  requireMinRole(ROLES.MANAGER),
  upload.single('file'),
  validateUploadedImage,
  c.uploadImage
)

export default r
