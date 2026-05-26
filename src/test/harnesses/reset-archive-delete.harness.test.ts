import { describe, expect, it } from 'vitest'

import { archiveHabit, hardResetHabitStats, resetHabitStats } from '@/domain/habits/logic/resetHabitStats'
import { createHabitLog, createResettableHabit } from '@/domain/habits/logic/habitFixtures'

describe('reset archive delete harness', () => {
  it('soft reset keeps history', () => {
    const habit = createResettableHabit()
    const logs = [createHabitLog()]

    const result = resetHabitStats(habit, logs, '2026-05-21T09:00:00.000Z')

    expect(result.historyPreserved).toBe(true)
    expect(result.logs).toHaveLength(1)
  })

  it('hard reset requires explicit confirmation', () => {
    const habit = createResettableHabit('hard')
    const logs = [createHabitLog()]

    expect(() => hardResetHabitStats(habit, logs, '2026-05-21T09:00:00.000Z', false)).toThrow(
      'Hard reset requires explicit confirmation.',
    )
  })

  it('archive preserves history', () => {
    const habit = createResettableHabit()
    const logs = [createHabitLog()]

    const result = archiveHabit(habit, logs, '2026-05-21T09:00:00.000Z')

    expect(result.habit.lifecycleStatus).toBe('archived')
    expect(result.logs).toHaveLength(1)
  })
})
