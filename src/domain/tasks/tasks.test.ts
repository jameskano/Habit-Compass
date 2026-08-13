import { describe, expect, it } from 'vitest'

import type { Task } from './types'
import { TaskSchema } from './schemas'
import { sortTasks } from './logic/taskOrdering'
import { shouldAutoArchiveCompletedTask } from './logic/taskAutoArchive'
import { canReactivateTask, reactivateTask } from './logic/taskReactivation'

const task = (overrides: Partial<Task> = {}): Task => {
  return {
    id: 'task-a',
    userId: 'user-1',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    archivedAt: null,
    title: 'Task',
    description: null,
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
  it('requires priority, carry-forward, and order while permitting optional description and due date', () => {
    expect(TaskSchema.safeParse(task()).success).toBe(true)
    expect(TaskSchema.safeParse(task({ description: 'Clarifies the task.' })).success).toBe(true)
    expect(TaskSchema.safeParse({ ...task(), priority: 'essential' }).success).toBe(false)
    expect(TaskSchema.safeParse({ ...task(), order: -1 }).success).toBe(false)
  })

  it('sorts by status, due date, priority, and stable ties', () => {
    const sorted = sortTasks([
      task({ id: 'done', completionStatus: 'completed', dueDate: '2026-05-18' }),
      task({ id: 'undated', priority: 'high' }),
      task({ id: 'later', dueDate: '2026-05-20', priority: 'high' }),
      task({ id: 'early-high', dueDate: '2026-05-18', priority: 'high' }),
      task({ id: 'early-low', dueDate: '2026-05-18', priority: 'low' }),
    ])

    expect(sorted.map((entry) => entry.id)).toEqual([
      'early-high',
      'early-low',
      'later',
      'undated',
      'done',
    ])
  })

  it('identifies completed active past-due tasks for automatic archive', () => {
    expect(
      shouldAutoArchiveCompletedTask(
        task({ completionStatus: 'completed', dueDate: '2026-05-20' }),
        '2026-05-21',
      ),
    ).toBe(true)

    expect(
      shouldAutoArchiveCompletedTask(
        task({ completionStatus: 'completed', dueDate: '2026-05-21' }),
        '2026-05-21',
      ),
    ).toBe(false)
    expect(
      shouldAutoArchiveCompletedTask(
        task({ completionStatus: 'completed', dueDate: '2026-05-22' }),
        '2026-05-21',
      ),
    ).toBe(false)
    expect(
      shouldAutoArchiveCompletedTask(
        task({ completionStatus: 'pending', dueDate: '2026-05-20' }),
        '2026-05-21',
      ),
    ).toBe(false)
    expect(
      shouldAutoArchiveCompletedTask(
        task({
          completionStatus: 'completed',
          dueDate: '2026-05-20',
          lifecycleStatus: 'archived',
        }),
        '2026-05-21',
      ),
    ).toBe(false)
    expect(
      shouldAutoArchiveCompletedTask(
        task({ completionStatus: 'completed', dueDate: null }),
        '2026-05-21',
      ),
    ).toBe(false)
  })

  it('reactivates only archived incomplete tasks and resets them to pending', () => {
    const archivedMissedTask = task({
      lifecycleStatus: 'archived',
      completionStatus: 'missed',
      archivedAt: '2026-05-20T10:00:00.000Z',
    })

    expect(canReactivateTask(archivedMissedTask)).toBe(true)
    expect(reactivateTask(archivedMissedTask, '2026-05-21T10:00:00.000Z')).toMatchObject({
      lifecycleStatus: 'active',
      completionStatus: 'pending',
      completedAt: null,
      archivedAt: null,
      updatedAt: '2026-05-21T10:00:00.000Z',
    })
    expect(canReactivateTask(task({ lifecycleStatus: 'active' }))).toBe(false)
    expect(
      reactivateTask(
        task({ lifecycleStatus: 'archived', completionStatus: 'completed' }),
        '2026-05-21T10:00:00.000Z',
      ),
    ).toBeNull()
  })
})
