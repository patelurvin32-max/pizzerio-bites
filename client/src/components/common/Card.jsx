import { motion } from 'framer-motion'
import { cn } from '../../utils/helpers.js'

export default function Card({ children, className, glow }) {
  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className={cn('glass-panel rounded-2xl p-4 sm:p-5', glow && 'neon-ring', className)}
    >
      {children}
    </motion.div>
  )
}
