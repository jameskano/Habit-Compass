import { describe, expect, it } from 'vitest'

import { createSuggestionHabit } from '@/domain/suggestions/logic/suggestionFixtures'
import type { TodayItem } from '@/domain/today'

import { getTodaySupportNudge } from './todaySupportNudge.utils'

const today = '2026-07-21'

const createHabitItem = (): TodayItem =>
  ({
    id: 'habit:habit-minimum',
    type: 'habit',
    habit: createSuggestionHabit({ id: 'habit-minimum' }),
    log: null,
  }) as TodayItem

const createTaskItem = (id: string): TodayItem =>
  ({
    id: `task:${id}`,
    type: 'task',
  }) as TodayItem

const createOverloadedItems = () => [
  createHabitItem(),
  createTaskItem('one'),
  createTaskItem('two'),
  createTaskItem('three'),
  createTaskItem('four'),
  createTaskItem('five'),
]

describe('getTodaySupportNudge', () => {
  it('returns one minimum-version nudge when Today is overloaded and suggestions are enabled', () => {
    const nudge = getTodaySupportNudge({
      items: createOverloadedItems(),
      selectedDate: today,
      suggestionsEnabled: true,
      today,
    })

    expect(nudge).toMatchObject({
      actionId: 'page.today.suggestion.action',
      descriptionId: 'page.today.suggestion.description',
      targetHabitId: 'habit-minimum',
      titleId: 'page.today.suggestion.title',
    })
  })

  it('does not return a nudge when suggestions are disabled', () => {
    expect(
      getTodaySupportNudge({
        items: createOverloadedItems(),
        selectedDate: today,
        suggestionsEnabled: false,
        today,
      }),
    ).toBeNull()
  })

  it('does not return a nudge for past or future dates', () => {
    expect(
      getTodaySupportNudge({
        items: createOverloadedItems(),
        selectedDate: '2026-07-20',
        suggestionsEnabled: true,
        today,
      }),
    ).toBeNull()
  })

  it('does not return a nudge until an explainable overload rule is met', () => {
    expect(
      getTodaySupportNudge({
        items: createOverloadedItems().slice(0, 5),
        selectedDate: today,
        suggestionsEnabled: true,
        today,
      }),
    ).toBeNull()
  })

  it('does not return a dismissed nudge for the same date and target', () => {
    const nudge = getTodaySupportNudge({
      items: createOverloadedItems(),
      selectedDate: today,
      suggestionsEnabled: true,
      today,
    })

    expect(
      getTodaySupportNudge({
        dismissedNudgeKey: nudge?.key,
        items: createOverloadedItems(),
        selectedDate: today,
        suggestionsEnabled: true,
        today,
      }),
    ).toBeNull()
  })
})
