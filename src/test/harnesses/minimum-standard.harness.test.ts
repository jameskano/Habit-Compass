import { describe, expect, it } from 'vitest'

import {
  createCompletionLevelHabit,
  createHabit,
  createHabitLog,
} from '@/domain/habits/logic/habitFixtures'
import { evaluateHabitCompletion } from '@/domain/habits/logic/evaluateHabitCompletion'

describe('minimum standard harness', () => {
  it('uses standard completion when minimum is not configured', () => {
    const habit = createHabit({ trackingType: 'binary' })
    const result = evaluateHabitCompletion({
      habit,
      logs: [createHabitLog()],
      periodStart: '2026-05-21',
      periodEnd: '2026-05-21',
    })

    expect(result.achievedLevel).toBe('standard')
    expect(result.suggestedLevel).toBeNull()
  })

  it('supports enabled levels for a binary habit', () => {
    const habit = createCompletionLevelHabit({ trackingType: 'binary' }, ['minimum', 'standard'])
    const result = evaluateHabitCompletion({
      habit,
      logs: [createHabitLog()],
      periodStart: '2026-05-21',
      periodEnd: '2026-05-21',
    })

    expect(result.achievedLevel).toBe('standard')
  })

  it('supports enabled levels for a time habit', () => {
    const habit = createCompletionLevelHabit(
      {
        trackingType: 'totalMeasurablePerPeriod',
        period: 'week',
        targetAmount: 90,
        minimumAmount: 30,
        unitLabel: 'minutes',
      },
      ['minimum', 'standard'],
    )
    const result = evaluateHabitCompletion({
      habit,
      logs: [createHabitLog({ amount: 35 })],
      periodStart: '2026-05-18',
      periodEnd: '2026-05-24',
    })

    expect(result.achievedLevel).toBe('minimum')
  })

  it('supports enabled levels for a quantity habit', () => {
    const habit = createCompletionLevelHabit(
      {
        trackingType: 'totalMeasurablePerPeriod',
        period: 'month',
        targetAmount: 10,
        unitLabel: 'glasses',
      },
      ['minimum', 'standard'],
    )
    const result = evaluateHabitCompletion({
      habit,
      logs: [createHabitLog({ amount: 10, unitLabel: 'glasses' })],
      periodStart: '2026-05-01',
      periodEnd: '2026-05-31',
    })

    expect(result.achievedLevel).toBe('standard')
  })

  it('derives a missed scheduled day without a stored missed log', () => {
    const habit = createCompletionLevelHabit({ trackingType: 'binary' }, ['minimum', 'standard'])
    const result = evaluateHabitCompletion({
      habit,
      logs: [],
      periodStart: '2026-05-21',
      periodEnd: '2026-05-21',
      today: '2026-05-22',
    })

    expect(result.outcome).toBe('missed')
  })
})
