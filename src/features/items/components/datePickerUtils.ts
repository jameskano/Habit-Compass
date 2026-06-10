const isoDateToCalendarDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) {
    return undefined
  }
  return new Date(year, month - 1, day)
}

const calendarDateToISODate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export { calendarDateToISODate, isoDateToCalendarDate }
