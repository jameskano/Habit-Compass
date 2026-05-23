import { describe, expect, it } from 'vitest'

import { createHabit, createHabitLog, habitSchedules } from '@/domain/habits/logic/habitFixtures'
import { evaluateHabitProgress } from '@/domain/habits/logic/evaluateHabitProgress'

describe('frequency goals harness', () => {
  it('covers a binary daily habit', () => {
    const habit = createHabit({ trackingType: 'binary' })
    const logs = [createHabitLog()]

    const result = evaluateHabitProgress({
      habit,
      logs,
      periodStart: '2026-05-21',
      periodEnd: '2026-05-21',
    })

    expect(result.isComplete).toBe(true)
    expect(result.actual).toBe(1)
  })

  it('covers X times per week and specific days of week', () => {
    const habit = createHabit({ trackingType: 'timesPerPeriod', period: 'week', targetCount: 3 })
    const logs = [
      createHabitLog({ loggedForDate: '2026-05-18' }),
      createHabitLog({ id: 'log-2', loggedForDate: '2026-05-20' }),
    ]

    const result = evaluateHabitProgress({
      habit,
      logs,
      periodStart: '2026-05-18',
      periodEnd: '2026-05-24',
      schedule: habitSchedules.mondayWednesdayFriday,
    })

    expect(result.actual).toBe(2)
    expect(result.target).toBe(3)
    expect(result.scheduledOccurrenceCount).toBe(3)
  })

  it('covers X times per month', () => {
    const habit = createHabit({ trackingType: 'timesPerPeriod', period: 'month', targetCount: 8 })
    const logs = Array.from({ length: 5 }, (_, index) =>
      createHabitLog({ id: `month-${index}`, loggedForDate: `2026-05-${String(index + 1).padStart(2, '0')}` }),
    )

    const result = evaluateHabitProgress({
      habit,
      logs,
      periodStart: '2026-05-01',
      periodEnd: '2026-05-31',
    })

    expect(result.actual).toBe(5)
    expect(result.isComplete).toBe(false)
  })

  it('covers repetitions per period', () => {
    const habit = createHabit({ trackingType: 'repetitionsPerPeriod', period: 'week', targetRepetitions: 30 })
    const logs = [
      createHabitLog({ repetitions: 10 }),
      createHabitLog({ id: 'rep-2', repetitions: 8 }),
    ]

    const result = evaluateHabitProgress({
      habit,
      logs,
      periodStart: '2026-05-18',
      periodEnd: '2026-05-24',
    })

    expect(result.actual).toBe(18)
    expect(result.unit).toBe('repetitions')
  })

  it('covers time per session', () => {
    const habit = createHabit({ trackingType: 'timePerSession', targetMinutes: 30 })
    const logs = [
      createHabitLog({ durationMinutes: 20 }),
      createHabitLog({ id: 'time-2', durationMinutes: 35 }),
    ]

    const result = evaluateHabitProgress({
      habit,
      logs,
      periodStart: '2026-05-18',
      periodEnd: '2026-05-24',
    })

    expect(result.actual).toBe(35)
    expect(result.isComplete).toBe(true)
  })

  it('covers total time per week', () => {
    const habit = createHabit({ trackingType: 'totalTimePerPeriod', period: 'week', targetMinutes: 120 })
    const logs = [
      createHabitLog({ durationMinutes: 45 }),
      createHabitLog({ id: 'ttw-2', durationMinutes: 60 }),
    ]

    const result = evaluateHabitProgress({
      habit,
      logs,
      periodStart: '2026-05-18',
      periodEnd: '2026-05-24',
    })

    expect(result.actual).toBe(105)
  })

  it('covers quantity per session', () => {
    const habit = createHabit({ trackingType: 'quantityPerSession', targetQuantity: 10, unitLabel: 'pages' })
    const logs = [
      createHabitLog({ quantity: 6, quantityUnitLabel: 'pages' }),
      createHabitLog({ id: 'qps-2', quantity: 11, quantityUnitLabel: 'pages' }),
    ]

    const result = evaluateHabitProgress({
      habit,
      logs,
      periodStart: '2026-05-18',
      periodEnd: '2026-05-24',
    })

    expect(result.actual).toBe(11)
    expect(result.isComplete).toBe(true)
  })

  it('covers total quantity per month', () => {
    const habit = createHabit({ trackingType: 'totalQuantityPerPeriod', period: 'month', targetQuantity: 100, unitLabel: 'ounces' })
    const logs = [
      createHabitLog({ quantity: 25, quantityUnitLabel: 'ounces' }),
      createHabitLog({ id: 'tqm-2', quantity: 40, quantityUnitLabel: 'ounces' }),
    ]

    const result = evaluateHabitProgress({
      habit,
      logs,
      periodStart: '2026-05-01',
      periodEnd: '2026-05-31',
    })

    expect(result.actual).toBe(65)
    expect(result.unit).toBe('quantity')
  })

  it('keeps a future placeholder for advanced recurrence', () => {
    const habit = createHabit({ trackingType: 'timesPerPeriod', period: 'week', targetCount: 3 })

    const result = evaluateHabitProgress({
      habit,
      logs: [],
      periodStart: '2026-05-18',
      periodEnd: '2026-05-24',
      schedule: habitSchedules.futurePlaceholder,
    })

    expect(result.recurrenceSupport).toBe('future-placeholder')
  })
})
