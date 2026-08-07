import { cleanup, screen } from '@testing-library/react'
import { formatISO, subDays } from 'date-fns'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ISODateString } from '@/shared/types'
import { getMockState, mockData, resetMockState } from '@/integrations/mock/mockData'
import { renderWithAppProviders } from '@/test/utils/renderWithAppProviders'

import { HabitCard } from './habits/HabitCard'
import { HabitDetail } from './habits/HabitDetail'
import { HabitOptionsSheet } from './habits/HabitOptionsSheet'
import { RecurrentTaskCard } from './recurrent-tasks/RecurrentTaskCard'
import { RecurrentTaskEdit } from './recurrent-tasks/RecurrentTaskEdit'
import { TaskCard } from './tasks/TaskCard'
import { TaskEdit } from './tasks/TaskEdit'
import { TodayActionSheet } from '../today/TodayActionSheet'
import { TodayItemCard } from '../today/TodayItemCard'

const longTitle =
  'ThisIsAnExtremelyLongUnbrokenHabitTaskAndRecurrentTaskNameThatMustNeverOverflowTheViewport'
const longDescription =
  'ThisIsAnExtremelyLongUnbrokenDescriptionThatMustStayInsideTheCardWithoutWideningTheLayout'

const recentDates = (): ISODateString[] => {
  const today = new Date(`${mockData.today}T00:00:00.000Z`)

  return Array.from({ length: 7 }, (_, index) =>
    formatISO(subDays(today, 6 - index), { representation: 'date' }),
  ) as ISODateString[]
}

const expectTruncatedTitle = (element: HTMLElement) => {
  expect(element).toHaveAttribute('title', longTitle)
  expect(element).toHaveClass('min-w-0', 'truncate')
}

const expectViewportSafeCard = (element: HTMLElement | null) => {
  expect(element).toHaveClass('min-w-0', 'w-full', 'max-w-full')
}

describe('long item name truncation', () => {
  beforeEach(() => {
    resetMockState()
  })

  afterEach(() => {
    cleanup()
  })

  it('truncates item names in Items cards and keeps full titles available', () => {
    const habit = { ...getMockState().habits[0], title: longTitle }
    const task = { ...getMockState().tasks[0], title: longTitle, description: longDescription }
    const recurrentTask = {
      ...getMockState().recurrentTasks[0],
      title: longTitle,
      description: longDescription,
    }

    renderWithAppProviders(
      <>
        <HabitCard
          habit={habit}
          logs={[]}
          dates={recentDates()}
          from={habit.startsOn}
          today={mockData.today}
          archived={false}
          onOpenOptions={vi.fn()}
          onOpenCalendar={vi.fn()}
          onSwipeEdit={vi.fn()}
          onSwipeArchive={vi.fn()}
        />
        <TaskCard task={task} archived={false} onEdit={vi.fn()} onComplete={vi.fn()} />
        <RecurrentTaskCard
          task={recurrentTask}
          archived={false}
          onEdit={vi.fn()}
          onComplete={vi.fn()}
        />
      </>,
    )

    const visibleTitles = screen.getAllByTitle(longTitle)

    expect(visibleTitles).toHaveLength(3)
    visibleTitles.forEach((title) => expectTruncatedTitle(title))
    expectViewportSafeCard(visibleTitles[0].closest('[data-habit-card]'))
    expectViewportSafeCard(visibleTitles[1].closest('[role="button"]'))
    expectViewportSafeCard(visibleTitles[2].closest('[role="button"]'))
    screen
      .getAllByTitle(longDescription)
      .forEach((description) =>
        expect(description).toHaveClass('line-clamp-2', 'min-w-0', '[overflow-wrap:anywhere]'),
      )
  })

  it('truncates item names in Today card and action sheet headers', () => {
    renderWithAppProviders(
      <>
        <TodayItemCard
          type="task"
          title={longTitle}
          meta={longDescription}
          fallbackCategoryLabel="No category"
          priority="medium"
          priorityLabel="Priority: Medium"
          state="pending"
          disabled={false}
          onPrimaryAction={vi.fn()}
          onOpenMenu={vi.fn()}
        />
        <TodayActionSheet title={longTitle} open actions={[]} onClose={vi.fn()} />
      </>,
    )

    const visibleTitles = screen.getAllByTitle(longTitle)

    expect(visibleTitles).toHaveLength(2)
    visibleTitles.forEach((title) => expectTruncatedTitle(title))
    expectViewportSafeCard(visibleTitles[0].closest('[role="button"]'))
    expect(screen.getByTitle(longDescription)).toHaveClass('min-w-0', 'truncate')
  })

  it('truncates item names in habit menu and detail headers', () => {
    const habit = { ...getMockState().habits[0], title: longTitle }

    renderWithAppProviders(
      <>
        <HabitOptionsSheet
          habit={habit}
          archived={false}
          pending={false}
          onClose={vi.fn()}
          onOpenDetail={vi.fn()}
          onArchive={vi.fn()}
          onReactivate={vi.fn()}
          onReset={vi.fn()}
          onDelete={vi.fn()}
        />
        <HabitDetail
          habit={habit}
          categories={[]}
          initialTab="calendar"
          today={mockData.today}
          onClose={vi.fn()}
          onArchived={vi.fn()}
          onDeleted={vi.fn()}
        />
      </>,
    )

    const visibleTitles = screen.getAllByTitle(longTitle)

    expect(visibleTitles).toHaveLength(2)
    visibleTitles.forEach((title) => expectTruncatedTitle(title))
  })

  it('truncates task and recurrent-task edit headers', () => {
    const task = { ...getMockState().tasks[0], title: longTitle }
    const recurrentTask = { ...getMockState().recurrentTasks[0], title: longTitle }

    renderWithAppProviders(
      <>
        <TaskEdit
          task={task}
          categories={[]}
          onClose={vi.fn()}
          onArchived={vi.fn()}
          onDeleted={vi.fn()}
        />
        <RecurrentTaskEdit
          task={recurrentTask}
          categories={[]}
          today={mockData.today}
          onClose={vi.fn()}
          onArchived={vi.fn()}
          onDeleted={vi.fn()}
        />
      </>,
    )

    const visibleTitles = screen.getAllByTitle(longTitle)

    expect(visibleTitles).toHaveLength(2)
    visibleTitles.forEach((title) => expectTruncatedTitle(title))
  })
})
