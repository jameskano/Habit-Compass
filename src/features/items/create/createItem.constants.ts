import type { FrequencyKind } from './createItem.types'

export const CREATE_ITEM_INPUT_CLASS = 'mt-1.5 rounded-xl border-border/75'

export const WEEKDAY_VALUES = [0, 1, 2, 3, 4, 5, 6] as const

export const FREQUENCY_KINDS: FrequencyKind[] = [
  'daily',
  'timesPerPeriod',
  'specificDaysOfWeek',
  'specificDaysOfMonth',
  'specificDaysOfYear',
  'everyXDays',
  'everyXWeeks',
  'everyXMonths',
  'firstWeekdayOfMonth',
]

export const RECURRENT_FREQUENCY_KINDS = FREQUENCY_KINDS.filter((kind) => kind !== 'timesPerPeriod')
