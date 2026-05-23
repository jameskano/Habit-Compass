import { describe, expect, it } from 'vitest'

import { createCompletionLevelHabit, createHabit, createHabitLog } from '@/domain/habits/logic/habitFixtures'
import { evaluateHabitCompletion } from '@/domain/habits/logic/evaluateHabitCompletion'

describe('minimum standard deep harness', () => {
  it('returns no completion level when levels are disabled', () => {
    const habit = createHabit({ trackingType: 'binary' })
    const result = evaluateHabitCompletion({
      habit,
      logs: [createHabitLog()],
      periodStart: '2026-05-21',
      periodEnd: '2026-05-21',
    })

    expect(result.achievedLevel).toBeNull()
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
      { trackingType: 'totalTimePerPeriod', period: 'week', targetMinutes: 90 },
      ['minimum', 'standard', 'deep'],
    )
    const result = evaluateHabitCompletion({
      habit,
      logs: [createHabitLog({ durationMinutes: 35 })],
      periodStart: '2026-05-18',
      periodEnd: '2026-05-24',
    })

    expect(result.achievedLevel).toBe('minimum')
  })

  it('supports enabled levels for a quantity habit', () => {
    const habit = createCompletionLevelHabit(
      { trackingType: 'totalQuantityPerPeriod', period: 'month', targetQuantity: 10, unitLabel: 'glasses' },
      ['minimum', 'standard', 'deep'],
    )
    const result = evaluateHabitCompletion({
      habit,
      logs: [createHabitLog({ quantity: 10, quantityUnitLabel: 'glasses' })],
      periodStart: '2026-05-01',
      periodEnd: '2026-05-31',
    })

    expect(result.achievedLevel).toBe('deep')
  })

  it('suggests minimum after repeated failures when minimum is configured', () => {
    const habit = createCompletionLevelHabit({ trackingType: 'binary' }, ['minimum', 'standard'])
    const result = evaluateHabitCompletion({
      habit,
      logs: [createHabitLog({ status: 'missed' }), createHabitLog({ id: 'miss-2', status: 'missed' })],
      periodStart: '2026-05-20',
      periodEnd: '2026-05-21',
    })

    expect(result.suggestedLevel).toBe('minimum')
  })

  it('suggests deep only when configured and the context supports it', () => {
    const habit = createCompletionLevelHabit(
      { trackingType: 'totalTimePerPeriod', period: 'week', targetMinutes: 60 },
      ['minimum', 'standard', 'deep'],
    )
    const result = evaluateHabitCompletion({
      habit,
      logs: [createHabitLog({ durationMinutes: 60 })],
      periodStart: '2026-05-18',
      periodEnd: '2026-05-24',
    })

    expect(result.suggestedLevel).toBe('deep')
  })
})
