import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { motion } from 'framer-motion'
import {
  FiPackage,
  FiShoppingBag,
  FiUsers,
  FiCalendar,
  FiTrendingUp,
  FiAlertTriangle,
  FiMail,
} from 'react-icons/fi'
import api from '../../services/api.js'
import { useFetch } from '../../hooks/useFetch.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Loader from '../../components/common/Loader.jsx'
import Card from '../../components/common/Card.jsx'
import Button from '../../components/common/Button.jsx'
import StatCard from '../../components/dashboard/StatCard.jsx'
import SalesAreaChart from '../../components/dashboard/SalesAreaChart.jsx'
import OrdersBarChart from '../../components/dashboard/OrdersBarChart.jsx'
import { ROLES } from '../../utils/constants.js'
import { formatCurrency } from '../../utils/helpers.js'

function OperationsDashboard() {
  const { user } = useAuth()
  const isReception = user?.role === ROLES.RECEPTION
  const { data, loading, error } = useFetch(
    () => api.get('/api/analytics/operations').then((r) => r.data),
    []
  )

  if (loading) return <Loader label="Loading your desk" />
  if (error) {
    return (
      <Card className="border-nb-neon-red/40">
        <p className="text-sm text-nb-neon-red">{error.message}</p>
      </Card>
    )
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div>
        <h1 className="font-heading text-2xl font-bold text-nb-white sm:text-3xl">Front desk overview</h1>
        <p className="text-sm text-nb-gray">
          {isReception
            ? 'Today\'s orders and inventory access at a glance.'
            : 'Today\'s guests, orders, and inbox - reservations & messages at a glance.'}
        </p>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Orders today" value={data.ordersToday} icon={FiShoppingBag} delay={0.02} />
        {!isReception && (
          <StatCard label="Pending reservations" value={data.reservationsPending} icon={FiCalendar} delay={0.06} />
        )}
        <StatCard label="Pending orders" value={data.ordersPending} icon={FiPackage} delay={0.1} />
        {!isReception && <StatCard label="Unread messages" value={data.unreadMessages} icon={FiMail} delay={0.14} />}
      </div>

      <Card glow className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-nb-gray">Jump to the modules you use most on reception.</p>
        <div className="flex flex-wrap gap-2">
          {!isReception && (
            <>
              <Link to="/dashboard/reservations">
                <Button size="sm">Reservations</Button>
              </Link>
              <Link to="/dashboard/messages">
                <Button size="sm" variant="ghost">
                  Messages
                </Button>
              </Link>
            </>
          )}
          <Link to="/dashboard/orders">
            <Button size="sm" variant={isReception ? undefined : 'ghost'}>
              Orders
            </Button>
          </Link>
          {isReception && (
            <Link to="/dashboard/inventory">
              <Button size="sm" variant="ghost">
                Inventory
              </Button>
            </Link>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

function ManagementDashboard() {
  const { data: summary, loading: s1, error: e1 } = useFetch(
    () => api.get('/api/analytics/summary').then((r) => r.data),
    []
  )
  const { data: sales, loading: s2, error: e2 } = useFetch(
    () => api.get('/api/analytics/sales', { params: { days: 14 } }).then((r) => r.data),
    []
  )
  const chartsRef = useRef(null)

  useEffect(() => {
    if (!chartsRef.current || !sales) return undefined
    const ctx = gsap.context(() => {
      gsap.from('.nb-dash-chart', { opacity: 0, y: 14, duration: 0.7, ease: 'power3.out', stagger: 0.12 })
    }, chartsRef)
    return () => ctx.revert()
  }, [sales])

  if (s1 || s2) return <Loader label="Syncing telemetry" />
  if (e1 || e2) {
    return (
      <Card className="border-nb-neon-red/40">
        <p className="text-sm text-nb-neon-red">{(e1 || e2).message}</p>
      </Card>
    )
  }

  const popular = summary?.popularItems || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-heading text-2xl font-bold text-nb-white sm:text-3xl"
          >
            Operations overview
          </motion.h1>
          <p className="text-sm text-nb-gray">Live pulse across orders, revenue, guests, and inventory risk.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total orders" value={summary.totalOrders} icon={FiShoppingBag} delay={0.02} hint="All-time volume" />
        <StatCard
          label="30-day revenue"
          value={formatCurrency(summary.revenue30d)}
          icon={FiTrendingUp}
          delay={0.06}
          hint="Paid orders only"
        />
        <StatCard label="Orders today" value={summary.ordersToday} icon={FiPackage} delay={0.1} hint="Since midnight (server)" />
        <StatCard label="Pending reservations" value={summary.reservationsPending} icon={FiCalendar} delay={0.14} />
      </div>

      <div ref={chartsRef} className="grid gap-4 lg:grid-cols-3">
        <Card className="nb-dash-chart lg:col-span-2" glow>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-heading text-lg font-bold text-nb-white">Revenue trend</h2>
            <span className="text-xs uppercase tracking-wide text-nb-gray">14 days</span>
          </div>
          <SalesAreaChart data={sales.series} />
        </Card>
        <Card className="nb-dash-chart">
          <h2 className="font-heading text-lg font-bold text-nb-white">People & stock</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <span className="flex items-center gap-2 text-nb-gray">
                <FiUsers /> Active users
              </span>
              <span className="font-semibold text-nb-white">{summary.userCount}</span>
            </li>
            <li className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <span className="flex items-center gap-2 text-nb-gray">Staff on roster</span>
              <span className="font-semibold text-nb-white">{summary.staffActive}</span>
            </li>
            <li className="flex items-center justify-between rounded-xl border border-nb-neon-red/25 bg-nb-neon-red/10 px-3 py-2">
              <span className="flex items-center gap-2 text-nb-neon-red">
                <FiAlertTriangle /> Low stock SKUs
              </span>
              <span className="font-semibold text-nb-neon-red">{summary.lowStockCount}</span>
            </li>
          </ul>
          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-nb-gray">Popular items</h3>
            <div className="mt-2 space-y-2">
              {popular.length === 0 && <p className="text-sm text-nb-gray">No sales data yet.</p>}
              {popular.map((p) => (
                <div key={p._id} className="flex items-center justify-between text-sm">
                  <span className="text-nb-white/90">{p._id}</span>
                  <span className="text-nb-gold">{p.qty} sold</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card className="nb-dash-chart" glow>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-nb-white">Daily orders</h2>
        </div>
        <OrdersBarChart data={sales.series} />
      </Card>
    </div>
  )
}

export default function Dashboard() {
  const { permissions, loading } = useAuth()

  if (loading) return <Loader label="Loading dashboard" />

  if (permissions?.analytics) {
    return <ManagementDashboard />
  }

  return <OperationsDashboard />
}
