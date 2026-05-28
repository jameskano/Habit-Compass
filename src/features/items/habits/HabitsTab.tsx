import { formatISO, parseISO, subDays } from 'date-fns'
import { useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import type { Habit } from '@/domain/habits'
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery'
import { useArchiveHabitMutation } from '@/features/habits/hooks/useArchiveHabitMutation'
import { useReorderHabitsMutation } from '@/features/habits/hooks/useHabitDetailMutations'
import { useHabitLogsRangeQuery } from '@/features/habits/hooks/useHabitLogsRangeQuery'
import type { ISODateString } from '@/shared/types'
import { EmptyState } from '@/shared/ui/EmptyState'

import { ItemsFilterRow } from '../components/ItemsFilterRow'
import { SortableItemsList } from '../components/SortableItemsList'
import { HabitCard } from './HabitCard'
import { HabitDetail, type HabitDetailTab } from './HabitDetail'
import type { HabitDangerAction } from './HabitConfirmationDialog'
import { HabitOptionsSheet } from './HabitOptionsSheet'

type HabitsTabProps = {
  habits: Habit[]
  showingArchived: boolean
  onToggleArchive: () => void
}

type Announcement = {
  id: string
  title: string
}

type DetailSelection = {
  habitId: string
  tab: HabitDetailTab
  dangerAction?: HabitDangerAction
}

function asISODate(value: Date) {
  return formatISO(value, { representation: 'date' }) as ISODateString
}

export function HabitsTab({ habits, showingArchived, onToggleArchive }: HabitsTabProps) {
  const intl = useIntl()
  const today = asISODate(new Date())
  const dates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        asISODate(subDays(parseISO(today), 6 - index)),
      ),
    [today],
  )
  const from = dates[0]
  const categoriesQuery = useCategoriesQuery()
  const logsQuery = useHabitLogsRangeQuery({ from, to: today })
  const archiveMutation = useArchiveHabitMutation()
  const reorderMutation = useReorderHabitsMutation()
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)
  const [detailSelection, setDetailSelection] = useState<DetailSelection | null>(null)
  const [searchText, setSearchText] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const selectedHabit = habits.find((habit) => habit.id === selectedHabitId) ?? null
  const detailHabit =
    habits.find((habit) => habit.id === detailSelection?.habitId) ?? null

  if (categoriesQuery.isLoading || logsQuery.isLoading) {
    return <EmptyState titleId="shared.loading.title" descriptionId="shared.loading.description" />
  }

  if (categoriesQuery.isError || logsQuery.isError) {
    return <EmptyState titleId="shared.error.title" descriptionId="shared.error.description" />
  }

  const categoriesById = new Map((categoriesQuery.data ?? []).map((category) => [category.id, category]))
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

  const openDetail = (
    habit: Habit,
    tab: HabitDetailTab,
    dangerAction?: HabitDangerAction,
  ) => {
    setSelectedHabitId(null)
    setDetailSelection({ habitId: habit.id, tab, dangerAction })
  }

  const archiveHabit = (habit: Habit) => {
    archiveMutation.mutate(habit.id, {
      onSuccess: () => {
        setSelectedHabitId(null)
        setDetailSelection(null)
        setAnnouncement({ id: 'page.items.habit.archived', title: habit.title })
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
      {announcement ? (
        <p
          role="status"
          className="rounded-xl border border-border/70 bg-muted/55 px-4 py-3 text-sm text-muted-foreground"
        >
          {intl.formatMessage({ id: announcement.id }, { habit: announcement.title })}
        </p>
      ) : null}
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
        onClose={() => setSelectedHabitId(null)}
        onOpenDetail={openDetail}
        onArchive={archiveHabit}
      />
      {detailHabit && detailSelection ? (
        <HabitDetail
          key={`${detailHabit.id}:${detailSelection.tab}:${detailSelection.dangerAction ?? ''}`}
          habit={detailHabit}
          categories={categoriesQuery.data ?? []}
          initialTab={detailSelection.tab}
          initialDangerAction={detailSelection.dangerAction}
          today={today}
          onClose={() => setDetailSelection(null)}
          onArchived={archiveHabit}
          onDeleted={(habit) => {
            setDetailSelection(null)
            setAnnouncement({ id: 'page.items.habit.deleted', title: habit.title })
          }}
        />
      ) : null}
    </>
  )
}
