import { describe, expect, it } from 'vitest'

import { createHabit, createHabitLog } from '@/domain/habits/logic/habitFixtures'
import { evaluateHabitCompletion } from '@/domain/habits/logic/evaluateHabitCompletion'

describe('habit completion harness', () => {
  it('evaluates completed outcome', () => {
    const habit = createHabit({ trackingType: 'binary' })
    const result = evaluateHabitCompletion({
      habit,
      logs: [createHabitLog()],
      periodStart: '2026-05-21',
      periodEnd: '2026-05-21',
    })

    expect(result.outcome).toBe('completed')
  })

  it('evaluates missed outcome', () => {
    const habit = createHabit({ trackingType: 'binary' })
    const result = evaluateHabitCompletion({
      habit,
      logs: [],
      periodStart: '2026-05-21',
      periodEnd: '2026-05-21',
      today: '2026-05-22',
    })

    expect(result.outcome).toBe('missed')
  })

  it('evaluates skipped outcome', () => {
    const habit = createHabit({ trackingType: 'binary' })
    const result = evaluateHabitCompletion({
      habit,
      logs: [createHabitLog({ status: 'skipped' })],
      periodStart: '2026-05-21',
      periodEnd: '2026-05-21',
    })

    expect(result.outcome).toBe('skipped')
  })

  it('evaluates partial progress below target', () => {
    const habit = createHabit({
      trackingType: 'totalMeasurablePerPeriod',
      period: 'week',
      targetAmount: 120,
      unitLabel: 'minutes',
    })
    const result = evaluateHabitCompletion({
      habit,
      logs: [createHabitLog({ amount: 40 })],
      periodStart: '2026-05-18',
      periodEnd: '2026-05-24',
    })

    expect(result.outcome).toBe('partial')
    expect(result.progress.isComplete).toBe(false)
  })
})
