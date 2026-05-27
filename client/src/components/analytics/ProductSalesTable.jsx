import { FiChevronLeft, FiChevronRight, FiSearch } from 'react-icons/fi'
import Button from '../common/Button.jsx'
import Table, { Td, Th, Tr } from '../common/Table.jsx'
import { useAnalyticsTable } from '../../hooks/useAnalyticsTable.js'
import { formatCurrency } from '../../utils/helpers.js'

export default function ProductSalesTable({ rows }) {
  const table = useAnalyticsTable(rows)

  return (
    <section className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-glass backdrop-blur-xl sm:p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-heading text-lg font-bold text-nb-white">Product Sales</h2>
          <p className="text-xs text-nb-gray">{table.totalRows} products in the selected window</p>
        </div>
        <label className="relative w-full lg:max-w-xs">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nb-gray" />
          <input
            value={table.search}
            onChange={(event) => table.setSearch(event.target.value)}
            placeholder="Search products"
            className="min-h-[44px] w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-10 pr-3 text-sm text-nb-white outline-none transition placeholder:text-nb-gray/60 focus:border-nb-neon-orange/60 focus:ring-2 focus:ring-nb-neon-orange/25"
          />
        </label>
      </div>

      {table.rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-nb-gray">
          No products match this search.
        </div>
      ) : (
        <Table>
          <thead>
            <tr>
              <SortableHead label="Product Name" column="name" table={table} />
              <SortableHead label="Quantity Sold" column="quantity" table={table} />
              <SortableHead label="Unit Price" column="unitPrice" table={table} />
              <SortableHead label="Total Revenue" column="revenue" table={table} />
              <SortableHead label="% of Sales" column="percent" table={table} />
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <Tr key={row.id}>
                <Td className="font-semibold">{row.name}</Td>
                <Td>{row.quantity}</Td>
                <Td>{formatCurrency(row.unitPrice)}</Td>
                <Td className="font-semibold text-nb-gold">{formatCurrency(row.revenue)}</Td>
                <Td>
                  <div className="flex min-w-32 items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-gradient-to-r from-nb-neon-orange to-nb-gold" style={{ width: `${row.percent}%` }} />
                    </div>
                    <span className="w-9 text-xs text-nb-gray">{row.percent}%</span>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <div className="mt-4 flex flex-col gap-3 text-sm text-nb-gray sm:flex-row sm:items-center sm:justify-between">
        <span>
          Page {table.page} of {table.pageCount}
        </span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={table.page <= 1} onClick={() => table.setPage((page) => page - 1)}>
            <FiChevronLeft /> Prev
          </Button>
          <Button variant="ghost" size="sm" disabled={table.page >= table.pageCount} onClick={() => table.setPage((page) => page + 1)}>
            Next <FiChevronRight />
          </Button>
        </div>
      </div>
    </section>
  )
}

function SortableHead({ label, column, table }) {
  const active = table.sort.key === column
  return (
    <Th>
      <button type="button" className="inline-flex items-center gap-1 hover:text-nb-white" onClick={() => table.requestSort(column)}>
        {label}
        <span className="text-[10px]">{active ? (table.sort.direction === 'asc' ? 'ASC' : 'DESC') : ''}</span>
      </button>
    </Th>
  )
}
