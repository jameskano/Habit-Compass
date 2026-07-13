import { describe, expect, it } from 'vitest'

import type { Habit } from '@/domain/habits'
import type { RecurrentTask } from '@/domain/recurrent-tasks'
import type { Task } from '@/domain/tasks'

import {
  canUseItemKind,
  getFreePlanLimitErrorKind,
  getItemLimitCounts,
  getItemLimitState,
} from './planLimits'

const habit = (lifecycleStatus: Habit['lifecycleStatus']) =>
  ({ lifecycleStatus }) as Pick<Habit, 'lifecycleStatus'>

const task = (
  lifecycleStatus: Task['lifecycleStatus'],
  completionStatus: Task['completionStatus'],
) => ({ completionStatus, lifecycleStatus }) as Pick<Task, 'completionStatus' | 'lifecycleStatus'>

const recurrentTask = (lifecycleStatus: RecurrentTask['lifecycleStatus']) =>
  ({ lifecycleStatus }) as Pick<RecurrentTask, 'lifecycleStatus'>

describe('plan limits', () => {
  it('counts only active habits, open tasks, and active recurrent tasks', () => {
    expect(
      getItemLimitCounts({
        habits: [habit('active'), habit('archived')],
        recurrentTasks: [recurrentTask('active'), recurrentTask('archived')],
        tasks: [
          task('active', 'pending'),
          task('active', 'completed'),
          task('archived', 'pending'),
        ],
      }),
    ).toEqual({
      activeHabits: 1,
      activeRecurrentTasks: 1,
      openTasks: 1,
    })
  })

  it('blocks free users at item limits', () => {
    const counts = {
      activeHabits: 5,
      activeRecurrentTasks: 5,
      openTasks: 10,
    }

    expect(canUseItemKind(getItemLimitState({ counts, isPremium: false, kind: 'habit' }))).toBe(
      false,
    )
    expect(canUseItemKind(getItemLimitState({ counts, isPremium: false, kind: 'task' }))).toBe(
      false,
    )
    expect(
      canUseItemKind(getItemLimitState({ counts, isPremium: false, kind: 'recurrentTask' })),
    ).toBe(false)
  })

  it('allows Premium users and categories regardless of counts', () => {
    const counts = {
      activeHabits: 5,
      activeRecurrentTasks: 5,
      openTasks: 10,
    }

    expect(canUseItemKind(getItemLimitState({ counts, isPremium: true, kind: 'habit' }))).toBe(true)
    expect(canUseItemKind({ kind: 'category' })).toBe(true)
  })

  it('maps stable backend limit errors back to item kinds', () => {
    expect(getFreePlanLimitErrorKind(new Error('free_plan_limit_exceeded:habit'))).toBe('habit')
    expect(getFreePlanLimitErrorKind('free_plan_limit_exceeded:task')).toBe('task')
    expect(getFreePlanLimitErrorKind('free_plan_limit_exceeded:recurrentTask')).toBe(
      'recurrentTask',
    )
  })
})
