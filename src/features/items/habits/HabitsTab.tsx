import { formatISO, parseISO, subDays } from 'date-fns'
import { useMemo, useState } from 'react'

import type { Habit } from '@/domain/habits'
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery'
import { useArchiveHabitMutation } from '@/features/habits/hooks/useArchiveHabitMutation'
import {
  useDeleteHabitMutation,
  useReorderHabitsMutation,
  useResetHabitProgressMutation,
  useRestoreHabitMutation,
} from '@/features/habits/hooks/useHabitDetailMutations'
import { useHabitLogsRangeQuery } from '@/features/habits/hooks/useHabitLogsRangeQuery'
import { useAppToast } from '@/shared/hooks/useAppToast'
import type { ISODateString } from '@/shared/types'
import { EmptyState } from '@/shared/ui/EmptyState'

import { ItemsFilterRow } from '../components/ItemsFilterRow'
import { SortableItemsList } from '../components/SortableItemsList'
import { useItemWaterfallReveal } from '../components/useItemWaterfallReveal'
import { HabitCard } from './HabitCard'
import { HabitDetail, type HabitDetailTab } from './HabitDetail'
import { HabitOptionsSheet } from './HabitOptionsSheet'

type HabitsTabProps = {
  habits: Habit[]
  showingArchived: boolean
  onToggleArchive: () => void
}

type DetailSelection = {
  habitId: string
  tab: HabitDetailTab
}

const asISODate = (value: Date) => {
  return formatISO(value, { representation: 'date' }) as ISODateString
}

