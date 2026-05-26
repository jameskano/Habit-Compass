import type { ISODateString } from '@/shared/types'

import type { Habit, HabitLog } from '../types'
import { isHabitScheduledOnDate } from './habitSchedule'

export type HabitDayState =
  | 'completed_minimum'
  | 'completed_standard'
  | 'today_pending'
  | 'missed'
  | 'skipped'
  | 'not_scheduled'
  | 'future'

type DeriveHabitDayStateInput = {
  date: ISODateString
  today: ISODateString
  habit: Habit
  logs: HabitLog[]
}

export function deriveHabitDayState({
  date,
  today,
  habit,
  logs,
}: DeriveHabitDayStateInput): HabitDayState {
  if (date > today) {
    return 'future'
  }

  if (!isHabitScheduledOnDate(habit, date)) {
    return 'not_scheduled'
  }

  const log = logs.find((entry) => entry.loggedForDate === date)

  if (log?.status === 'completed') {
    return log.completionLevel === 'minimum' ? 'completed_minimum' : 'completed_standard'
  }

  if (log?.status === 'skipped') {
    return 'skipped'
  }

  return date === today ? 'today_pending' : 'missed'
}
