import { lazy, Suspense, useMemo, useState } from 'react'
import {
  FiCalendar,
  FiDollarSign,
  FiDownload,
  FiFileText,
  FiFilter,
  FiShoppingBag,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
  FiX,
} from 'react-icons/fi'
import Button from '../../components/common/Button.jsx'
import Select from '../../components/common/Select.jsx'
import AnalyticsSkeleton from '../../components/analytics/AnalyticsSkeleton.jsx'
import AnalyticsSummaryCard from '../../components/analytics/AnalyticsSummaryCard.jsx'
import ProductSalesTable from '../../components/analytics/ProductSalesTable.jsx'
import {
  PaymentAnalytics,
  RealtimeInsights,
} from '../../components/analytics/AnalyticsSections.jsx'
import {
  bestSellingChartData,
  dailySalesData,
  insightItems,
  paymentMethodData,
  productSalesRows,
  weeklyOrdersData,
} from '../../data/analyticsData.js'
import { formatCurrency, todayDateValue } from '../../utils/helpers.js'

const AnalyticsCharts = lazy(() => import('../../components/analytics/AnalyticsCharts.jsx'))

const filters = ['Today', 'Yesterday', 'Last 7 Days', 'Last 30 Days', 'Custom Date']

export default function Analytics() {
  const [date, setDate] = useState(todayDateValue())
  const [filter, setFilter] = useState('Last 7 Days')
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const summaryCards = useMemo(
    () => [
      { title: 'Total Sales', value: formatCurrency(324860), trend: '+12.8%', icon: FiDollarSign, tone: 'from-nb-neon-orange/40 to-nb-gold/15' },
      { title: 'Total Orders', value: '1,248', trend: '+8.4%', icon: FiShoppingBag, tone: 'from-sky-400/35 to-cyan-300/10' },
      { title: 'Cash Payments', value: formatCurrency(42000), trend: '+4.2%', icon: FiDollarSign, tone: 'from-emerald-400/35 to-emerald-200/10' },
      { title: 'Online Payments', value: formatCurrency(111900), trend: '+15.6%', icon: FiTrendingUp, tone: 'from-cyan-400/35 to-emerald-300/10' },
      { title: 'Average Order Value', value: formatCurrency(260), trend: '+3.9%', icon: FiUserCheck, tone: 'from-nb-gold/35 to-amber-200/10' },
      { title: 'Best Selling Item', value: 'Cold Coffee', trend: '+18.2%', icon: FiTrendingUp, tone: 'from-rose-400/35 to-orange-300/10' },
      { title: 'Total Customers', value: '892', trend: '+9.7%', icon: FiUsers, tone: 'from-indigo-400/35 to-sky-300/10' },
    ],
    []
  )

  const paymentSummary = useMemo(
    () => [
      { label: 'Total Cash Transactions', value: '326', progress: 62 },
      { label: 'Total Online Transactions', value: '782', progress: 88 },
      { label: 'Total Refunds', value: '12', progress: 18 },
    ],
    []
  )

  function exportExcel() {
    const rows = [
      ['Product Name', 'Quantity Sold', 'Unit Price', 'Total Revenue', 'Percentage of Sales'],
      ...productSalesRows.map((row) => [row.name, row.quantity, row.unitPrice, row.revenue, `${row.percent}%`]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
    downloadFile(`cafe-analytics-${date}.csv`, `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`)
  }

  function exportPdf() {
    const html = buildPrintableReport()
    const report = window.open('', '_blank', 'width=1100,height=800')
    if (!report) {
      setError('Popup was blocked. Please allow popups to export the PDF report.')
      return
    }
    report.document.write(html)
    report.document.close()
    report.focus()
    report.print()
  }

  function refreshFilter(nextFilter) {
    setFilter(nextFilter)
    setError('')
    setLoading(true)
    window.setTimeout(() => setLoading(false), 450)
  }

  if (loading) return <AnalyticsSkeleton />

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <header className="sticky top-[57px] z-20 -mx-4 border-y border-white/10 bg-nb-bg/90 px-4 py-3 backdrop-blur-xl sm:top-[65px] sm:-mx-6 sm:px-6 sm:py-4 lg:top-[73px] lg:-mx-8 lg:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-bold text-nb-white sm:text-2xl lg:text-3xl">Cafe Analytics</h1>
            <p className="mt-0.5 text-xs leading-5 text-nb-gray sm:text-sm">Premium sales, product, payment, and order intelligence.</p>
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end xl:justify-end">
            <button
              type="button"
              className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-medium text-nb-white transition hover:bg-white/10 sm:w-auto lg:hidden"
              onClick={() => setShowFilters((value) => !value)}
            >
              {showFilters ? <FiX /> : <FiFilter />} Filters
            </button>
            <div className={`${showFilters ? 'grid' : 'hidden'} min-w-0 gap-3 sm:grid sm:grid-cols-2 lg:flex lg:items-end`}>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-nb-gray">Current Date</span>
                <div className="relative">
                  <FiCalendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nb-gray" />
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-10 pr-3 text-sm text-nb-white outline-none transition focus:border-nb-neon-orange/60 focus:ring-2 focus:ring-nb-neon-orange/25 sm:min-h-0"
                  />
                </div>
              </label>
              <Select label="Filter" value={filter} onChange={(event) => refreshFilter(event.target.value)}>
                {filters.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
              <Button variant="ghost" onClick={exportPdf} className="sm:col-span-1">
                <FiFileText /> Export PDF
              </Button>
              <Button onClick={exportExcel} className="sm:col-span-1">
                <FiDownload /> Export Excel
              </Button>
            </div>
          </div>
        </div>
        {error && (
          <div className="mt-4 rounded-xl border border-nb-neon-red/30 bg-nb-neon-red/10 px-4 py-3 text-sm text-nb-neon-red">
            {error}
          </div>
        )}
      </header>

      <section className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <AnalyticsSummaryCard key={card.title} {...card} />
        ))}
      </section>

      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsCharts
          dailySales={dailySalesData}
          paymentMethods={paymentMethodData}
          bestSellers={bestSellingChartData}
          weeklyOrders={weeklyOrdersData}
        />
      </Suspense>

      <ProductSalesTable rows={productSalesRows} />
      <PaymentAnalytics items={paymentSummary} />
      <RealtimeInsights items={insightItems} />
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

function buildPrintableReport() {
  const totalSales = productSalesRows.reduce((sum, row) => sum + row.revenue, 0)
  const products = productSalesRows
    .map(
      (row) => `
        <tr>
          <td>${row.name}</td>
          <td>${row.quantity}</td>
          <td>${formatCurrency(row.unitPrice)}</td>
          <td>${formatCurrency(row.revenue)}</td>
          <td>${row.percent}%</td>
        </tr>`
    )
    .join('')

  return `
    <!doctype html>
    <html>
      <head>
        <title>Cafe Analytics Report</title>
        <style>
          body { font-family: Inter, Arial, sans-serif; color: #111; padding: 32px; }
          h1 { margin: 0; font-size: 28px; }
          p { color: #555; }
          .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 24px 0; }
          .card { border: 1px solid #ddd; border-radius: 14px; padding: 16px; }
          .label { color: #666; font-size: 12px; text-transform: uppercase; }
          .value { margin-top: 8px; font-size: 22px; font-weight: 800; }
          table { width: 100%; border-collapse: collapse; margin-top: 18px; }
          th, td { border-bottom: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
          th { background: #f4f4f4; text-transform: uppercase; font-size: 11px; }
        </style>
      </head>
      <body>
        <h1>Cafe Analytics</h1>
        <p>Generated analytics export for the selected reporting window.</p>
        <div class="cards">
          <div class="card"><div class="label">Total Sales</div><div class="value">${formatCurrency(totalSales)}</div></div>
          <div class="card"><div class="label">Total Orders</div><div class="value">1,248</div></div>
          <div class="card"><div class="label">Best Selling Item</div><div class="value">Cold Coffee</div></div>
        </div>
        <h2>Product Sales</h2>
        <table>
          <thead>
            <tr><th>Product Name</th><th>Quantity Sold</th><th>Unit Price</th><th>Total Revenue</th><th>% of Sales</th></tr>
          </thead>
          <tbody>${products}</tbody>
        </table>
      </body>
    </html>
  `
}
