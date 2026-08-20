import { cleanup } from '@testing-library/react'
import { formatISO, subDays } from 'date-fns'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { DerivedRecurrentOccurrence } from '@/domain/recurrent-tasks'
import { getMockState, mockData, resetMockState } from '@/integrations/mock/mockData'
import type { ISODateString } from '@/shared/types'
import { renderWithAppProviders } from '@/test/utils/renderWithAppProviders'

import { HabitCard } from './habits/HabitCard'
import { RecurrentTaskCard } from './recurrent-tasks/RecurrentTaskCard'
import { TaskCard } from './tasks/TaskCard'

const recentDates = (): ISODateString[] => {
  const today = new Date(`${mockData.today}T00:00:00.000Z`)

  return Array.from({ length: 7 }, (_, index) =>
    formatISO(subDays(today, 6 - index), { representation: 'date' }),
  ) as ISODateString[]
}

const getSwipeAction = (container: HTMLElement, action: string) =>
  container.querySelector(`[data-swipe-action="${action}"]`)

describe('item card swipe action mappings', () => {
  beforeEach(() => {
    resetMockState()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows Edit on the right and Archive on the left for active habits only', () => {
    const habit = getMockState().habits[0]
    const active = renderWithAppProviders(
      <HabitCard
        habit={habit}
        logs={[]}
        dates={recentDates()}
        today={mockData.today}
        archived={false}
        onOpenOptions={vi.fn()}
        onOpenCalendar={vi.fn()}
        onSwipeEdit={vi.fn()}
        onSwipeArchive={vi.fn()}
      />,
    )

    expect(getSwipeAction(active.container, 'edit')).toHaveAttribute('data-swipe-direction', 'left')
    expect(getSwipeAction(active.container, 'archive')).toHaveAttribute(
      'data-swipe-direction',
      'right',
    )

    cleanup()

    const archived = renderWithAppProviders(
      <HabitCard
        habit={{ ...habit, lifecycleStatus: 'archived' }}
        logs={[]}
        dates={recentDates()}
        today={mockData.today}
        archived
        onOpenOptions={vi.fn()}
        onOpenCalendar={vi.fn()}
        onSwipeEdit={vi.fn()}
        onSwipeArchive={vi.fn()}
      />,
    )

    expect(archived.container.querySelector('[data-swipe-action]')).not.toBeInTheDocument()
  })

  it('shows Edit and Complete for pending tasks, but only Edit when completion is unavailable', () => {
    const task = getMockState().tasks.find((entry) => entry.completionStatus === 'pending')
    expect(task).toBeDefined()

    const pending = renderWithAppProviders(
      <TaskCard task={task!} archived={false} onEdit={vi.fn()} onComplete={vi.fn()} />,
    )

    expect(getSwipeAction(pending.container, 'edit')).toBeInTheDocument()
    expect(getSwipeAction(pending.container, 'complete')).toBeInTheDocument()

    cleanup()

    const completed = renderWithAppProviders(
      <TaskCard
        task={{ ...task!, completionStatus: 'completed', completedAt: task!.updatedAt }}
        archived
        onEdit={vi.fn()}
        onComplete={vi.fn()}
      />,
    )

    expect(getSwipeAction(completed.container, 'edit')).toBeInTheDocument()
    expect(getSwipeAction(completed.container, 'complete')).not.toBeInTheDocument()
  })

  it('offers recurrent-task completion only for an actionable occurrence', () => {
    const task = getMockState().recurrentTasks[0]
    const occurrence: DerivedRecurrentOccurrence = {
      recurrentTaskId: task.id,
      scheduledForDate: mockData.today,
      status: 'pending',
      isOverdue: false,
      isStored: false,
      actionable: true,
    }

    const actionable = renderWithAppProviders(
      <RecurrentTaskCard
        task={task}
        occurrence={occurrence}
        archived={false}
        onEdit={vi.fn()}
        onComplete={vi.fn()}
      />,
    )

    expect(getSwipeAction(actionable.container, 'edit')).toBeInTheDocument()
    expect(getSwipeAction(actionable.container, 'complete')).toBeInTheDocument()

    cleanup()

    const unavailable = renderWithAppProviders(
      <RecurrentTaskCard
        task={task}
        occurrence={{ ...occurrence, actionable: false }}
        archived={false}
        onEdit={vi.fn()}
        onComplete={vi.fn()}
      />,
    )

    expect(getSwipeAction(unavailable.container, 'edit')).toBeInTheDocument()
    expect(getSwipeAction(unavailable.container, 'complete')).not.toBeInTheDocument()
  })
})
