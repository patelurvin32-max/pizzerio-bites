const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export { WEEKDAYS }

export function buildMonthGrid(viewYear, viewMonth) {
  const cells = []
  const firstDay = new Date(viewYear, viewMonth, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate()

  for (let i = 0; i < startOffset; i++) {
    const day = daysInPrev - startOffset + i + 1
    const month = viewMonth === 0 ? 11 : viewMonth - 1
    const year = viewMonth === 0 ? viewYear - 1 : viewYear
    cells.push({ date: new Date(year, month, day), outside: true })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(viewYear, viewMonth, day), outside: false })
  }

  let nextDay = 1
  while (cells.length % 7 !== 0) {
    const month = viewMonth === 11 ? 0 : viewMonth + 1
    const year = viewMonth === 11 ? viewYear + 1 : viewYear
    cells.push({ date: new Date(year, month, nextDay), outside: true })
    nextDay += 1
  }

  return cells
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function monthStart(year, month) {
  return new Date(year, month, 1).getTime()
}
