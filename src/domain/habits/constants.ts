export const habitPeriods = ['day', 'week', 'month', 'custom'] as const
export const habitTrackingTypes = [
  'binary',
  'timesPerPeriod',
  'repetitionsPerPeriod',
  'timePerSession',
  'totalTimePerPeriod',
  'quantityPerSession',
  'totalQuantityPerPeriod',
] as const
export const habitCompletionLevels = ['minimum', 'standard'] as const
export const habitResetModes = ['soft', 'hard'] as const
export const habitLogStatuses = ['completed', 'skipped'] as const
export const habitScheduleKinds = [
  'daily',
  'specificDaysOfWeek',
  'everyXDays',
  'everyXWeeks',
  'everyXMonths',
  'firstWeekdayOfMonth',
  'flexiblePeriod',
] as const
export const habitDayOfWeekValues = [0, 1, 2, 3, 4, 5, 6] as const
