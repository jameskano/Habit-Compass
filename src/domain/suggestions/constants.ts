export const suggestionTypes = [
  'useMinimum',
  'reduceFrequency',
  'reduceVolume',
  'pauseHabit',
  'archiveHabit',
  'addSmallCategoryAction',
  'overloadedDay',
  'moodBasedAdjustment',
  'weeklyReview',
  'recoveryMode',
] as const
export const suggestionTriggers = [
  'mood',
  'repeatedHabitFailures',
  'repeatedCategoryNeglect',
  'overloadedDay',
  'lackOfAction',
  'simplePattern',
] as const
export const suggestionStatuses = ['pending', 'completed', 'skipped'] as const
