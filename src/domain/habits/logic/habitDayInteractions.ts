import type { ISODateString } from '@/shared/types'

import type { Habit, HabitLog } from '../types'
import { getCertainDaysPeriodState } from './habitCertainDays'
import type { WeekStartsOn } from './habitCompletionRules'
import { isHabitInactiveOnDate } from './habitInactivity'
import { isHabitScheduledOnDate } from './habitSchedule'

export type HabitAmountInputMetadata = {
  unitLabel: string
}

const isWithinHabitDateWindow = (habit: Habit, date: ISODateString) => {
  return date >= habit.startsOn && (!habit.endsOn || date <= habit.endsOn)
}

export const isHabitDayActionable = (input: {
  habit: Habit
  logs?: HabitLog[]
  date: ISODateString
  today: ISODateString
  weekStartsOn?: WeekStartsOn
}) => {
  const { habit, date, today, logs = [], weekStartsOn = 1 } = input

  if (
    habit.lifecycleStatus !== 'active' ||
    date > today ||
    !isWithinHabitDateWindow(habit, date) ||
    isHabitInactiveOnDate(habit, date)
  ) {
    return false
  }

  if (habit.scheduleRule.kind === 'certainDaysPerPeriod') {
    const existingLog = logs.some(
      (log) => log.habitId === habit.id && log.loggedForDate === date,
    )
    const period = getCertainDaysPeriodState({ habit, logs, date, weekStartsOn })
    return existingLog || !period?.isTargetReached
  }

  return habit.scheduleRule.kind === 'flexiblePeriod' || isHabitScheduledOnDate(habit, date)
}

export const getHabitAmountInputMetadata = (habit: Habit): HabitAmountInputMetadata | null => {
  switch (habit.goalConfig.trackingType) {
    case 'measurablePerSession':
    case 'totalMeasurablePerPeriod':
      return { unitLabel: habit.goalConfig.unitLabel }
    case 'binary':
      return null
  }
}

export const getHabitLogAmount = (habit: Habit, log?: HabitLog | null) => {
  if (!log || log.status !== 'completed') {
    return null
  }

  switch (habit.goalConfig.trackingType) {
    case 'measurablePerSession':
    case 'totalMeasurablePerPeriod':
      return log.amount ?? null
    case 'binary':
      return null
  }
}
