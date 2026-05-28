import { formatISO } from 'date-fns'
import { useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import {
  deriveRecurrentOccurrences,
  type DerivedRecurrentOccurrence,
  type RecurrentTask,
} from '@/domain/recurrent-tasks'
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery'
import {
  useCompleteRecurrentOccurrenceMutation,
  useReorderRecurrentTasksMutation,
} from '@/features/recurrent-tasks/hooks/useRecurrentTaskMutations'
import { useRecurrentTaskOccurrencesQuery } from '@/features/recurrent-tasks/hooks/useRecurrentTaskOccurrencesQuery'
import type { ISODateString } from '@/shared/types'
import { EmptyState } from '@/shared/ui/EmptyState'

import { ItemsFilterRow } from '../components/ItemsFilterRow'
import { SortableItemsList } from '../components/SortableItemsList'
import { RecurrentTaskCard } from './RecurrentTaskCard'
import { RecurrentTaskEdit } from './RecurrentTaskEdit'

type RecurrentTasksTabProps = {
  tasks: RecurrentTask[]
  showingArchived: boolean
  onToggleArchive: () => void
}

type Announcement = {
  id: string
  title: string
}

const priorityRank = { low: 0, medium: 1, high: 2 } as const

function todayAsISODate() {
  return formatISO(new Date(), { representation: 'date' }) as ISODateString
}

function currentOccurrence(occurrences: ReturnType<typeof deriveRecurrentOccurrences>) {
  const actionable = occurrences.find((occurrence) => occurrence.actionable)
  return actionable ?? occurrences.at(-1)
}

export function RecurrentTasksTab({
  tasks,
  showingArchived,
  onToggleArchive,
}: RecurrentTasksTabProps) {
  const intl = useIntl()
  const today = todayAsISODate()
  const from = tasks.reduce(
    (earliest, task) => (task.startsOn < earliest ? task.startsOn : earliest),
    today,
  )
  const categoriesQuery = useCategoriesQuery()
  const occurrencesQuery = useRecurrentTaskOccurrencesQuery({ from, to: today })
  const completionMutation = useCompleteRecurrentOccurrenceMutation()
  const reorderMutation = useReorderRecurrentTasksMutation()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null
  const normalizedSearch = searchText.trim().toLowerCase()
  const hasFilters = normalizedSearch.length > 0 || categoryId.length > 0

  const orderedTasks = useMemo(
    () =>
      [...tasks].sort((left, right) => {
        const order = left.order - right.order
        if (order !== 0) {
          return order
        }
        const priority = priorityRank[right.priority] - priorityRank[left.priority]
        if (priority !== 0) {
          return priority
        }
        return left.startsOn.localeCompare(right.startsOn)
      }),
    [tasks],
  )

  const displayTasks = useMemo(() => {
    const stored = occurrencesQuery.data ?? []
    return orderedTasks
      .filter(
        (task) =>
          task.title.toLowerCase().includes(normalizedSearch) &&
          (!categoryId || task.categoryId === categoryId),
      )
      .map((task) => {
        const derived = deriveRecurrentOccurrences({
          task,
          storedOccurrences: stored.filter((occurrence) => occurrence.recurrentTaskId === task.id),
          from: task.startsOn,
          to: today,
          today,
        })
        return { id: task.id, title: task.title, task, occurrence: currentOccurrence(derived) }
      })
  }, [categoryId, normalizedSearch, occurrencesQuery.data, orderedTasks, today])

  if (categoriesQuery.isLoading || occurrencesQuery.isLoading) {
    return <EmptyState titleId="shared.loading.title" descriptionId="shared.loading.description" />
  }

  if (categoriesQuery.isError || occurrencesQuery.isError) {
    return <EmptyState titleId="shared.error.title" descriptionId="shared.error.description" />
  }

  const categoriesById = new Map((categoriesQuery.data ?? []).map((category) => [category.id, category]))

  const completeOccurrence = (
    task: RecurrentTask,
    occurrence: DerivedRecurrentOccurrence | undefined,
  ) => {
    if (!occurrence?.actionable) {
      return
    }

    completionMutation.mutate(
      { recurrentTaskId: task.id, occurrenceDate: occurrence.scheduledForDate },
      {
        onSuccess: () =>
          setAnnouncement({ id: 'page.items.recurrent.completed', title: task.title }),
      },
    )
  }

  const reorderRecurrentTasks = (visibleTaskIds: string[]) => {
    const visibleIds = new Set(visibleTaskIds)
    let visibleIndex = 0
    const orderedRecurrentTaskIds = orderedTasks.map((task) =>
      visibleIds.has(task.id) ? visibleTaskIds[visibleIndex++] : task.id,
    )

    reorderMutation.mutate(orderedRecurrentTaskIds)
  }

  return (
    <>
      <ItemsFilterRow
        categories={categoriesQuery.data ?? []}
        categoryId={categoryId}
        categoryLabelId="page.items.recurrent.filter.category"
        allCategoriesLabelId="page.items.recurrent.filter.allCategories"
        searchLabelId="page.items.recurrent.filter.search"
        searchPlaceholderId="page.items.recurrent.filter.searchPlaceholder"
        tabLabelId="page.items.tab.recurrent"
        searchText={searchText}
        showingArchived={showingArchived}
        onCategoryChange={setCategoryId}
        onSearchChange={setSearchText}
        onToggleArchive={onToggleArchive}
      />
      {announcement ? (
        <p role="status" className="rounded-xl border border-border/70 bg-muted/55 px-4 py-3 text-sm text-muted-foreground">
          {intl.formatMessage({ id: announcement.id }, { task: announcement.title })}
        </p>
      ) : null}
      {displayTasks.length === 0 ? (
        <EmptyState
          titleId={
            hasFilters
              ? 'page.items.recurrent.empty.filteredTitle'
              : showingArchived
                ? 'page.items.recurrent.empty.archivedTitle'
                : 'page.items.recurrent.empty.activeTitle'
          }
          descriptionId={
            hasFilters
              ? 'page.items.recurrent.empty.filteredDescription'
              : showingArchived
                ? 'page.items.recurrent.empty.archivedDescription'
                : 'page.items.recurrent.empty.activeDescription'
          }
        />
      ) : (
        <SortableItemsList
          items={displayTasks}
          group="recurrent-tasks"
          reorderLabelId="page.items.recurrent.action.reorder"
          onReorder={reorderRecurrentTasks}
        >
          {({ task, occurrence }) => (
            <RecurrentTaskCard
              task={task}
              category={task.categoryId ? categoriesById.get(task.categoryId) : undefined}
              occurrence={occurrence}
              today={today}
              archived={showingArchived}
              onEdit={() => setSelectedTaskId(task.id)}
              onComplete={() => completeOccurrence(task, occurrence)}
            />
          )}
        </SortableItemsList>
      )}
      {selectedTask ? (
        <RecurrentTaskEdit
          task={selectedTask}
          categories={categoriesQuery.data ?? []}
          onClose={() => setSelectedTaskId(null)}
          onArchived={(task) => {
            setSelectedTaskId(null)
            setAnnouncement({ id: 'page.items.recurrent.archived', title: task.title })
          }}
          onDeleted={(task) => {
            setSelectedTaskId(null)
            setAnnouncement({ id: 'page.items.recurrent.deleted', title: task.title })
          }}
        />
      ) : null}
    </>
  )
}
