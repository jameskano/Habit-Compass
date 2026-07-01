import type { ISODateString } from '@/shared/types'

import type { Habit, HabitLog } from '../types'
import {
  evaluateHabitCompletionForLogs,
  getHabitLogProgressValue,
  hasHabitProgressOnDate,
  type WeekStartsOn,
} from './habitCompletionRules'
import { isHabitScheduledOnDate } from './habitSchedule'
import { filterEligibleHabitLogs, isHabitInactiveOnDate } from './habitInactivity'

export type HabitDayState =
  | 'completed_minimum'
  | 'completed_standard'
  | 'progress_logged'
  | 'today_pending'
  | 'missed'
  | 'skipped'
  | 'not_scheduled'
  | 'inactive'
  | 'future'

type DeriveHabitDayStateInput = {
  date: ISODateString
  today: ISODateString
  habit: Habit
  logs: HabitLog[]
  weekStartsOn?: WeekStartsOn
}

export const deriveHabitDayState = ({
  date,
  today,
  habit,
  logs,
  weekStartsOn = 1,
}: DeriveHabitDayStateInput): HabitDayState => {
  if (date > today) {
    return 'future'
  }

  if (isHabitInactiveOnDate(habit, date)) {
    return 'inactive'
  }

  const eligibleLogs = filterEligibleHabitLogs(habit, logs)
  const log = eligibleLogs.find((entry) => entry.loggedForDate === date)

  if (log?.status === 'skipped') {
    return 'skipped'
  }

  if (
    eligibleLogs.some(
      (entry) => entry.loggedForDate === date && getHabitLogProgressValue(habit, entry) > 0,
    )
  ) {
    const completion = evaluateHabitCompletionForLogs({
      habit,
      logs: eligibleLogs,
      date,
      weekStartsOn,
    })
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

  if (hasHabitProgressOnDate(habit, eligibleLogs, date)) {
    return 'progress_logged'
  }

  return date === today ? 'today_pending' : 'missed'
}
