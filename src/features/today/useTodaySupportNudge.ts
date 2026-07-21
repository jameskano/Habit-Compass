import { useMemo, useState } from 'react'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import type { TodayItem } from '@/domain/today'
import type { ISODateString } from '@/shared/types'

import { getTodaySupportNudge } from './todaySupportNudge.utils'

type UseTodaySupportNudgeInput = {
  items: readonly TodayItem[]
  selectedDate: ISODateString
  today: ISODateString
}

export const useTodaySupportNudge = ({ items, selectedDate, today }: UseTodaySupportNudgeInput) => {
  const suggestionsEnabled = useAppPreferencesStore((state) => state.featureToggles.suggestions)
  const [dismissedNudgeKey, setDismissedNudgeKey] = useState<string | null>(null)

  const nudge = useMemo(
    () =>
      getTodaySupportNudge({
        dismissedNudgeKey,
        items,
        selectedDate,
        suggestionsEnabled,
        today,
      }),
    [dismissedNudgeKey, items, selectedDate, suggestionsEnabled, today],
  )

  if (!nudge) {
    return null
  }

  return {
    ...nudge,
    dismiss: () => setDismissedNudgeKey(nudge.key),
  }
}
