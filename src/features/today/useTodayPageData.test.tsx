import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getMockState, mockData, resetMockState } from '@/integrations/mock/mockData'

import { useTodayOrderStore } from './todayOrderStore'
import { useTodayPageData } from './useTodayPageData'

const queryStates = vi.hoisted(() => ({
  categories: {
    data: undefined as ReturnType<typeof getMockState>['categories'] | undefined,
    isError: false,
    isLoading: true,
  },
  habits: {
    data: undefined as
      | {
          habits: ReturnType<typeof getMockState>['habits']
          logs: ReturnType<typeof getMockState>['habitLogs']
        }
      | undefined,
    isError: false,
    isLoading: true,
    isSuccess: false,
  },
  recurrent: {
    data: undefined as
      | {
          occurrences: ReturnType<typeof getMockState>['recurrentTaskOccurrences']
          tasks: ReturnType<typeof getMockState>['recurrentTasks']
        }
      | undefined,
    isError: false,
    isLoading: true,
    isSuccess: false,
  },
  tasks: {
    data: undefined as { tasks: ReturnType<typeof getMockState>['tasks'] } | undefined,
    isError: false,
    isLoading: true,
    isSuccess: false,
  },
}))

vi.mock('@/features/categories/hooks/useCategoriesQuery', () => ({
  useCategoriesQuery: () => queryStates.categories,
}))

vi.mock('@/features/habits/hooks/useTodayHabitsQuery', () => ({
  useTodayHabitsQuery: () => queryStates.habits,
}))

vi.mock('@/features/recurrent-tasks/hooks/useTodayRecurrentTasksQuery', () => ({
  useTodayRecurrentTasksQuery: () => queryStates.recurrent,
}))

vi.mock('@/features/tasks/hooks/useTodayTasksQuery', () => ({
  useTodayTasksQuery: () => queryStates.tasks,
}))

vi.mock('@/features/items/components/useItemWaterfallReveal', () => ({
  useItemWaterfallReveal: () => false,
}))

const hookInput = {
  selectedDate: mockData.today,
  today: mockData.today,
  filters: {
    type: 'all' as const,
    categoryId: '',
    priority: '' as const,
    searchText: '',
  },
  selectedMenuItemId: null,
  amountHabitId: null,
  detailSelection: null,
  selectedTaskId: null,
  selectedRecurrentTaskId: null,
}

describe('useTodayPageData order reconciliation', () => {
  beforeEach(() => {
    resetMockState()
    window.localStorage.clear()
    useTodayOrderStore.getState().resetOrderStore()

    Object.assign(queryStates.categories, {
      data: undefined,
      isError: false,
      isLoading: true,
    })
    for (const state of [queryStates.habits, queryStates.tasks, queryStates.recurrent]) {
      Object.assign(state, {
        data: undefined,
        isError: false,
        isLoading: true,
        isSuccess: false,
      })
    }
  })

  it('preserves persisted order until every item source has loaded successfully', async () => {
    const savedOrder = ['task:task-groceries', 'missing:item', 'habit:habit-water']
    useTodayOrderStore.getState().setOrderForDate(mockData.today, savedOrder)

    const { rerender, result } = renderHook(() => useTodayPageData(hookInput))

    expect(useTodayOrderStore.getState().getOrderForDate(mockData.today)).toEqual(savedOrder)

    const state = getMockState()
    act(() => {
      Object.assign(queryStates.categories, {
        data: state.categories,
        isLoading: false,
      })
      Object.assign(queryStates.tasks, {
        data: { tasks: state.tasks },
        isLoading: false,
        isSuccess: true,
      })
      Object.assign(queryStates.recurrent, {
        data: {
          tasks: state.recurrentTasks,
          occurrences: state.recurrentTaskOccurrences,
        },
        isLoading: false,
        isSuccess: true,
      })
      Object.assign(queryStates.habits, {
        data: undefined,
        isError: true,
        isLoading: false,
        isSuccess: false,
      })
    })
    rerender()

    expect(useTodayOrderStore.getState().getOrderForDate(mockData.today)).toEqual(savedOrder)

    act(() => {
      Object.assign(queryStates.habits, {
        data: { habits: state.habits, logs: state.habitLogs },
        isError: false,
        isSuccess: true,
      })
    })
    rerender()

    await waitFor(() => {
      expect(useTodayOrderStore.getState().getOrderForDate(mockData.today)).toEqual([
        'task:task-groceries',
        'habit:habit-water',
      ])
    })
    expect(result.current.orderedItems.slice(0, 2).map((item) => item.id)).toEqual([
      'task:task-groceries',
      'habit:habit-water',
    ])
  })
})
