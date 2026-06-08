import { z } from 'zod'

export type ISODateString = string
export type ISODateTimeString = string
export type MonthDay = {
  month: number
  day: number
}

// Domain models use simple string aliases so storage and transport stay decoupled from UI date objects.
export const IsoDateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
export const IsoDateTimeStringSchema = z.string().datetime({ offset: true })
export const MonthDaySchema = z
  .object({
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
  })
  .refine(({ month, day }) => {
    const date = new Date(Date.UTC(2024, month - 1, day))
    return date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  }, 'Invalid month/day pair.')
