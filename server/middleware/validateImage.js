import fs from 'fs'

const SIGNATURES = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
]

function matchesSignature(buffer, bytes) {
  if (buffer.length < bytes.length) return false
  return bytes.every((b, i) => buffer[i] === b)
}

export function validateUploadedImage(req, res, next) {
  if (!req.file?.path) return next()
  try {
    const fd = fs.openSync(req.file.path, 'r')
    const buf = Buffer.alloc(16)
    fs.readSync(fd, buf, 0, 16, 0)
    fs.closeSync(fd)
    const ok = SIGNATURES.some((s) => matchesSignature(buf, s.bytes))
    if (!ok) {
      fs.unlinkSync(req.file.path)
      return res.status(400).json({ message: 'Invalid image file' })
    }
    next()
  } catch (err) {
    next(err)
  }
}
