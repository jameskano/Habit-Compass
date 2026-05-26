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
    lifecycleStatus: 'active',
    completionStatus: 'pending',
    ...overrides,
  }
}

describe('tasks domain', () => {
  it('requires priority and carry-forward while permitting an absent due date', () => {
    expect(TaskSchema.safeParse(task()).success).toBe(true)
    expect(TaskSchema.safeParse({ ...task(), priority: 'essential' }).success).toBe(false)
  })

  it('sorts pending dated tasks first, then due date and priority', () => {
    const sorted = sortTasks([
      task({ id: 'done', completionStatus: 'completed', dueDate: '2026-05-18' }),
      task({ id: 'undated', priority: 'high' }),
      task({ id: 'later', dueDate: '2026-05-20', priority: 'high' }),
      task({ id: 'early', dueDate: '2026-05-18', priority: 'low' }),
    ])

    expect(sorted.map((entry) => entry.id)).toEqual(['early', 'later', 'undated', 'done'])
  })
})
