import { motion } from 'framer-motion'
import Card from '../common/Card.jsx'

export default function StatCard({ label, value, hint, icon: Icon, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}>
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-nb-neon-orange/10 blur-2xl" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-nb-gray">{label}</p>
            <p className="mt-2 font-heading text-2xl font-bold text-nb-white sm:text-3xl">{value}</p>
            {hint && <p className="mt-1 text-xs text-nb-gray">{hint}</p>}
          </div>
          {Icon && (
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-nb-neon-orange">
              <Icon className="h-5 w-5" />
            </span>
          )}
        </div>
      </Card>
    </motion.div>
  )
}
