import type { ISODateString } from '@/shared/types'

import type { DayOfWeek, RecurrentTask, RecurrentTaskOccurrence, RecurrentTaskOccurrenceStatus } from '../types'

export type DerivedRecurrentOccurrence = {
  scheduledForDate: ISODateString
  status: RecurrentTaskOccurrenceStatus
  isOverdue: boolean
  isStored: boolean
  actionable: boolean
  storedOccurrence?: RecurrentTaskOccurrence
}

function toUtcDate(date: ISODateString) {
  return new Date(`${date}T00:00:00.000Z`)
}

function differenceInDays(date: ISODateString, anchor: ISODateString) {
  return Math.floor((toUtcDate(date).getTime() - toUtcDate(anchor).getTime()) / 86_400_000)
}

function differenceInMonths(date: ISODateString, anchor: ISODateString) {
  const current = toUtcDate(date)
  const start = toUtcDate(anchor)
  return (current.getUTCFullYear() - start.getUTCFullYear()) * 12 + current.getUTCMonth() - start.getUTCMonth()
}

export function isRecurrentTaskScheduledOnDate(task: RecurrentTask, date: ISODateString) {
  if (
    task.lifecycleStatus !== 'active' ||
    date < task.startsOn ||
    (task.endsOn && date > task.endsOn)
  ) {
    return false
  }

  const elapsedDays = differenceInDays(date, task.startsOn)
  const weekday = toUtcDate(date).getUTCDay() as DayOfWeek

  switch (task.recurrenceRule.kind) {
    case 'daily':
      return true
    case 'specificDaysOfWeek':
      return task.recurrenceRule.daysOfWeek.includes(weekday)
    case 'everyXDays':
      return elapsedDays % task.recurrenceRule.intervalDays === 0
    case 'everyXWeeks':
      return (
        Math.floor(elapsedDays / 7) % task.recurrenceRule.intervalWeeks === 0 &&
        task.recurrenceRule.daysOfWeek.includes(weekday)
      )
    case 'everyXMonths': {
      const elapsedMonths = differenceInMonths(date, task.startsOn)
      return (
        elapsedMonths >= 0 &&
        elapsedMonths % task.recurrenceRule.intervalMonths === 0 &&
        toUtcDate(date).getUTCDate() === task.recurrenceRule.dayOfMonth
      )
    }
    case 'firstWeekdayOfMonth':
      return weekday === task.recurrenceRule.weekday && toUtcDate(date).getUTCDate() <= 7
    case 'customFutureRule':
      return false
  }
}

export function enumerateRecurrentTaskDates(task: RecurrentTask, from: ISODateString, to: ISODateString) {
  const dates: ISODateString[] = []
  const current = toUtcDate(from)
  const end = toUtcDate(to)

  while (current <= end) {
    const date = current.toISOString().slice(0, 10) as ISODateString
    if (isRecurrentTaskScheduledOnDate(task, date)) {
      dates.push(date)
    }
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return dates
}

export function deriveRecurrentOccurrences(input: {
  task: RecurrentTask
  storedOccurrences: RecurrentTaskOccurrence[]
  from: ISODateString
  to: ISODateString
  today: ISODateString
}) {
  return enumerateRecurrentTaskDates(input.task, input.from, input.to).map((scheduledForDate) => {
    const storedOccurrence = input.storedOccurrences.find(
      (occurrence) => occurrence.scheduledForDate === scheduledForDate,
    )
    const overdue = scheduledForDate < input.today
    const status =
      storedOccurrence?.status ??
      (overdue && !input.task.carryForward ? 'missed' : 'pending')

    return {
      scheduledForDate,
      status,
      isOverdue: overdue && status === 'pending',
      isStored: Boolean(storedOccurrence),
      actionable: scheduledForDate <= input.today && status === 'pending',
      ...(storedOccurrence ? { storedOccurrence } : {}),
    } satisfies DerivedRecurrentOccurrence
  })
}
