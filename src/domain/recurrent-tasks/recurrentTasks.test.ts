import { describe, expect, it } from 'vitest'

import type { ISODateString } from '@/shared/types'

import type { RecurrentTask } from './types'
import { RecurrentTaskSchema } from './schemas'
import { deriveRecurrentOccurrences, isRecurrentTaskScheduledOnDate } from './logic/recurrentOccurrences'

function task(overrides: Partial<RecurrentTask> = {}): RecurrentTask {
  return {
    id: 'rec-a',
    userId: 'user-1',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    archivedAt: null,
    title: 'Recurring',
    notes: null,
    categoryId: null,
    priority: 'medium',
    carryForward: true,
    order: 0,
    lifecycleStatus: 'active',
    startsOn: '2026-05-01',
    endsOn: null,
    recurrenceRule: { kind: 'daily' },
    ...overrides,
  }
}

describe('recurrent tasks domain', () => {
  it('validates priority, ordering, and bounded dates', () => {
    expect(RecurrentTaskSchema.safeParse(task()).success).toBe(true)
    expect(RecurrentTaskSchema.safeParse(task({ endsOn: '2026-04-30' })).success).toBe(false)
  })

  it('evaluates every executable recurrence rule but not custom placeholders', () => {
    const executableCases: Array<{ rule: RecurrentTask['recurrenceRule']; date: ISODateString }> = [
      { rule: { kind: 'daily' }, date: '2026-05-03' },
      { rule: { kind: 'specificDaysOfWeek', daysOfWeek: [1] }, date: '2026-05-04' },
      { rule: { kind: 'everyXDays', intervalDays: 2 }, date: '2026-05-03' },
      { rule: { kind: 'everyXWeeks', intervalWeeks: 1, daysOfWeek: [1] }, date: '2026-05-04' },
      { rule: { kind: 'everyXMonths', intervalMonths: 1, dayOfMonth: 3 }, date: '2026-05-03' },
      { rule: { kind: 'firstWeekdayOfMonth', weekday: 1 }, date: '2026-06-01' },
    ]

    for (const item of executableCases) {
      expect(isRecurrentTaskScheduledOnDate(task({ recurrenceRule: item.rule }), item.date)).toBe(true)
    }

    expect(
      isRecurrentTaskScheduledOnDate(
        task({ recurrenceRule: { kind: 'customFutureRule', description: 'Later' } }),
        '2026-05-03',
      ),
    ).toBe(false)
  })

  it('rejects invalid weekday and month-day recurrence payloads', () => {
    expect(
      RecurrentTaskSchema.safeParse(task({ recurrenceRule: { kind: 'specificDaysOfWeek', daysOfWeek: [] } }))
        .success,
    ).toBe(false)
    expect(
      RecurrentTaskSchema.safeParse(task({ recurrenceRule: { kind: 'everyXMonths', intervalMonths: 1, dayOfMonth: 32 } }))
        .success,
    ).toBe(false)
  })

  it('derives overdue pending or missed states without storing them', () => {
    const carried = deriveRecurrentOccurrences({
      task: task({ carryForward: true }),
      storedOccurrences: [],
      from: '2026-05-20',
      to: '2026-05-20',
      today: '2026-05-21',
    })[0]
    const expired = deriveRecurrentOccurrences({
      task: task({ carryForward: false }),
      storedOccurrences: [],
      from: '2026-05-20',
      to: '2026-05-20',
      today: '2026-05-21',
    })[0]

    expect(carried).toMatchObject({ status: 'pending', isOverdue: true, isStored: false, actionable: true })
    expect(expired).toMatchObject({ status: 'missed', isStored: false, actionable: false })
  })
})
