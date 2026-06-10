import type { MonthDay } from '@/shared/types'

const entries = (value: string) => {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

const isValidMonthDay = ({ month, day }: MonthDay) => {
  const date = new Date(Date.UTC(2024, month - 1, day))
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export const parseDaysOfMonthInput = (value: string) => {
  return [
    ...new Set(
      entries(value)
        .map(Number)
        .filter((day) => Number.isInteger(day) && day >= 1 && day <= 31),
    ),
  ]
}

export const isValidDaysOfMonthInput = (value: string) => {
  const values = entries(value)
  return (
    values.length > 0 &&
    values.every((entry) => /^\d{1,2}$/.test(entry) && parseDaysOfMonthInput(entry).length === 1)
  )
}

export const parseDaysOfYearInput = (value: string): MonthDay[] => {
  const uniqueDays = new Map<string, MonthDay>()

  for (const entry of entries(value)) {
    const match = entry.match(/^(\d{1,2})-(\d{1,2})$/)
    if (!match) {
      continue
    }

    const monthDay = { month: Number(match[1]), day: Number(match[2]) }
    if (isValidMonthDay(monthDay)) {
      uniqueDays.set(`${monthDay.month}-${monthDay.day}`, monthDay)
    }
  }

  return [...uniqueDays.values()]
}

export const isValidDaysOfYearInput = (value: string) => {
  const values = entries(value)
  return values.length > 0 && values.every((entry) => parseDaysOfYearInput(entry).length === 1)
}
