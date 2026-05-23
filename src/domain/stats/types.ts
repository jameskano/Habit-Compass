import type { statContexts, statWindows } from './constants'

export type StatWindow = (typeof statWindows)[number]
export type StatContext = (typeof statContexts)[number]

export type CompletionSummary = {
  completed: number
  total: number
  window: StatWindow
}

export type ContextualStat = {
  key: string
  context: StatContext
  window: StatWindow
  labelMessageId: string
  value: number
}
