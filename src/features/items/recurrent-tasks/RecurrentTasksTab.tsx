import { formatISO } from 'date-fns'
import { useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import {
  deriveRecurrentOccurrences,
  type DerivedRecurrentOccurrence,
  type RecurrentTask,
} from '@/domain/recurrent-tasks'
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery'
import { useCompleteRecurrentOccurrenceMutation } from '@/features/recurrent-tasks/hooks/useRecurrentTaskMutations'
import { useRecurrentTaskOccurrencesQuery } from '@/features/recurrent-tasks/hooks/useRecurrentTaskOccurrencesQuery'
import type { ISODateString } from '@/shared/types'
import { EmptyState } from '@/shared/ui/EmptyState'

import { ItemsFilterRow } from '../components/ItemsFilterRow'
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
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null
  const normalizedSearch = searchText.trim().toLowerCase()
  const hasFilters = normalizedSearch.length > 0 || categoryId.length > 0

  const displayTasks = useMemo(() => {
    const stored = occurrencesQuery.data ?? []
    return tasks
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
        return { task, occurrence: currentOccurrence(derived) }
      })
      .sort((left, right) => {
        const order = left.task.order - right.task.order
        if (order !== 0) {
          return order
        }
        const priority = priorityRank[right.task.priority] - priorityRank[left.task.priority]
        if (priority !== 0) {
          return priority
        }
        return (left.occurrence?.scheduledForDate ?? '').localeCompare(
          right.occurrence?.scheduledForDate ?? '',
        )
      })
  }, [categoryId, normalizedSearch, occurrencesQuery.data, tasks, today])

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
        <div className="grid gap-4 lg:grid-cols-2">
          {displayTasks.map(({ task, occurrence }) => (
            <RecurrentTaskCard
              key={task.id}
              task={task}
              category={task.categoryId ? categoriesById.get(task.categoryId) : undefined}
              occurrence={occurrence}
              today={today}
              archived={showingArchived}
              onEdit={() => setSelectedTaskId(task.id)}
              onComplete={() => completeOccurrence(task, occurrence)}
            />
          ))}
        </div>
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
