const padDatePart = (value: number) => String(value).padStart(2, '0')

const formatDateParts = (year: number, month: number, day: number) =>
  `${padDatePart(day)}/${padDatePart(month)}/${String(year).padStart(4, '0')}`

const parseISODateParts = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    return null
  }

  const [, yearText, monthText, dayText] = match
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const candidate = new Date(Date.UTC(year, month - 1, day))

  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return null
  }

  return { year, month, day }
}

export const formatFullDate = (value: string | Date | null | undefined) => {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    const parts = parseISODateParts(value)
    return parts ? formatDateParts(parts.year, parts.month, parts.day) : ''
  }

  if (Number.isNaN(value.getTime())) {
    return ''
  }

  return formatDateParts(value.getFullYear(), value.getMonth() + 1, value.getDate())
}