export const HabitsTab = ({ habits, showingArchived, onToggleArchive }: HabitsTabProps) => {
  const appToast = useAppToast()
  const today = asISODate(new Date())
  const dates = useMemo(
    () => Array.from({ length: 7 }, (_, index) => asISODate(subDays(parseISO(today), 6 - index))),
    [today],
  )
  const from = dates[0]
  const categoriesQuery = useCategoriesQuery()
  const logsQuery = useHabitLogsRangeQuery({ from, to: today })
  const archiveMutation = useArchiveHabitMutation()
  const reorderMutation = useReorderHabitsMutation()
  const resetMutation = useResetHabitProgressMutation()
  const deleteMutation = useDeleteHabitMutation()
  const restoreMutation = useRestoreHabitMutation()
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)
  const [detailSelection, setDetailSelection] = useState<DetailSelection | null>(null)
  const [searchText, setSearchText] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const revealCards = useItemWaterfallReveal(!categoriesQuery.isLoading && !logsQuery.isLoading)
  const selectedHabit = habits.find((habit) => habit.id === selectedHabitId) ?? null
  const detailHabit = habits.find((habit) => habit.id === detailSelection?.habitId) ?? null

  if (categoriesQuery.isLoading || logsQuery.isLoading) {
    return <EmptyState titleId="shared.loading.title" descriptionId="shared.loading.description" />
  }

  if (categoriesQuery.isError || logsQuery.isError) {
    return <EmptyState titleId="shared.error.title" descriptionId="shared.error.description" />
  }

  const categoriesById = new Map(
    (categoriesQuery.data ?? []).map((category) => [category.id, category]),
  )
  const orderedHabits = [...habits].sort((left, right) => left.order - right.order)
  const normalizedSearch = searchText.trim().toLowerCase()
  const hasFilters = normalizedSearch.length > 0 || categoryId.length > 0
  const visibleHabits = orderedHabits.filter(
    (habit) =>
      habit.title.toLowerCase().includes(normalizedSearch) &&
      (!categoryId || habit.categoryId === categoryId),
  )

  const reorderHabits = (visibleHabitIds: string[]) => {
    const visibleIds = new Set(visibleHabitIds)
    let visibleIndex = 0
    const orderedHabitIds = orderedHabits.map((habit) =>
      visibleIds.has(habit.id) ? visibleHabitIds[visibleIndex++] : habit.id,
    )

    reorderMutation.mutate(orderedHabitIds)
  }

  const optionsPending =
    archiveMutation.isPending ||
    restoreMutation.isPending ||
    resetMutation.isPending ||
    deleteMutation.isPending

  const openDetail = (habit: Habit, tab: HabitDetailTab) => {
    setSelectedHabitId(null)
    setDetailSelection({ habitId: habit.id, tab })
  }

  const archiveHabit = (habit: Habit) => {
    archiveMutation.mutate(
      { habitId: habit.id, date: today },
      {
        onSuccess: () => {
          setSelectedHabitId(null)
          setDetailSelection(null)
          appToast.success({ id: 'page.items.habit.archived', values: { habit: habit.title } })
        },
      },
    )
  }

  const reactivateHabit = (habit: Habit) => {
    restoreMutation.mutate(
      { habitId: habit.id, date: today },
      {
        onSuccess: () => {
          setSelectedHabitId(null)
          setDetailSelection(null)
          appToast.success({ id: 'page.items.habit.reactivated', values: { habit: habit.title } })
        },
      },
    )
  }

  const handleArchived = (habit: Habit) => {
    setSelectedHabitId(null)
    setDetailSelection(null)
    appToast.success({ id: 'page.items.habit.archived', values: { habit: habit.title } })
  }

  const resetHabitProgress = (habit: Habit, onSuccess: () => void) => {
    resetMutation.mutate(habit.id, {
      onSuccess: () => {
        onSuccess()
        appToast.success({ id: 'page.items.habit.detail.progressReset' })
      },
    })
  }

  const deleteHabit = (habit: Habit) => {
    deleteMutation.mutate(habit.id, {
      onSuccess: () => {
        setSelectedHabitId(null)
        setDetailSelection(null)
        appToast.success({ id: 'page.items.habit.deleted', values: { habit: habit.title } })
      },
    })
  }

  return (
    <>
      <ItemsFilterRow
        categories={categoriesQuery.data ?? []}
        categoryId={categoryId}
        categoryLabelId="page.items.habit.filter.category"
        allCategoriesLabelId="page.items.habit.filter.allCategories"
        searchLabelId="page.items.habit.filter.search"
        searchPlaceholderId="page.items.habit.filter.searchPlaceholder"
        tabLabelId="page.items.tab.habits"
        searchText={searchText}
        showingArchived={showingArchived}
        onCategoryChange={setCategoryId}
        onSearchChange={setSearchText}
        onToggleArchive={onToggleArchive}
      />
      {visibleHabits.length === 0 ? (
        <EmptyState
          titleId={
            hasFilters
              ? 'page.items.habit.empty.filteredTitle'
              : showingArchived
                ? 'page.items.habit.empty.archivedTitle'
                : 'page.items.habit.empty.activeTitle'
          }
          descriptionId={
            hasFilters
              ? 'page.items.habit.empty.filteredDescription'
              : showingArchived
                ? 'page.items.habit.empty.archivedDescription'
                : 'page.items.habit.empty.activeDescription'
          }
        />
      ) : (
        <SortableItemsList
          items={visibleHabits}
          group="habits"
          reorderLabelId="page.items.habit.action.reorder"
          onReorder={reorderHabits}
          revealCards={revealCards}
          disabled={showingArchived}
        >
          {(habit) => (
            <HabitCard
              habit={habit}
              category={habit.categoryId ? categoriesById.get(habit.categoryId) : undefined}
              logs={(logsQuery.data ?? []).filter((log) => log.habitId === habit.id)}
              dates={dates}
              from={from}
              today={today}
              archived={showingArchived}
              onOpenOptions={() => setSelectedHabitId(habit.id)}
              onOpenCalendar={() => openDetail(habit, 'calendar')}
              onSwipeEdit={() => openDetail(habit, 'edit')}
              onSwipeArchive={() => archiveHabit(habit)}
            />
          )}
        </SortableItemsList>
      )}
      <HabitOptionsSheet
        habit={selectedHabit}
        archived={showingArchived}
        pending={optionsPending}
        onClose={() => setSelectedHabitId(null)}
        onOpenDetail={openDetail}
        onArchive={archiveHabit}
        onReactivate={reactivateHabit}
        onReset={resetHabitProgress}
        onDelete={deleteHabit}
      />
      {detailHabit && detailSelection ? (
        <HabitDetail
          key={`${detailHabit.id}:${detailSelection.tab}`}
          habit={detailHabit}
          categories={categoriesQuery.data ?? []}
          initialTab={detailSelection.tab}
          today={today}
          onClose={() => setDetailSelection(null)}
          onArchived={handleArchived}
          onDeleted={(habit) => {
            setDetailSelection(null)
            appToast.success({ id: 'page.items.habit.deleted', values: { habit: habit.title } })
          }}
        />
      ) : null}
    </>
  )
}
