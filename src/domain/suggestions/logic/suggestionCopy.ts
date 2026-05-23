import type { SuggestionType } from '../types'

export type SuggestionCopyVariant = {
  title: string
  body: string
}

export const suggestionCopy: Record<SuggestionType, SuggestionCopyVariant[]> = {
  useMinimum: [
    {
      title: 'Use the minimum version',
      body: 'Keep the habit alive with the smallest version today.',
    },
    {
      title: 'Make it the easy version',
      body: 'A smaller version still counts as forward motion.',
    },
  ],
  reduceFrequency: [
    {
      title: 'Reduce the frequency',
      body: 'The current cadence may be too ambitious for right now.',
    },
  ],
  reduceVolume: [
    {
      title: 'Reduce the volume',
      body: 'A smaller target may be easier to sustain this week.',
    },
  ],
  pauseHabit: [
    {
      title: 'Pause the habit temporarily',
      body: 'A short pause may be better than forcing a failing plan.',
    },
  ],
  archiveHabit: [
    {
      title: 'Archive this habit',
      body: 'This habit may not fit your current season.',
    },
  ],
  addSmallCategoryAction: [
    {
      title: 'Add one small category action',
      body: 'A tiny action can reconnect you with this neglected area.',
    },
  ],
  overloadedDay: [
    {
      title: 'Use a lighter day',
      body: 'Today looks crowded. Aim for the smallest useful version.',
    },
  ],
  moodBasedAdjustment: [
    {
      title: 'Adjust for today’s mood',
      body: 'Choose the gentlest version that still keeps the habit alive.',
    },
  ],
  weeklyReview: [
    {
      title: 'Run a short weekly review',
      body: 'A small weekly check-in can help reset direction.',
    },
  ],
  recoveryMode: [
    {
      title: 'Switch into recovery mode',
      body: 'Restart with a smaller set of actions before scaling back up.',
    },
  ],
}

export function selectSuggestionCopy(
  type: SuggestionType,
  selector: (variants: SuggestionCopyVariant[]) => SuggestionCopyVariant = (variants) => variants[0],
) {
  return selector(suggestionCopy[type])
}
