import { useMemo, useState } from 'react'

const PAGE_SIZE = 5

export function useAnalyticsTable(rows) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState({ key: 'revenue', direction: 'desc' })

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    const base = query ? rows.filter((row) => row.name.toLowerCase().includes(query)) : rows
    return [...base].sort((a, b) => {
      const left = a[sort.key]
      const right = b[sort.key]
      const value = typeof left === 'string' ? left.localeCompare(right) : left - right
      return sort.direction === 'asc' ? value : -value
    })
  }, [rows, search, sort])

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pagedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function requestSort(key) {
    setPage(1)
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }))
  }

  function updateSearch(value) {
    setSearch(value)
    setPage(1)
  }

  return {
    search,
    setSearch: updateSearch,
    sort,
    requestSort,
    page: safePage,
    setPage,
    pageCount,
    rows: pagedRows,
    totalRows: filteredRows.length,
  }
}
