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

export default function InventoryReportSection({ visible }) {
  const notify = useNotify()
  const [reports, setReports] = useState(null)
  const [reportDateRange, setReportDateRange] = useState({ startDate: '', endDate: '' })

  async function loadReports() {
    try {
      const params = {}
      if (reportDateRange.startDate) params.startDate = reportDateRange.startDate
      if (reportDateRange.endDate) params.endDate = reportDateRange.endDate
      const { data } = await api.get('/api/inventory/reports', { params })
      setReports(data)
    } catch (e) {
      notify.error(e.message)
    }
  }

  if (!visible) return null

  return (
    <div className="space-y-4">
      <Card className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto] lg:items-end">
        <CalendarDatePicker
          label="Start Date"
          value={reportDateRange.startDate}
          onChange={(val) => setReportDateRange({ ...reportDateRange, startDate: val })}
        />
        <CalendarDatePicker
          label="End Date"
          value={reportDateRange.endDate}
          onChange={(val) => setReportDateRange({ ...reportDateRange, endDate: val })}
        />
        <Button onClick={loadReports}>Apply Filter</Button>
        <Button
          variant="ghost"
          onClick={() => {
            setReportDateRange({ startDate: '', endDate: '' })
            setReports(null)
          }}
        >
          Clear
        </Button>
      </Card>

      {reports?.summary && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryStat label="Total Stock In Value" value={formatCurrency(reports.summary.totalStockInValue)} tone="success" />
          <SummaryStat label="Total Stock Out" value={reports.summary.totalStockOut} />
          <SummaryStat label="Total Waste" value={reports.summary.totalWaste} tone="warning" />
          <SummaryStat label="Total Transactions" value={reports.summary.totalTransactions} />
        </div>
      )}

      <Card>
        <h2 className="mb-4 font-heading text-lg font-semibold">Stock In Report</h2>
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Product</Th>
              <Th>Quantity</Th>
              <Th>Supplier</Th>
              <Th>Invoice</Th>
            </tr>
          </thead>
          <tbody>
            {reports?.stockIn?.map((tx) => (
              <Tr key={tx._id}>
                <Td>{new Date(tx.date).toLocaleDateString()}</Td>
                <Td>{tx.productName}</Td>
                <Td>{tx.quantity} {tx.unit}</Td>
                <Td>{tx.supplierName || '-'}</Td>
                <Td>{tx.invoiceNumber || '-'}</Td>
              </Tr>
            ))}
            {!reports?.stockIn?.length && <tr><Td colSpan="5" className="py-8 text-center text-nb-gray">No stock in records found</Td></tr>}
          </tbody>
        </Table>
      </Card>

      <Card>
        <h2 className="mb-4 font-heading text-lg font-semibold">Stock Out Report</h2>
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Product</Th>
              <Th>Quantity</Th>
              <Th>Reason</Th>
              <Th>Department</Th>
            </tr>
          </thead>
          <tbody>
            {reports?.stockOut?.map((tx) => (
              <Tr key={tx._id}>
                <Td>{new Date(tx.date).toLocaleDateString()}</Td>
                <Td>{tx.productName}</Td>
                <Td>{tx.quantity} {tx.unit}</Td>
                <Td>{tx.reason}</Td>
                <Td>{tx.department}</Td>
              </Tr>
            ))}
            {!reports?.stockOut?.length && <tr><Td colSpan="5" className="py-8 text-center text-nb-gray">No stock out records found</Td></tr>}
          </tbody>
        </Table>
      </Card>

      <Card>
        <h2 className="mb-4 font-heading text-lg font-semibold">Waste Report</h2>
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Product</Th>
              <Th>Quantity</Th>
              <Th>Reason</Th>
              <Th>Staff</Th>
            </tr>
          </thead>
          <tbody>
            {reports?.waste?.map((tx) => (
              <Tr key={tx._id}>
                <Td>{new Date(tx.date).toLocaleDateString()}</Td>
                <Td>{tx.productName}</Td>
                <Td>{tx.quantity} {tx.unit}</Td>
                <Td>{tx.reason}</Td>
                <Td>{tx.staffName || '-'}</Td>
              </Tr>
            ))}
            {!reports?.waste?.length && <tr><Td colSpan="5" className="py-8 text-center text-nb-gray">No waste records found</Td></tr>}
          </tbody>
        </Table>
      </Card>

      <Card>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => exportCsv('stock-in-report', reports?.stockIn, ['date', 'productName', 'quantity', 'unit', 'supplierName', 'invoiceNumber'], notify)}>
            <FiDownload /> Stock In Excel
          </Button>
          <Button variant="ghost" onClick={() => exportCsv('stock-out-report', reports?.stockOut, ['date', 'productName', 'quantity', 'unit', 'reason', 'department'], notify)}>
            <FiDownload /> Stock Out Excel
          </Button>
          <Button variant="ghost" onClick={() => exportCsv('waste-report', reports?.waste, ['date', 'productName', 'quantity', 'unit', 'reason', 'staffName'], notify)}>
            <FiDownload /> Waste Excel
          </Button>
        </div>
      </Card>
    </div>
  )
}
