import { beforeEach, describe, expect, it } from 'vitest'

import { mockCategoriesRepository } from './mockCategoriesRepository'
import { mockHabitsRepository } from './mockHabitsRepository'
import { mockData, resetMockState } from './mockData'
import { mockTasksRepository } from './mockTasksRepository'

describe('mock repositories', () => {
  beforeEach(() => {
    resetMockState()
  })

  it('lists habits due today', async () => {
    const result = await mockHabitsRepository.listForToday({
      userId: mockData.currentUserId,
      date: mockData.today,
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.data).toHaveLength(3)
    }
  })

  it('updates task completion state in memory', async () => {
    const result = await mockTasksRepository.setCompletionStatus({
      userId: mockData.currentUserId,
      taskId: 'task-clinic',
      status: 'completed',
    })

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.data.completionStatus).toBe('completed')
      expect(result.data.completedAt).not.toBeNull()
    }
  })

  it('archives categories without removing them from state permanently', async () => {
    const archiveResult = await mockCategoriesRepository.archive({
      userId: mockData.currentUserId,
      categoryId: 'category-health',
    })

    expect(archiveResult.ok).toBe(true)

    const listResult = await mockCategoriesRepository.listForUser({
      userId: mockData.currentUserId,
    })

    expect(listResult.ok).toBe(true)

    if (listResult.ok) {
      expect(listResult.data.find((category) => category.id === 'category-health')).toBeDefined()
    }
  })
})
