import type { CompletionSummary } from './types'

export function getCompletionRate(summary: CompletionSummary) {
  if (summary.total === 0) {
    return 0
  }

  return summary.completed / summary.total
}
