import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) {
      return res.status(401).json({ message: 'Not authorized' })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)
    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'User not found or inactive' })
    }
    if ((decoded.tv ?? 0) !== (user.tokenVersion ?? 0)) {
      return res.status(401).json({ message: 'Session expired. Please sign in again.' })
    }
    req.user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
    }
    req.userDoc = user
    next()
  } catch {
    return res.status(401).json({ message: 'Not authorized' })
  }
}
