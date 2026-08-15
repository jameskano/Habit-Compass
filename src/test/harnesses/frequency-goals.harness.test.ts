import { describe, expect, it } from 'vitest'

import { createHabit, createHabitLog } from '@/domain/habits/logic/habitFixtures'
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

  it('covers certain days per week', () => {
    const habit = createHabit(
      { trackingType: 'binary' },
      {
        scheduleRule: { kind: 'certainDaysPerPeriod', period: 'week', targetDays: 3 },
      },
    )
    const logs = [
      createHabitLog({ loggedForDate: '2026-05-18' }),
      createHabitLog({ id: 'log-2', loggedForDate: '2026-05-20' }),
    ]

    const result = evaluateHabitProgress({
      habit,
      logs,
      periodStart: '2026-05-18',
      periodEnd: '2026-05-24',
    })

    expect(result.actual).toBe(2)
    expect(result.target).toBe(3)
    expect(result.scheduledOccurrenceCount).toBeNull()
  })

  it('covers certain days per month', () => {
    const habit = createHabit(
      { trackingType: 'binary' },
      {
        scheduleRule: { kind: 'certainDaysPerPeriod', period: 'month', targetDays: 8 },
      },
    )
    const logs = Array.from({ length: 5 }, (_, index) =>
      createHabitLog({
        id: `month-${index}`,
        loggedForDate: `2026-05-${String(index + 1).padStart(2, '0')}`,
      }),
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

  it('covers custom measurable totals per period', () => {
    const habit = createHabit({
      trackingType: 'totalMeasurablePerPeriod',
      period: 'week',
      targetAmount: 30,
      unitLabel: 'repetitions',
    })
    const logs = [createHabitLog({ amount: 10 }), createHabitLog({ id: 'rep-2', amount: 8 })]

    const result = evaluateHabitProgress({
      habit,
      logs,
      periodStart: '2026-05-18',
      periodEnd: '2026-05-24',
    })

    expect(result.actual).toBe(18)
    expect(result.unit).toBe('custom')
  })

  it('covers measurable per session', () => {
    const habit = createHabit({
      trackingType: 'measurablePerSession',
      targetAmount: 30,
      unitLabel: 'minutes',
    })
    const logs = [createHabitLog({ amount: 20 }), createHabitLog({ id: 'time-2', amount: 35 })]

    const result = evaluateHabitProgress({
      habit,
      logs,
      periodStart: '2026-05-18',
      periodEnd: '2026-05-24',
    })

    expect(result.actual).toBe(35)
    expect(result.isComplete).toBe(true)
  })

  it('covers total measurable per week', () => {
    const habit = createHabit({
      trackingType: 'totalMeasurablePerPeriod',
      period: 'week',
      targetAmount: 120,
      unitLabel: 'minutes',
    })
    const logs = [createHabitLog({ amount: 45 }), createHabitLog({ id: 'ttw-2', amount: 60 })]

    const result = evaluateHabitProgress({
      habit,
      logs,
      periodStart: '2026-05-18',
      periodEnd: '2026-05-24',
    })

    expect(result.actual).toBe(105)
  })

  it('covers custom units per session', () => {
    const habit = createHabit({
      trackingType: 'measurablePerSession',
      targetAmount: 10,
      unitLabel: 'pages',
    })
    const logs = [createHabitLog({ amount: 6 }), createHabitLog({ id: 'qps-2', amount: 11 })]

    const result = evaluateHabitProgress({
      habit,
      logs,
      periodStart: '2026-05-18',
      periodEnd: '2026-05-24',
    })

    expect(result.actual).toBe(11)
    expect(result.isComplete).toBe(true)
  })

  it('covers total custom units per month', () => {
    const habit = createHabit({
      trackingType: 'totalMeasurablePerPeriod',
      period: 'month',
      targetAmount: 100,
      unitLabel: 'ounces',
    })
    const logs = [createHabitLog({ amount: 25 }), createHabitLog({ id: 'tqm-2', amount: 40 })]

    const result = evaluateHabitProgress({
      habit,
      logs,
      periodStart: '2026-05-01',
      periodEnd: '2026-05-31',
    })

    expect(result.actual).toBe(65)
    expect(result.unit).toBe('custom')
  })

  it('keeps certain-days frequencies out of explicit occurrence counting', () => {
    const habit = createHabit(
      { trackingType: 'binary' },
      {
        scheduleRule: { kind: 'certainDaysPerPeriod', period: 'week', targetDays: 3 },
      },
    )

    const result = evaluateHabitProgress({
      habit,
      logs: [],
      periodStart: '2026-05-18',
      periodEnd: '2026-05-24',
    })

    expect(result.scheduledOccurrenceCount).toBeNull()
  })
})
