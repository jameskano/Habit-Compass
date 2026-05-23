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
export const habitCompletionLevels = ['minimum', 'standard', 'deep'] as const
export const habitResetModes = ['soft', 'hard'] as const
export const habitLogStatuses = ['completed', 'skipped', 'missed'] as const
