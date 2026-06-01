import { formatISO, parseISO } from 'date-fns'
import { useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import { sortTasks, type Task } from '@/domain/tasks'
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery'
import { useCompleteTaskMutation } from '@/features/tasks/hooks/useTaskMutations'
import { useAppToast } from '@/shared/hooks/useAppToast'
import type { ISODateString } from '@/shared/types'
import { EmptyState } from '@/shared/ui/EmptyState'

import { ItemsFilterRow } from '../components/ItemsFilterRow'
import { ItemWaterfallReveal } from '../components/ItemWaterfallReveal'
import { useItemWaterfallReveal } from '../components/useItemWaterfallReveal'
import { TaskCard } from './TaskCard'
import { TaskEdit } from './TaskEdit'

type TasksTabProps = {
  tasks: Task[]
  showingArchived: boolean
  onToggleArchive: () => void
}

type TaskDateGroup = {
  key: string
  label: string
  tasks: Task[]
}

function todayAsISODate() {
  return formatISO(new Date(), { representation: 'date' }) as ISODateString
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setDate(date.getDate() + days)
  return nextDate
}

function formatDateHeader(
  intl: ReturnType<typeof useIntl>,
  date: ISODateString,
  today: ISODateString,
) {
  const tomorrow = formatISO(addDays(new Date(`${today}T00:00:00`), 1), {
    representation: 'date',
  })
  const formattedDate = intl.formatDate(parseISO(date), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
  })

  if (date < today) {
    return intl.formatMessage({ id: 'page.items.task.group.overdue' }, { date: formattedDate })
  }
  if (date === today) {
    return intl.formatMessage({ id: 'page.items.task.group.today' })
  }
  if (date === tomorrow) {
    return intl.formatMessage({ id: 'page.items.task.group.tomorrow' })
  }
  return formattedDate
}

function groupTasksByDate(
  tasks: readonly Task[],
  intl: ReturnType<typeof useIntl>,
  today: ISODateString,
): TaskDateGroup[] {
  const grouped = new Map<string, Task[]>()

  for (const task of tasks) {
    const key = task.dueDate ?? 'undated'
    grouped.set(key, [...(grouped.get(key) ?? []), task])
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => {
      if (left === 'undated') {
        return 1
      }
      if (right === 'undated') {
        return -1
      }
      return left.localeCompare(right)
    })
    .map(([key, groupTasks]) => ({
      key,
      label:
        key === 'undated'
          ? intl.formatMessage({ id: 'page.items.task.group.undated' })
          : formatDateHeader(intl, key as ISODateString, today),
      tasks: sortTasks(groupTasks),
    }))
}

export function TasksTab({ tasks, showingArchived, onToggleArchive }: TasksTabProps) {
  const intl = useIntl()
  const appToast = useAppToast()
  const today = todayAsISODate()
  const categoriesQuery = useCategoriesQuery()
  const completeMutation = useCompleteTaskMutation()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const revealCards = useItemWaterfallReveal(!categoriesQuery.isLoading)
  const hasFilters = searchText.trim().length > 0 || categoryId.length > 0
  const categoriesById = new Map(
    (categoriesQuery.data ?? []).map((category) => [category.id, category]),
  )
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null
  const orderedTasks = useMemo(() => sortTasks(tasks), [tasks])
  const visibleTasks = useMemo(
    () =>
      orderedTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(searchText.trim().toLowerCase()) &&
          (!categoryId || task.categoryId === categoryId),
      ),
    [categoryId, orderedTasks, searchText],
  )
  const taskGroups = useMemo(
    () => groupTasksByDate(visibleTasks, intl, today),
    [intl, today, visibleTasks],
  )

  if (categoriesQuery.isLoading) {
    return <EmptyState titleId="shared.loading.title" descriptionId="shared.loading.description" />
  }

  if (categoriesQuery.isError) {
    return <EmptyState titleId="shared.error.title" descriptionId="shared.error.description" />
  }

  const completeTask = (task: Task) => {
    completeMutation.mutate(
      { taskId: task.id },
      {
        onSuccess: () =>
          appToast.success({ id: 'page.items.task.completed', values: { task: task.title } }),
      },
    )
  }
  let waterfallIndex = 0

  return (
    <>
      <ItemsFilterRow
        categories={categoriesQuery.data ?? []}
        categoryId={categoryId}
        categoryLabelId="page.items.task.filter.category"
        allCategoriesLabelId="page.items.task.filter.allCategories"
        searchLabelId="page.items.task.filter.search"
        searchPlaceholderId="page.items.task.filter.searchPlaceholder"
        tabLabelId="page.items.tab.tasks"
        searchText={searchText}
        showingArchived={showingArchived}
        onCategoryChange={setCategoryId}
        onSearchChange={setSearchText}
        onToggleArchive={onToggleArchive}
      />
      {visibleTasks.length === 0 ? (
        <EmptyState
          titleId={
            hasFilters
              ? 'page.items.task.empty.filteredTitle'
              : showingArchived
                ? 'page.items.task.empty.archivedTitle'
                : 'page.items.task.empty.activeTitle'
          }
          descriptionId={
            hasFilters
              ? 'page.items.task.empty.filteredDescription'
              : showingArchived
                ? 'page.items.task.empty.archivedDescription'
                : 'page.items.task.empty.activeDescription'
          }
        />
      ) : (
        <div className="space-y-5">
          {taskGroups.map((group) => (
            <section key={group.key} className="space-y-3" aria-label={group.label}>
              <h3 className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {group.label}
              </h3>
              <div className="grid gap-4 lg:grid-cols-2">
                {group.tasks.map((task) => (
                  <ItemWaterfallReveal
                    key={task.id}
                    index={waterfallIndex++}
                    revealing={revealCards}
                  >
                    <TaskCard
                      task={task}
                      category={task.categoryId ? categoriesById.get(task.categoryId) : undefined}
                      archived={showingArchived}
                      onEdit={() => setSelectedTaskId(task.id)}
                      onComplete={() => completeTask(task)}
                    />
                  </ItemWaterfallReveal>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      {selectedTask ? (
        <TaskEdit
          task={selectedTask}
          categories={categoriesQuery.data ?? []}
          onClose={() => setSelectedTaskId(null)}
          onArchived={(task) => {
            setSelectedTaskId(null)
            appToast.success({ id: 'page.items.task.archived', values: { task: task.title } })
          }}
          onDeleted={(task) => {
            setSelectedTaskId(null)
            appToast.success({ id: 'page.items.task.deleted', values: { task: task.title } })
          }}
        />
      ) : null}
    </>
  )
}
