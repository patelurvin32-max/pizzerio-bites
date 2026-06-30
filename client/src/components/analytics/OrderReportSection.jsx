import { useState } from 'react'
import { FiDownload } from 'react-icons/fi'
import Card from '../common/Card.jsx'
import Button from '../common/Button.jsx'
import Table, { Th, Tr, Td } from '../common/Table.jsx'
import CalendarDatePicker from '../reservations/CalendarDatePicker.jsx'
import api from '../../services/api.js'
import { useNotify } from '../../context/NotificationContext.jsx'
import { formatCurrency } from '../../utils/helpers.js'

function SummaryStat({ label, value, tone = 'default' }) {
  const tones = {
    default: 'text-nb-white',
    success: 'text-emerald-300',
    warning: 'text-nb-gold',
    danger: 'text-nb-neon-red',
  }

  return (
    <Card className="bg-black/25">
      <p className="text-xs font-medium uppercase tracking-wide text-nb-gray">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tones[tone] || tones.default}`}>{value}</p>
    </Card>
  )
}

function exportCsv(name, rows, headers, notify) {
  const safeRows = rows || []
  if (!safeRows.length) {
    notify.error('No rows to export')
    return
  }
  const csv = [headers.join(','), ...safeRows.map((row) => headers.map((key) => `"${String(row[key] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function OrderReportSection({ visible }) {
  const notify = useNotify()
  const [reportData, setReportData] = useState(null)
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })

  async function loadReport() {
    try {
      const params = {}
      if (dateRange.startDate) params.startDate = dateRange.startDate
      if (dateRange.endDate) params.endDate = dateRange.endDate
      const { data } = await api.get('/api/analytics/order-report', { params })
      setReportData(data)
    } catch (e) {
      notify.error(e.message)
    }
  }

  if (!visible) return null

  return (
    <div className="space-y-4">
      <Card className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto] lg:items-end">
        <CalendarDatePicker
          label="From Date"
          value={dateRange.startDate}
          onChange={(val) => setDateRange({ ...dateRange, startDate: val })}
        />
        <CalendarDatePicker
          label="To Date"
          value={dateRange.endDate}
          onChange={(val) => setDateRange({ ...dateRange, endDate: val })}
        />
        <Button onClick={loadReport}>Search</Button>
        <Button
          variant="ghost"
          onClick={() => {
            setDateRange({ startDate: '', endDate: '' })
            setReportData(null)
          }}
        >
          Clear
        </Button>
      </Card>

      {reportData?.summary && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStat label="Total Orders" value={reportData.summary.totalOrders} tone="default" />
          <SummaryStat label="Total Sales" value={formatCurrency(reportData.summary.totalSales)} tone="success" />
          <SummaryStat label="Cash Payments" value={formatCurrency(reportData.summary.cashPayments)} tone="success" />
          <SummaryStat label="Online Payments" value={formatCurrency(reportData.summary.onlinePayments)} tone="success" />
          <SummaryStat label="Average Order Value" value={formatCurrency(reportData.summary.averageOrderValue)} tone="default" />
          <SummaryStat label="Unique Customers" value={reportData.summary.uniqueCustomers} tone="default" />
          <SummaryStat label="Repeated Customers" value={reportData.summary.repeatedCustomers} tone="warning" />
        </div>
      )}

      <Card>
        <h2 className="mb-4 font-heading text-lg font-semibold">Order Report</h2>
        <Table>
          <thead>
            <tr>
              <Th>Order ID</Th>
              <Th>Order Date & Time</Th>
              <Th>Customer Name</Th>
              <Th>Customer Mobile Number</Th>
              <Th>Order Type</Th>
              <Th>Payment Method</Th>
              <Th>Total Items</Th>
              <Th>Total Amount</Th>
              <Th>Order Status</Th>
            </tr>
          </thead>
          <tbody>
            {reportData?.orders?.map((order) => (
              <Tr key={order.orderNumber}>
                <Td>{order.orderNumber}</Td>
                <Td>{order.createdAt}</Td>
                <Td>{order.customerName}</Td>
                <Td>{order.customerPhone}</Td>
                <Td>{order.orderType}</Td>
                <Td>{order.paymentMethod}</Td>
                <Td>{order.totalItems}</Td>
                <Td>{formatCurrency(order.totalAmount)}</Td>
                <Td>{order.status}</Td>
              </Tr>
            ))}
            {!reportData?.orders?.length && <tr><Td colSpan="9" className="py-8 text-center text-nb-gray">No orders found</Td></tr>}
          </tbody>
        </Table>
      </Card>

      <Card>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => exportCsv('order-report', reportData?.orders, ['orderNumber', 'createdAt', 'customerName', 'customerPhone', 'orderType', 'paymentMethod', 'totalItems', 'totalAmount', 'status'], notify)}>
            <FiDownload /> Download Excel
          </Button>
        </div>
      </Card>
    </div>
  )
}
