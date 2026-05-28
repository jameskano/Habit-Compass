import { formatISO } from 'date-fns'
import { useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import { sortTasks, type Task } from '@/domain/tasks'
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery'
import {
  useCompleteTaskMutation,
  useReorderTasksMutation,
} from '@/features/tasks/hooks/useTaskMutations'
import type { ISODateString } from '@/shared/types'
import { EmptyState } from '@/shared/ui/EmptyState'

import { ItemsFilterRow } from '../components/ItemsFilterRow'
import { SortableItemsList } from '../components/SortableItemsList'
import { TaskCard } from './TaskCard'
import { TaskEdit } from './TaskEdit'

type TasksTabProps = {
  tasks: Task[]
  showingArchived: boolean
  onToggleArchive: () => void
}

type Announcement = {
  id: string
  title: string
}

function todayAsISODate() {
  return formatISO(new Date(), { representation: 'date' }) as ISODateString
}

export function TasksTab({ tasks, showingArchived, onToggleArchive }: TasksTabProps) {
  const intl = useIntl()
  const today = todayAsISODate()
  const categoriesQuery = useCategoriesQuery()
  const completeMutation = useCompleteTaskMutation()
  const reorderMutation = useReorderTasksMutation()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
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

  if (categoriesQuery.isLoading) {
    return <EmptyState titleId="shared.loading.title" descriptionId="shared.loading.description" />
  }

  if (categoriesQuery.isError) {
    return <EmptyState titleId="shared.error.title" descriptionId="shared.error.description" />
  }

  const completeTask = (task: Task) => {
    completeMutation.mutate({ taskId: task.id }, {
      onSuccess: () =>
        setAnnouncement({ id: 'page.items.task.completed', title: task.title }),
    })
  }

  const reorderTasks = (visibleTaskIds: string[]) => {
    const visibleIds = new Set(visibleTaskIds)
    let visibleIndex = 0
    const orderedTaskIds = orderedTasks.map((task) =>
      visibleIds.has(task.id) ? visibleTaskIds[visibleIndex++] : task.id,
    )

    reorderMutation.mutate(orderedTaskIds)
  }

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
      {announcement ? (
        <p role="status" className="rounded-xl border border-border/70 bg-muted/55 px-4 py-3 text-sm text-muted-foreground">
          {intl.formatMessage({ id: announcement.id }, { task: announcement.title })}
        </p>
      ) : null}
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
        <SortableItemsList
          items={visibleTasks}
          group="tasks"
          reorderLabelId="page.items.task.action.reorder"
          onReorder={reorderTasks}
        >
          {(task) => (
            <TaskCard
              task={task}
              category={task.categoryId ? categoriesById.get(task.categoryId) : undefined}
              today={today}
              archived={showingArchived}
              onEdit={() => setSelectedTaskId(task.id)}
              onComplete={() => completeTask(task)}
            />
          )}
        </SortableItemsList>
      )}
      {selectedTask ? (
        <TaskEdit
          task={selectedTask}
          categories={categoriesQuery.data ?? []}
          onClose={() => setSelectedTaskId(null)}
          onArchived={(task) => {
            setSelectedTaskId(null)
            setAnnouncement({ id: 'page.items.task.archived', title: task.title })
          }}
          onDeleted={(task) => {
            setSelectedTaskId(null)
            setAnnouncement({ id: 'page.items.task.deleted', title: task.title })
          }}
        />
      ) : null}
    </>
  )
}
