import type { ISODateString } from '@/shared/types'

import type { Habit, HabitLog } from '../types'
import {
  evaluateHabitCompletionForLogs,
  getHabitLogProgressValue,
  hasHabitProgressOnDate,
} from './habitCompletionRules'
import { isHabitScheduledOnDate } from './habitSchedule'

export type HabitDayState =
  | 'completed_minimum'
  | 'completed_standard'
  | 'progress_logged'
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

  const log = logs.find((entry) => entry.loggedForDate === date)

  if (log?.status === 'skipped') {
    return 'skipped'
  }

  if (logs.some((entry) => entry.loggedForDate === date && getHabitLogProgressValue(habit, entry) > 0)) {
    const completion = evaluateHabitCompletionForLogs({ habit, logs, date })
    if (completion.derivedCompletionLevel === 'standard') {
      return 'completed_standard'
    }
    if (completion.derivedCompletionLevel === 'minimum') {
      return 'completed_minimum'
    }
    return 'progress_logged'
  }

  if (!isHabitScheduledOnDate(habit, date)) {
    return 'not_scheduled'
  }

  if (hasHabitProgressOnDate(habit, logs, date)) {
    return 'progress_logged'
  }

  return date === today ? 'today_pending' : 'missed'
}
