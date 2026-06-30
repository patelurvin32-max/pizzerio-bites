import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import {
  FiDollarSign,
  FiDownload,
  FiFilter,
  FiShoppingBag,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import Button from '../../components/common/Button.jsx'
import DatePicker from '../../components/common/DatePicker.jsx'
import Select from '../../components/common/Select.jsx'
import AnalyticsSkeleton from '../../components/analytics/AnalyticsSkeleton.jsx'
import AnalyticsSummaryCard from '../../components/analytics/AnalyticsSummaryCard.jsx'
import InventoryReportSection from '../../components/analytics/InventoryReportSection.jsx'
import OrderReportSection from '../../components/analytics/OrderReportSection.jsx'
import ProductSalesTable from '../../components/analytics/ProductSalesTable.jsx'
import {
  PaymentAnalytics,
  RealtimeInsights,
} from '../../components/analytics/AnalyticsSections.jsx'
import api from '../../services/api.js'
import { formatCurrency, todayDateValue } from '../../utils/helpers.js'

const AnalyticsCharts = lazy(() => import('../../components/analytics/AnalyticsCharts.jsx'))

const ANALYTICS_MODULES = [
  { id: 'reports', label: 'Reports', description: 'Sales, totals, charts, and filters.' },
  { id: 'inventory', label: 'Inventory Report', description: 'Stock in, stock out, and waste reports.' },
  { id: 'orders', label: 'Order Report', description: 'Order details and customer analytics.' },
]

const filters = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'Custom Date']
const emptyAnalytics = {
  summary: {
    totalSales: 0,
    totalOrders: 0,
    cashPayments: 0,
    onlinePayments: 0,
    averageOrderValue: 0,
    bestSellingItem: 'No sales yet',
    totalCustomers: 0,
    trends: {},
  },
  dailySales: [],
  paymentMethods: [],
  bestSellingProducts: [],
  weeklyOrders: [],
  productSalesRows: [],
  paymentSummary: [],
  insights: [],
}

