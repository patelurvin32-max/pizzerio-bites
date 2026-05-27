import { FiActivity, FiCreditCard, FiDollarSign, FiShoppingBag, FiTrendingUp } from 'react-icons/fi'
import Card from '../common/Card.jsx'

export function PaymentAnalytics({ items }) {
  return (
    <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} className="min-w-0 overflow-hidden p-3 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-nb-gray sm:text-xs">{item.label}</p>
              <p className="mt-2 font-heading text-xl font-bold text-nb-white sm:text-2xl">{item.value}</p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-nb-neon-orange">
              <FiCreditCard />
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-nb-neon-orange via-nb-gold to-emerald-400" style={{ width: `${item.progress}%` }} />
          </div>
        </Card>
      ))}
    </section>
  )
}

export function RealtimeInsights({ items }) {
  const icons = [FiActivity, FiCreditCard, FiDollarSign, FiShoppingBag, FiTrendingUp]
  return (
    <section>
      <SectionTitle title="Real-Time Insights" subtitle="Smart signals for faster manager decisions" />
      <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {items.map((item, index) => {
          const Icon = icons[index % icons.length]
          return (
            <Card key={item.label} className="min-w-0 p-3 sm:p-5">
              <Icon className="h-5 w-5 text-nb-neon-orange" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-nb-gray">{item.label}</p>
              <p className="mt-2 font-heading text-lg font-bold text-nb-white sm:text-xl">{item.value}</p>
              <p className="mt-2 text-xs leading-5 text-nb-gray">{item.detail}</p>
            </Card>
          )
        })}
      </div>
    </section>
  )
}

function SectionTitle({ title, subtitle }) {
  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-nb-white">{title}</h2>
      <p className="text-sm text-nb-gray">{subtitle}</p>
    </div>
  )
}
