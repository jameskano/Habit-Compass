import { useEffect, useMemo } from 'react'

import type { Category } from '@/domain/categories'
import {
  buildTodayItems,
  filterTodayItems,
  mergeTodayManualOrder,
  type TodayFilterState,
} from '@/domain/today'
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery'
import { useTodayHabitsQuery } from '@/features/habits/hooks/useTodayHabitsQuery'
import { useItemWaterfallReveal } from '@/features/items/components/useItemWaterfallReveal'
import { useTodayRecurrentTasksQuery } from '@/features/recurrent-tasks/hooks/useTodayRecurrentTasksQuery'
import { useTodayTasksQuery } from '@/features/tasks/hooks/useTodayTasksQuery'
import type { ISODateString } from '@/shared/types'

import { EMPTY_HABIT_LOGS, EMPTY_TODAY_ORDER } from './today.constants'
import { useTodayOrderStore } from './todayOrderStore'
import type { DetailSelection } from './today.types'

const EMPTY_CATEGORIES: Category[] = []

type UseTodayPageDataInput = {
  selectedDate: ISODateString
  today: ISODateString
  filters: TodayFilterState
  selectedMenuItemId: string | null
  amountHabitId: string | null
  detailSelection: DetailSelection | null
  selectedTaskId: string | null
  selectedRecurrentTaskId: string | null
}

export function useTodayPageData(input: UseTodayPageDataInput) {
  const {
    selectedDate,
    today,
    filters,
    selectedMenuItemId,
    amountHabitId,
    detailSelection,
    selectedTaskId,
    selectedRecurrentTaskId,
  } = input
  const orderForDate = useTodayOrderStore(
    (state) => state.ordersByDate[selectedDate] ?? EMPTY_TODAY_ORDER,
  )
  const setOrderForDate = useTodayOrderStore((state) => state.setOrderForDate)
  const pruneOrderForDate = useTodayOrderStore((state) => state.pruneOrderForDate)
  const categoriesQuery = useCategoriesQuery()
  const habitsQuery = useTodayHabitsQuery(undefined, selectedDate)
  const tasksQuery = useTodayTasksQuery(undefined, selectedDate)
  const recurrentQuery = useTodayRecurrentTasksQuery(undefined, selectedDate)
  const habitLogs = habitsQuery.data?.logs ?? EMPTY_HABIT_LOGS

  const rawItems = useMemo(
    () =>
      buildTodayItems({
        habits: habitsQuery.data?.habits ?? [],
        habitLogs,
        tasks: tasksQuery.data?.tasks ?? [],
        recurrentTasks: recurrentQuery.data?.tasks ?? [],
        recurrentOccurrences: recurrentQuery.data?.occurrences ?? [],
        selectedDate,
        today,
      }),
    [
      habitLogs,
      habitsQuery.data?.habits,
      recurrentQuery.data?.occurrences,
      recurrentQuery.data?.tasks,
      selectedDate,
      tasksQuery.data?.tasks,
      today,
    ],
  )
  const orderedItems = useMemo(
    () => mergeTodayManualOrder(rawItems, orderForDate),
    [orderForDate, rawItems],
  )
  const visibleItems = useMemo(
    () => filterTodayItems(orderedItems, filters),
    [filters, orderedItems],
  )
  const categories = categoriesQuery.data ?? EMPTY_CATEGORIES
  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  )
  const activeCategories = useMemo(
    () => categories.filter((category) => category.lifecycleStatus === 'active'),
    [categories],
  )
  const selectedMenuItem = useMemo(
    () => orderedItems.find((item) => item.id === selectedMenuItemId) ?? null,
    [orderedItems, selectedMenuItemId],
  )
  const selectedHabitForAmount = useMemo(
    () => (habitsQuery.data?.habits ?? []).find((habit) => habit.id === amountHabitId) ?? null,
    [amountHabitId, habitsQuery.data?.habits],
  )
  const selectedTask = useMemo(
    () => (tasksQuery.data?.tasks ?? []).find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasksQuery.data?.tasks],
  )
  const selectedRecurrentTask = useMemo(
    () =>
      (recurrentQuery.data?.tasks ?? []).find((task) => task.id === selectedRecurrentTaskId) ??
      null,
    [recurrentQuery.data?.tasks, selectedRecurrentTaskId],
  )
  const detailHabit = useMemo(
    () =>
      (habitsQuery.data?.habits ?? []).find((habit) => habit.id === detailSelection?.habitId) ??
      null,
    [detailSelection?.habitId, habitsQuery.data?.habits],
  )
  const isLoading =
    habitsQuery.isLoading ||
    tasksQuery.isLoading ||
    recurrentQuery.isLoading ||
    categoriesQuery.isLoading
  const isError =
    habitsQuery.isError || tasksQuery.isError || recurrentQuery.isError || categoriesQuery.isError
  const revealCards = useItemWaterfallReveal(!isLoading && !isError)
  const hasFilters =
    filters.type !== 'all' ||
    filters.categoryId.length > 0 ||
    filters.priority.length > 0 ||
    filters.searchText.trim().length > 0

  useEffect(() => {
    pruneOrderForDate(
      selectedDate,
      rawItems.map((item) => item.id),
    )
  }, [pruneOrderForDate, rawItems, selectedDate])

  return {
    activeCategories,
    categories,
    categoriesById,
    detailHabit,
    habitLogs,
    hasFilters,
    isError,
    isLoading,
    orderedItems,
    revealCards,
    selectedHabitForAmount,
    selectedMenuItem,
    selectedRecurrentTask,
    selectedTask,
    setOrderForDate,
    visibleItems,
  }
}
