import { formatISO, parseISO } from 'date-fns'

import {
  evaluateHabitCompletionForLogs,
  getHabitAmountInputMetadata,
  getHabitFrequencySummary,
  getHabitMinimumTargetValue,
  type Habit,
  type HabitDayOfWeek,
  type HabitLog,
  type WeekStartsOn,
} from '@/domain/habits'
import { getTodayDateMode, type TodayDateMode, type TodayItem } from '@/domain/today'
import {
  getRecurrentFrequencySummary,
  type DayOfWeek,
  type RecurrentTask,
} from '@/domain/recurrent-tasks'
import type { Task } from '@/domain/tasks'
import {
  calendarDateToISODate,
  isoDateToCalendarDate,
} from '@/features/items/components/datePickerUtils'
import type { ISODateString } from '@/shared/types'

import type { TodayIntl } from './today.types'

export const todayAsISODate = () => {
  return formatISO(new Date(), { representation: 'date' }) as ISODateString
}

export const shiftISODate = (date: ISODateString, amount: number) => {
  const current = isoDateToCalendarDate(date)
  if (!current) {
    return date
  }
  current.setDate(current.getDate() + amount)
  return calendarDateToISODate(current) as ISODateString
}

export const canModifyTodayDate = (dateMode: TodayDateMode) => {
  return dateMode === 'today' || dateMode === 'past'
}

export const getTodayEmptyStateMessageIds = (input: {
  searchText: string
  selectedDate: ISODateString
  today: ISODateString
}) => {
  if (input.searchText.trim().length > 0) {
    return {
      titleId: 'page.today.empty.search.title',
      descriptionId: 'page.today.empty.search.description',
    }
  }

  if (input.selectedDate === input.today) {
    return {
      titleId: 'page.today.empty.today.title',
      descriptionId: 'page.today.empty.today.description',
    }
  }

  return {
    titleId: 'page.today.empty.date.title',
    descriptionId: 'page.today.empty.date.description',
  }
}

export const buildVisibleTodayOrder = (
  orderedItems: readonly { id: string }[],
  visibleOrderedIds: readonly string[],
) => {
  const visibleIds = new Set(visibleOrderedIds)
  let visibleIndex = 0
  return orderedItems.map((item) =>
    visibleIds.has(item.id) ? visibleOrderedIds[visibleIndex++] : item.id,
  )
}

const formatWeekdays = (
  intl: TodayIntl,
  days: readonly HabitDayOfWeek[] | readonly DayOfWeek[],
) => {
  return intl.formatList(
    days.map((day) => intl.formatMessage({ id: `page.items.weekday.short.${day}` })),
  )
}

export const formatHabitFrequency = (intl: TodayIntl, habit: Habit) => {
  const descriptor = getHabitFrequencySummary(habit.scheduleRule)

  if (
    habit.scheduleRule.kind === 'flexiblePeriod' &&
    habit.goalConfig.trackingType === 'timesPerPeriod'
  ) {
    return intl.formatMessage(
      { id: 'items.frequency.timesPerPeriod' },
      {
        count: habit.goalConfig.targetCount,
        period: intl.formatMessage({ id: `items.period.${habit.goalConfig.period}` }),
      },
    )
  }

  if (habit.scheduleRule.kind === 'specificDaysOfWeek') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      { days: formatWeekdays(intl, habit.scheduleRule.daysOfWeek) },
    )
  }

  if (habit.scheduleRule.kind === 'everyXWeeks') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      {
        count: habit.scheduleRule.intervalWeeks,
        days: formatWeekdays(intl, habit.scheduleRule.daysOfWeek),
      },
    )
  }

  if (habit.scheduleRule.kind === 'firstWeekdayOfMonth') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      {
        weekday: intl.formatMessage({
          id: `page.items.weekday.long.${habit.scheduleRule.weekday}`,
        }),
      },
    )
  }

  return intl.formatMessage({ id: descriptor.messageId }, descriptor.values)
}

export const formatRecurrentFrequency = (intl: TodayIntl, task: RecurrentTask) => {
  const descriptor = getRecurrentFrequencySummary(task.recurrenceRule)
  const rule = task.recurrenceRule

  if (rule.kind === 'specificDaysOfWeek') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      { days: formatWeekdays(intl, rule.daysOfWeek) },
    )
  }
  if (rule.kind === 'everyXWeeks') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      { count: rule.intervalWeeks, days: formatWeekdays(intl, rule.daysOfWeek) },
    )
  }
  if (rule.kind === 'firstWeekdayOfMonth') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      { weekday: intl.formatMessage({ id: `page.items.weekday.long.${rule.weekday}` }) },
    )
  }

  return intl.formatMessage({ id: descriptor.messageId }, descriptor.values)
}

export const formatTaskMeta = (intl: TodayIntl, task: Task, selectedDate: ISODateString) => {
  if (task.dueDate && task.dueDate < selectedDate && task.completionStatus === 'pending') {
    const formattedDate = intl.formatDate(parseISO(task.dueDate), {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
    return intl.formatMessage({ id: 'page.today.item.task.overdue' }, { date: formattedDate })
  }

  return intl.formatMessage({ id: 'page.today.item.task.today' })
}

export const shortUnitLabel = (intl: TodayIntl, habit: Habit) => {
  const metadata = getHabitAmountInputMetadata(habit)
  if (!metadata) {
    return ''
  }
  if (metadata.unit === 'minutes') {
    return intl.formatMessage({ id: 'page.today.amount.unit.minutes.short' })
  }
  if (metadata.unit === 'repetitions') {
    return intl.formatMessage({ id: 'page.today.amount.unit.repetitions.short' })
  }
  return metadata.quantityUnitLabel ?? ''
}

export const amountText = (intl: TodayIntl, item: TodayItem) => {
  if (item.type !== 'habit' || !item.amount || item.amount <= 0) {
    return null
  }
  const unit = shortUnitLabel(intl, item.habit)
  return unit ? `${item.amount} ${unit}` : `${item.amount}`
}

export const amountHelperLines = (
  intl: TodayIntl,
  habit: Habit,
  logs: HabitLog[],
  selectedDate: ISODateString,
  weekStartsOn: WeekStartsOn = 1,
) => {
  const completion = evaluateHabitCompletionForLogs({
    habit,
    logs,
    date: selectedDate,
    weekStartsOn,
  })
  const labelId =
    'period' in habit.goalConfig && habit.goalConfig.period !== 'day'
      ? `page.today.amount.period.${habit.goalConfig.period}`
      : 'page.today.amount.period.day'
  const unit = shortUnitLabel(intl, habit)
  const value = unit
    ? `${completion.rawProgressValue} / ${completion.standardTargetValue} ${unit}`
    : `${completion.rawProgressValue} / ${completion.standardTargetValue}`
  const lines = [
    intl.formatMessage(
      { id: 'page.today.amount.progress' },
      {
        period: intl.formatMessage({ id: labelId }),
        value,
      },
    ),
  ]
  const minimum = getHabitMinimumTargetValue(habit)
  if (minimum !== null) {
    lines.push(
      intl.formatMessage(
        { id: 'page.today.amount.minimum' },
        { value: unit ? `${minimum} ${unit}` : `${minimum}` },
      ),
    )
  }
  return lines
}

export const selectedDateLabel = (intl: TodayIntl, date: ISODateString) => {
  return intl.formatDate(parseISO(date), {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export const getTodayDateModeForDates = (selectedDate: ISODateString, today: ISODateString) => {
  return getTodayDateMode(selectedDate, today)
}
