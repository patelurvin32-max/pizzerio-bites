import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiPlus, FiRefreshCw } from 'react-icons/fi'
import Card from '../../components/common/Card.jsx'
import Button from '../../components/common/Button.jsx'
import Select from '../../components/common/Select.jsx'
import Table, { Th, Tr, Td } from '../../components/common/Table.jsx'
import Loader from '../../components/common/Loader.jsx'
import OrderFormModal from '../../components/orders/OrderFormModal.jsx'
import OrderTotal from '../../components/orders/OrderTotal.jsx'
import { orderService } from '../../services/orderService.js'
import { ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS, canCreateOrder } from '../../utils/constants.js'
import { cn, formatCurrency, formatDate } from '../../utils/helpers.js'
import { useNotify } from '../../context/NotificationContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

const PAYMENT_METHOD_OPTIONS = ['cash', 'online', 'card', 'wallet']
const PAGE_LENGTH_OPTIONS = [10, 25, 50, 100]

function OrderCard({ order, onPatch, onInvoice }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-xs text-nb-gold">{order.orderNumber}</p>
          <p className="mt-1 truncate text-base font-semibold text-nb-white">{order.customerName}</p>
          <p className="mt-1 text-xs text-nb-gray">{formatDate(order.createdAt)}</p>
        </div>
        <p className="shrink-0 text-lg font-bold text-nb-gold">{formatCurrency(order.total)}</p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
        <Select
          label="Status"
          value={order.status}
          onChange={(e) => onPatch(order._id, { status: e.target.value })}
        >
          {ORDER_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll('_', ' ')}
            </option>
          ))}
        </Select>
        <Select
          label="Payment"
          value={order.paymentStatus}
          onChange={(e) => onPatch(order._id, { paymentStatus: e.target.value })}
        >
          {PAYMENT_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
      <div className="mt-3">
        <Button size="lg" variant="ghost" fullWidth onClick={() => onInvoice(order._id)}>
          Invoice
        </Button>
      </div>
    </article>
  )
}

export default function Orders() {
  const notify = useNotify()
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [pageLength, setPageLength] = useState(10)
  const [page, setPage] = useState(1)
  const showCreate = canCreateOrder(user?.role)
  const totalPages = Math.max(1, Math.ceil(items.length / pageLength))
  const currentPage = Math.min(page, totalPages)
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageLength
    return items.slice(start, start + pageLength)
  }, [items, currentPage, pageLength])
  const pageStart = items.length ? (currentPage - 1) * pageLength + 1 : 0
  const pageEnd = Math.min(currentPage * pageLength, items.length)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await orderService.list()
      setItems(data.items)
    } catch (e) {
      notify.error(e.message)
    } finally {
      setLoading(false)
    }
  }, [notify])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [pageLength])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  async function patch(id, body) {
    try {
      await orderService.update(id, body)
      notify.success('Order updated')
      load()
    } catch (e) {
      notify.error(e.message)
    }
  }

  async function invoice(id) {
    try {
      const data = await orderService.invoice(id)
      notify.info(`Invoice ${data.invoiceNumber} ready — export wiring can attach PDF.`)
    } catch (e) {
      notify.error(e.message)
    }
  }

  return (
    <div className="space-y-4 pb-4 lg:pb-0">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-heading text-xl font-bold text-nb-white sm:text-2xl">Orders</h1>
          <Button
            variant="ghost"
            size="sm"
            className="!min-h-[44px] shrink-0 lg:hidden"
            onClick={load}
            aria-label="Refresh orders"
          >
            <FiRefreshCw className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[auto_1fr] lg:items-end">
          <Select label="Page length" value={pageLength} onChange={(e) => setPageLength(Number(e.target.value))} className="min-w-0 sm:max-w-[140px]">
            {PAGE_LENGTH_OPTIONS.map((length) => (
              <option key={length} value={length}>
                {length}
              </option>
            ))}
          </Select>
          <div className={cn('grid gap-2 sm:col-span-1 lg:justify-self-end', showCreate ? 'grid-cols-1 min-[420px]:grid-cols-2 lg:flex' : 'grid-cols-1')}>
            {showCreate && (
              <Button size="lg" fullWidth onClick={() => setCreateOpen(true)} className="!min-h-[52px] lg:!min-w-[170px]">
                <FiPlus className="h-5 w-5 shrink-0" aria-hidden />
                New order
              </Button>
            )}
            <Button variant="ghost" size="lg" fullWidth onClick={load} className="hidden lg:inline-flex lg:!min-w-[140px]">
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <Card className="!p-3 sm:!p-5">
        {loading ? (
          <Loader />
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-nb-gray">No orders for this filter.</p>
        ) : (
          <>
            {/* Mobile & tablet cards */}
            <div className="space-y-3 md:hidden">
              {pagedItems.map((o) => (
                <OrderCard key={o._id} order={o} onPatch={patch} onInvoice={invoice} />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <thead>
                  <tr>
                    <Th>Order</Th>
                    <Th>Customer</Th>
                    <Th>Total</Th>
                    <Th>Payment status</Th>
                    <Th>Payment method</Th>
                    <Th>Created</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {pagedItems.map((o) => (
                    <Tr key={o._id}>
                      <Td className="font-mono text-xs text-nb-gold">{o.orderNumber}</Td>
                      <Td>{o.customerName}</Td>
                      <Td>
                        <OrderTotal value={o.total} />
                      </Td>
                      <Td>
                        <Select
                          value={o.paymentStatus}
                          onChange={(e) => patch(o._id, { paymentStatus: e.target.value })}
                          className="!min-h-[40px] !py-2 text-xs"
                        >
                          {PAYMENT_STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </Select>
                      </Td>
                      <Td>
                        <Select
                          value={o.paymentMethod || 'card'}
                          onChange={(e) => patch(o._id, { paymentMethod: e.target.value })}
                          className="!min-h-[40px] !py-2 text-xs"
                        >
                          {PAYMENT_METHOD_OPTIONS.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </Select>
                      </Td>
                      <Td className="text-xs text-nb-gray">{formatDate(o.createdAt)}</Td>
                      <Td className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => invoice(o._id)}>
                          Invoice
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <div className="mt-4 flex flex-col gap-3 text-sm text-nb-gray sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing {pageStart}-{pageEnd} of {items.length}
              </span>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <button type="button" className="hover:text-nb-white disabled:opacity-40" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </button>
                <span>
                  Page {currentPage} / {totalPages}
                </span>
                <button type="button" className="hover:text-nb-white disabled:opacity-40" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {showCreate && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-40 md:hidden">
          <Button
            size="lg"
            onClick={() => setCreateOpen(true)}
            className="!h-14 !min-h-[56px] !w-14 !min-w-[56px] !rounded-full !p-0 shadow-neon-md"
            aria-label="New order"
          >
            <FiPlus className="h-6 w-6" />
          </Button>
        </div>
      )}

      <OrderFormModal open={createOpen} onClose={() => setCreateOpen(false)} onSaved={load} />
    </div>
  )
}