export default function Analytics() {
  const [filter, setFilter] = useState('Last 7 Days')
  const [date, setDate] = useState(todayDateValue())
  const [fromDate, setFromDate] = useState(todayDateValue())
  const [toDate, setToDate] = useState(todayDateValue())
  const [appliedFilters, setAppliedFilters] = useState({
    filter: 'Last 7 Days',
    date: todayDateValue(),
  })
  const [activeModule, setActiveModule] = useState('reports')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [analytics, setAnalytics] = useState(emptyAnalytics)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    api
      .get('/api/analytics/cafe', { params: appliedFilters })
      .then((res) => {
        if (alive) setAnalytics({ ...emptyAnalytics, ...res.data })
      })
      .catch((err) => {
        if (alive) setError(err.message || 'Unable to load live analytics')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [appliedFilters])

  const summaryCards = useMemo(
    () => [
      { title: 'Total Sales', value: formatCurrency(analytics.summary.totalSales), trend: analytics.summary.trends.totalSales || 'Live', icon: FiDollarSign, tone: 'from-nb-neon-orange/40 to-nb-gold/15' },
      { title: 'Total Orders', value: analytics.summary.totalOrders.toLocaleString('en-IN'), trend: analytics.summary.trends.totalOrders || 'Live', icon: FiShoppingBag, tone: 'from-sky-400/35 to-cyan-300/10' },
      { title: 'Cash Payments', value: formatCurrency(analytics.summary.cashPayments), trend: analytics.summary.trends.cashPayments || 'Live', icon: FiDollarSign, tone: 'from-emerald-400/35 to-emerald-200/10' },
      { title: 'Online Payments', value: formatCurrency(analytics.summary.onlinePayments), trend: analytics.summary.trends.onlinePayments || 'Live', icon: FiTrendingUp, tone: 'from-cyan-400/35 to-emerald-300/10' },
      { title: 'Average Order Value', value: formatCurrency(analytics.summary.averageOrderValue), trend: analytics.summary.trends.averageOrderValue || 'Live', icon: FiUserCheck, tone: 'from-nb-gold/35 to-amber-200/10' },
      { title: 'Best Selling Item', value: analytics.summary.bestSellingItem, trend: analytics.summary.trends.bestSellingItem || 'Live', icon: FiTrendingUp, tone: 'from-rose-400/35 to-orange-300/10' },
      { title: 'Total Customers', value: analytics.summary.totalCustomers.toLocaleString('en-IN'), trend: analytics.summary.trends.totalCustomers || 'Live', icon: FiUsers, tone: 'from-indigo-400/35 to-sky-300/10' },
    ],
    [analytics]
  )

  function exportExcel() {
    const rows = [
      ['Product Name', 'Quantity Sold', 'Unit Price', 'Total Revenue', 'Percentage of Sales'],
      ...analytics.productSalesRows.map((row) => [row.name, row.quantity, row.unitPrice, row.revenue, `${row.percent}%`]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
    downloadFile(`cafe-analytics-${date}.csv`, `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`)
  }

  function refreshFilter(nextFilter) {
    setFilter(nextFilter)
    if (nextFilter === 'Custom Date') {
      setFromDate((current) => current || date)
      setToDate((current) => current || date)
    }
  }

  function applyFilters() {
    if (filter === 'Custom Date') {
      setAppliedFilters({
        filter,
        from: fromDate,
        to: toDate,
      })
      return
    }
    setAppliedFilters({
      filter,
      date,
    })
  }

  if (loading) return <AnalyticsSkeleton />

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <header className="sticky top-[57px] z-20 w-full border-y border-white/10 bg-nb-bg/90 py-3 backdrop-blur-xl sm:top-[65px] sm:py-4 lg:top-[73px]">
        <div className="grid gap-4 px-4 sm:px-6 lg:px-8">


          <div className="flex flex-wrap gap-2 sm:gap-3">
            {ANALYTICS_MODULES.map((module) => (
              <button
                key={module.id}
                type="button"
                onClick={() => setActiveModule(module.id)}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition sm:px-4 sm:py-2.5 ${
                  activeModule === module.id
                    ? 'border-nb-neon-orange bg-nb-neon-orange/10 shadow-[0_0_0_1px_rgba(255,122,0,0.35)]'
                    : 'border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/30'
                }`}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    activeModule === module.id ? 'bg-nb-neon-orange' : 'bg-white/20'
                  }`}
                />
                <span className="font-heading font-bold text-nb-white">{module.label}</span>
              </button>
            ))}
          </div>
        </div>
        {activeModule === 'reports' && (
          <div className="mt-4">
            <button
              type="button"
              className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-medium text-nb-white transition hover:bg-white/10 sm:w-auto lg:hidden"
              onClick={() => setShowFilters((value) => !value)}
            >
              {showFilters ? <FiX /> : <FiFilter />} Filters
            </button>
            <div
              className={`flex flex-wrap items-end gap-3 ${showFilters ? '' : 'hidden lg:flex'}`}
            >
              <div className="flex flex-col gap-1.5 min-w-[140px] flex-1 sm:flex-none sm:w-[160px] lg:w-[180px]">
                <span className="text-xs font-medium uppercase tracking-wide text-nb-gray">Filter</span>
                <Select
                  value={filter}
                  onChange={(event) => refreshFilter(event.target.value)}
                  className="w-full"
                >
                  {filters.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </div>

              {filter === 'Custom Date' ? (
                <>
                  <DatePicker label="To Date" value={toDate} onChange={setToDate} className="min-w-[140px] flex-1 sm:flex-none sm:w-[160px] lg:w-[180px]" />
                  <DatePicker label="From Date" value={fromDate} onChange={setFromDate} className="min-w-[140px] flex-1 sm:flex-none sm:w-[160px] lg:w-[180px]" />
                </>
              ) : (
                <DatePicker label="Date" value={date} onChange={setDate} className="min-w-[140px] flex-1 sm:flex-none sm:w-[160px] lg:w-[180px]" />
              )}

              <Button onClick={applyFilters} className="h-[48px] min-w-[100px] flex-1 sm:flex-none sm:w-[110px] lg:w-[120px]">
                Search
              </Button>
              <Button onClick={exportExcel} className="h-[48px] min-w-[120px] flex-1 sm:flex-none sm:w-[130px] lg:w-[140px]">
                <FiDownload /> Export Excel
              </Button>
            </div>
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-xl border border-nb-neon-red/30 bg-nb-neon-red/10 px-4 py-3 text-sm text-nb-neon-red">
            {error}
          </div>
        )}
      </header>

      {activeModule === 'inventory' ? (
        <InventoryReportSection visible />
      ) : activeModule === 'orders' ? (
        <OrderReportSection visible />
      ) : (
        <>
          <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            {summaryCards.map((card) => (
              <AnalyticsSummaryCard key={card.title} {...card} />
            ))}
          </section>

          <Suspense fallback={<AnalyticsSkeleton />}>
            <AnalyticsCharts
              paymentMethods={analytics.paymentMethods}
              bestSellers={analytics.bestSellingProducts}
              weeklyOrders={analytics.weeklyOrders}
            />
          </Suspense>

          <ProductSalesTable rows={analytics.productSalesRows} />
          <PaymentAnalytics items={analytics.paymentSummary} />
          <RealtimeInsights items={analytics.insights} />
        </>
      )}
    </div>
  )
}

function downloadFile(filename, href) {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}
