import { z } from 'zod'

export type ISODateString = string
export type ISODateTimeString = string

// Domain models use simple string aliases so storage and transport stay decoupled from UI date objects.
export const IsoDateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
export const IsoDateTimeStringSchema = z.string().datetime({ offset: true })
