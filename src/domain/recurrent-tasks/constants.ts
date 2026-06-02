export const dayOfWeekValues = [0, 1, 2, 3, 4, 5, 6] as const
export const recurrenceKinds = [
  'daily',
  'specificDaysOfWeek',
  'specificDaysOfMonth',
  'specificDaysOfYear',
  'everyXDays',
  'everyXWeeks',
  'everyXMonths',
  'firstWeekdayOfMonth',
  'customFutureRule',
] as const
export const recurrentTaskOccurrenceStatuses = [
  'pending',
  'completed',
  'skipped',
  'missed',
] as const
