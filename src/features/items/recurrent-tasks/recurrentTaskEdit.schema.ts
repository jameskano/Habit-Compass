import { z } from 'zod'

import { recurrenceKinds } from '@/domain/recurrent-tasks'
import { itemPriorities } from '@/shared/types'

import { isValidDaysOfMonthInput, isValidDaysOfYearInput } from '../components/scheduleInputParsers'

export const RecurrentTaskEditValuesSchema = z
  .object({
    title: z.string().trim().min(1),
    recurrenceKind: z.enum(recurrenceKinds),
    daysOfWeek: z.array(z.number().int().min(0).max(6)),
    daysOfMonth: z.string(),
    daysOfYear: z.string(),
    intervalDays: z.number().int().positive(),
    intervalWeeks: z.number().int().positive(),
    intervalMonths: z.number().int().positive(),
    dayOfMonth: z.number().int().min(1).max(31),
    weekday: z.number().int().min(0).max(6),
    customDescription: z.string(),
    categoryId: z.string(),
    priority: z.enum(itemPriorities),
    carryForward: z.boolean(),
    description: z.string(),
    notes: z.string(),
    startsOn: z.string().min(1),
    endsOn: z.string(),
  })
  .superRefine((values, context) => {
    if (values.endsOn && values.endsOn < values.startsOn) {
      context.addIssue({ code: 'custom', path: ['endsOn'], message: 'invalidEndDate' })
    }
    if (
      (values.recurrenceKind === 'specificDaysOfWeek' || values.recurrenceKind === 'everyXWeeks') &&
      values.daysOfWeek.length === 0
    ) {
      context.addIssue({ code: 'custom', path: ['daysOfWeek'], message: 'chooseDay' })
    }
    if (
      values.recurrenceKind === 'specificDaysOfMonth' &&
      !isValidDaysOfMonthInput(values.daysOfMonth)
    ) {
      context.addIssue({ code: 'custom', path: ['daysOfMonth'], message: 'chooseDay' })
    }
    if (
      values.recurrenceKind === 'specificDaysOfYear' &&
      !isValidDaysOfYearInput(values.daysOfYear)
    ) {
      context.addIssue({ code: 'custom', path: ['daysOfYear'], message: 'chooseDay' })
    }
    if (values.recurrenceKind === 'customFutureRule' && !values.customDescription.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['customDescription'],
        message: 'descriptionRequired',
      })
    }
  })

export type RecurrentTaskEditValues = z.infer<typeof RecurrentTaskEditValuesSchema>
