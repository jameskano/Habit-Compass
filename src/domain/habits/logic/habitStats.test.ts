import { describe, expect, it } from 'vitest'

import { createCompletionLevelHabit, createHabit, createHabitLog } from './habitFixtures'
import { calculateHabitStats } from './habitStats'

describe('calculateHabitStats', () => {
  it('scores explicit schedules, includes skipped days in percentage, and calculates streaks', () => {
    const habit = createCompletionLevelHabit({ trackingType: 'binary' }, ['minimum', 'standard'], {
      startsOn: '2026-05-18',
      scheduleRule: { kind: 'daily' },
    })
    const result = calculateHabitStats({
      habit,
      logs: [
        createHabitLog({ id: 'one', loggedForDate: '2026-05-18', completionLevel: 'standard' }),
        createHabitLog({ id: 'two', loggedForDate: '2026-05-19', status: 'skipped' }),
        createHabitLog({ id: 'three', loggedForDate: '2026-05-20', completionLevel: 'minimum' }),
        createHabitLog({ id: 'outside', loggedForDate: '2026-05-17' }),
      ],
      from: '2026-05-18',
      to: '2026-05-21',
      today: '2026-05-21',
    })

    expect(result.completionEvents).toBe(2)
    expect(result.completionScore).toBe(1.5)
    expect(result.expectedScore).toBe(3)
    expect(result.completionPercentage).toBe(67)
    expect(result.currentStreak).toBe(2)
    expect(result.bestStreak).toBe(2)
  })

  it('treats all minimum completions as 100 percent complete', () => {
    const habit = createCompletionLevelHabit({ trackingType: 'binary' }, ['minimum', 'standard'], {
      startsOn: '2026-05-18',
      scheduleRule: { kind: 'daily' },
    })
    const result = calculateHabitStats({
      habit,
      logs: [
        createHabitLog({ id: 'one', loggedForDate: '2026-05-18', completionLevel: 'minimum' }),
        createHabitLog({ id: 'two', loggedForDate: '2026-05-19', completionLevel: 'minimum' }),
        createHabitLog({ id: 'three', loggedForDate: '2026-05-20', completionLevel: 'minimum' }),
      ],
      from: '2026-05-18',
      to: '2026-05-20',
      today: '2026-05-20',
    })

    expect(result.completionScore).toBe(1.5)
    expect(result.completionEvents).toBe(3)
    expect(result.expectedScore).toBe(3)
    expect(result.completionPercentage).toBe(100)
  })

  it('keeps skipped scheduled days in the completion-percentage denominator', () => {
    const habit = createHabit(
      { trackingType: 'binary' },
      { startsOn: '2026-05-18', scheduleRule: { kind: 'daily' } },
    )
    const result = calculateHabitStats({
      habit,
      logs: [
        createHabitLog({ id: 'completed', loggedForDate: '2026-05-18' }),
        ...(
          [
            '2026-05-19',
            '2026-05-20',
            '2026-05-21',
            '2026-05-22',
            '2026-05-23',
            '2026-05-24',
          ] as const
        ).map((date, index) =>
          createHabitLog({
            id: `skipped-${index}`,
            loggedForDate: date,
            status: 'skipped',
          }),
        ),
      ],
      from: '2026-05-18',
      to: '2026-05-24',
      today: '2026-05-24',
    })

    expect(result.completionEvents).toBe(1)
    expect(result.expectedScore).toBe(7)
    expect(result.completionPercentage).toBe(14)
    expect(result.currentStreak).toBe(1)
  })

  it('reports proportional certain-days progress and completed-day streaks', () => {
    const result = calculateHabitStats({
      habit: createCompletionLevelHabit(
        { trackingType: 'binary', minimumDescription: 'Minimum' },
        ['minimum', 'standard'],
        {
          startsOn: '2026-05-18',
          scheduleRule: { kind: 'certainDaysPerPeriod', period: 'week', targetDays: 3 },
        },
      ),
      logs: [
        createHabitLog({ id: 'one', loggedForDate: '2026-05-18' }),
        createHabitLog({ id: 'two', loggedForDate: '2026-05-20', completionLevel: 'minimum' }),
      ],
      from: '2026-05-18',
      to: '2026-05-24',
      today: '2026-05-21',
    })

    expect(result.completionScore).toBe(1.5)
    expect(result.completionPercentage).toBe(67)
    expect(result.currentStreak).toBe(2)
  })

  it('does not score below-minimum session progress as valid completion', () => {
    const habit = createCompletionLevelHabit(
      {
        trackingType: 'measurablePerSession',
        targetAmount: 30,
        minimumAmount: 10,
        unitLabel: 'minutes',
      },
      ['minimum', 'standard'],
      { startsOn: '2026-05-18', scheduleRule: { kind: 'daily' } },
    )

    const result = calculateHabitStats({
      habit,
      logs: [
        createHabitLog({ id: 'below', loggedForDate: '2026-05-18', amount: 5 }),
        createHabitLog({ id: 'minimum', loggedForDate: '2026-05-19', amount: 10 }),
        createHabitLog({ id: 'standard', loggedForDate: '2026-05-20', amount: 30 }),
        createHabitLog({ id: 'skipped', loggedForDate: '2026-05-21', status: 'skipped' }),
      ],
      from: '2026-05-18',
      to: '2026-05-22',
      today: '2026-05-22',
    })

    expect(result.completionEvents).toBe(2)
    expect(result.completionScore).toBe(1.5)
    expect(result.expectedScore).toBe(4)
    expect(result.completionPercentage).toBe(50)
  })

  it('scores period measurable targets once per period', () => {
    const habit = createCompletionLevelHabit(
      {
        trackingType: 'totalMeasurablePerPeriod',
        period: 'week',
        targetAmount: 100,
        minimumAmount: 50,
        unitLabel: 'repetitions',
      },
      ['minimum', 'standard'],
      { startsOn: '2026-05-18' },
    )
    const monday = createHabitLog({ id: 'monday', loggedForDate: '2026-05-18', amount: 30 })
    const wednesday = createHabitLog({
      id: 'wednesday',
      loggedForDate: '2026-05-20',
      amount: 20,
    })
    const friday = createHabitLog({ id: 'friday', loggedForDate: '2026-05-22', amount: 50 })

    expect(
      calculateHabitStats({
        habit,
        logs: [monday],
        from: '2026-05-18',
        to: '2026-05-24',
        today: '2026-05-22',
      }).completionScore,
    ).toBe(0)
    expect(
      calculateHabitStats({
        habit,
        logs: [monday, wednesday],
        from: '2026-05-18',
        to: '2026-05-24',
        today: '2026-05-22',
      }).completionScore,
    ).toBe(0.5)
    expect(
      calculateHabitStats({
        habit,
        logs: [monday, wednesday, friday],
        from: '2026-05-18',
        to: '2026-05-24',
        today: '2026-05-22',
      }).completionScore,
    ).toBe(1)
  })

  it('excludes inactive scheduled dates and malformed inactive logs without breaking streaks', () => {
    const habit = createHabit(
      { trackingType: 'binary' },
      {
        startsOn: '2026-05-18',
        scheduleRule: { kind: 'daily' },
        inactivityPeriods: [
          { reason: 'archived', startsOn: '2026-05-19', resumesOn: '2026-05-21' },
        ],
      },
    )

    const result = calculateHabitStats({
      habit,
      logs: [
        createHabitLog({ id: 'before', loggedForDate: '2026-05-18' }),
        createHabitLog({ id: 'invalid', loggedForDate: '2026-05-20' }),
        createHabitLog({ id: 'after', loggedForDate: '2026-05-21' }),
      ],
      from: '2026-05-18',
      to: '2026-05-21',
      today: '2026-05-21',
    })

    expect(result.completionEvents).toBe(2)
    expect(result.expectedScore).toBe(2)
    expect(result.completionPercentage).toBe(100)
    expect(result.currentStreak).toBe(2)
    expect(result.bestStreak).toBe(2)
  })

  it('caps certain-days targets by active dates without dropping partially active periods', () => {
    const result = calculateHabitStats({
      habit: createHabit(
        { trackingType: 'binary' },
        {
          startsOn: '2026-05-18',
          scheduleRule: { kind: 'certainDaysPerPeriod', period: 'week', targetDays: 3 },
          inactivityPeriods: [
            { reason: 'archived', startsOn: '2026-05-20', resumesOn: '2026-05-21' },
          ],
        },
      ),
      logs: [
        createHabitLog({ id: 'before', loggedForDate: '2026-05-18' }),
        createHabitLog({ id: 'after', loggedForDate: '2026-05-22' }),
      ],
      from: '2026-05-18',
      to: '2026-05-24',
      today: '2026-05-22',
    })

    expect(result.completionEvents).toBe(2)
    expect(result.expectedScore).toBe(3)
    expect(result.completionPercentage).toBe(67)
  })

  it('regroups flexible weekly scoring at year boundaries from the selected week start', () => {
    const habit = createHabit(
      { trackingType: 'binary' },
      { scheduleRule: { kind: 'certainDaysPerPeriod', period: 'week', targetDays: 2 } },
    )
    const logs = [
      createHabitLog({ id: 'sunday', loggedForDate: '2026-12-27' }),
      createHabitLog({ id: 'friday', loggedForDate: '2027-01-01' }),
    ]

    const mondayStart = calculateHabitStats({
      habit,
      logs,
      from: '2026-12-27',
      to: '2027-01-02',
      today: '2027-01-01',
      weekStartsOn: 1,
    })
    const sundayStart = calculateHabitStats({
      habit,
      logs,
      from: '2026-12-27',
      to: '2027-01-02',
      today: '2027-01-01',
      weekStartsOn: 0,
    })

    expect(mondayStart.completionScore).toBe(2)
    expect(mondayStart.expectedScore).toBe(4)
    expect(mondayStart.completionPercentage).toBe(50)
    expect(sundayStart.completionScore).toBe(2)
    expect(sundayStart.expectedScore).toBe(2)
    expect(sundayStart.completionPercentage).toBe(100)
  })

  it('resets the current flexible streak after a failed closed period but not an open period', () => {
    const habit = createHabit(
      { trackingType: 'binary' },
      {
        startsOn: '2026-05-04',
        scheduleRule: { kind: 'certainDaysPerPeriod', period: 'week', targetDays: 2 },
      },
    )
    const logs = [
      createHabitLog({ id: 'week-one-a', loggedForDate: '2026-05-04' }),
      createHabitLog({ id: 'week-one-b', loggedForDate: '2026-05-06' }),
      createHabitLog({ id: 'failed-week', loggedForDate: '2026-05-11' }),
      createHabitLog({ id: 'open-week', loggedForDate: '2026-05-18' }),
    ]

    const result = calculateHabitStats({
      habit,
      logs,
      from: '2026-05-04',
      to: '2026-05-24',
      today: '2026-05-20',
    })

    expect(result.currentStreak).toBe(1)
    expect(result.bestStreak).toBe(3)
  })

  it('carries a successful streak through an unfinished period and caps historical excess', () => {
    const habit = createHabit(
      { trackingType: 'binary' },
      {
        startsOn: '2026-05-11',
        scheduleRule: { kind: 'certainDaysPerPeriod', period: 'week', targetDays: 2 },
      },
    )
    const result = calculateHabitStats({
      habit,
      logs: [
        createHabitLog({ id: 'excess-a', loggedForDate: '2026-05-11' }),
        createHabitLog({ id: 'excess-b', loggedForDate: '2026-05-12' }),
        createHabitLog({ id: 'excess-c', loggedForDate: '2026-05-13' }),
      ],
      from: '2026-05-11',
      to: '2026-05-24',
      today: '2026-05-20',
    })

    expect(result.completionEvents).toBe(3)
    expect(result.completionPercentage).toBe(50)
    expect(result.currentStreak).toBe(2)
    expect(result.bestStreak).toBe(2)
  })
})
