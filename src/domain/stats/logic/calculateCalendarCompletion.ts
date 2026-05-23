export type CalendarCompletionState = 'none' | 'partial' | 'complete' | 'skipped' | 'missed'

export type CalendarCompletionInput = {
  hasCompleted: boolean
  hasSkipped: boolean
  hasMissed: boolean
  progressRatio: number
}

export function calculateCalendarCompletion({
  hasCompleted,
  hasSkipped,
  hasMissed,
  progressRatio,
}: CalendarCompletionInput): CalendarCompletionState {
  if (hasMissed) {
    return 'missed'
  }

  if (hasSkipped && !hasCompleted) {
    return 'skipped'
  }

  if (progressRatio >= 1) {
    return 'complete'
  }

  if (progressRatio > 0) {
    return 'partial'
  }

  return 'none'
}
