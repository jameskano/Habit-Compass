import { describe, expect, it } from 'vitest'

import type { Task } from './types'
import { TaskSchema } from './schemas'
import { sortTasks } from './logic/taskOrdering'

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-a',
    userId: 'user-1',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    archivedAt: null,
    title: 'Task',
    notes: null,
    dueDate: null,
    completedAt: null,
    categoryId: null,
    priority: 'medium',
    carryForward: true,
    order: 0,
    lifecycleStatus: 'active',
    completionStatus: 'pending',
    ...overrides,
  }
}

describe('tasks domain', () => {
  it('requires priority, carry-forward, and order while permitting an absent due date', () => {
    expect(TaskSchema.safeParse(task()).success).toBe(true)
    expect(TaskSchema.safeParse({ ...task(), priority: 'essential' }).success).toBe(false)
    expect(TaskSchema.safeParse({ ...task(), order: -1 }).success).toBe(false)
  })

  it('sorts by manual order before fallback task rules', () => {
    const sorted = sortTasks([
      task({ id: 'done', order: 3, completionStatus: 'completed', dueDate: '2026-05-18' }),
      task({ id: 'undated', order: 2, priority: 'high' }),
      task({ id: 'later', order: 1, dueDate: '2026-05-20', priority: 'high' }),
      task({ id: 'early', order: 0, dueDate: '2026-05-18', priority: 'low' }),
    ])

    expect(sorted.map((entry) => entry.id)).toEqual(['early', 'later', 'undated', 'done'])
  })

  it('falls back to status, due date, and priority when manual order matches', () => {
    const sorted = sortTasks([
      task({ id: 'done', completionStatus: 'completed', dueDate: '2026-05-18' }),
      task({ id: 'undated', priority: 'high' }),
      task({ id: 'later', dueDate: '2026-05-20', priority: 'high' }),
      task({ id: 'early', dueDate: '2026-05-18', priority: 'low' }),
    ])

    expect(sorted.map((entry) => entry.id)).toEqual(['early', 'later', 'undated', 'done'])
  })
})
