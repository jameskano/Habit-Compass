import { useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import type { Habit } from '@/domain/habits'
import type { RecurrentTask } from '@/domain/recurrent-tasks'
import type { Task } from '@/domain/tasks'
import { useHabitsQuery } from '@/features/habits/hooks/useHabitsQuery'
import { useRecurrentTasksQuery } from '@/features/recurrent-tasks/hooks/useRecurrentTasksQuery'
import { useTasksQuery } from '@/features/tasks/hooks/useTasksQuery'
import { cn } from '@/shared/utils/cn'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ItemCard } from '@/shared/ui/ItemCard'
import { PageHeader } from '@/shared/ui/PageHeader'

import { ItemsTabHeader } from './components/ItemsTabHeader'
import { HabitsTab } from './habits/HabitsTab'

const itemTabs = [
  { key: 'habits', labelId: 'page.items.tab.habits', titleId: 'page.items.section.habits' },
  { key: 'tasks', labelId: 'page.items.tab.tasks', titleId: 'page.items.section.tasks' },
  {
    key: 'recurrent',
    labelId: 'page.items.tab.recurrent',
    titleId: 'page.items.section.recurrent',
  },
] as const

type ItemTabKey = (typeof itemTabs)[number]['key']
type ManagedItem = Task | RecurrentTask

function getCardTitle(item: ManagedItem) {
  return item.title
}

function getCardMeta(item: ManagedItem) {
  return item.notes ?? ''
}

export function ItemsPage() {
  const intl = useIntl()
  const [activeTab, setActiveTab] = useState<ItemTabKey>('habits')
  const [showingArchived, setShowingArchived] = useState(false)
  const habitsQuery = useHabitsQuery()
  const tasksQuery = useTasksQuery()
  const recurrentTasksQuery = useRecurrentTasksQuery()
  const activeTabConfig = itemTabs.find((tab) => tab.key === activeTab) ?? itemTabs[0]

  const renderCards = () => {
    const activeQuery =
      activeTab === 'habits'
        ? habitsQuery
        : activeTab === 'tasks'
          ? tasksQuery
          : recurrentTasksQuery

    if (activeQuery.isLoading) {
      return (
        <EmptyState titleId="shared.loading.title" descriptionId="shared.loading.description" />
      )
    }

    if (activeQuery.isError) {
      return <EmptyState titleId="shared.error.title" descriptionId="shared.error.description" />
    }

    const items =
      activeTab === 'habits'
        ? (habitsQuery.data ?? [])
        : activeTab === 'tasks'
          ? (tasksQuery.data ?? [])
          : (recurrentTasksQuery.data ?? [])
    const visibleItems = items.filter(
      (item) => item.lifecycleStatus === (showingArchived ? 'archived' : 'active'),
    )

    if (visibleItems.length === 0) {
      return (
        <EmptyState
          titleId={showingArchived ? 'page.items.empty.archivedTitle' : 'page.items.empty.title'}
          descriptionId={
            showingArchived ? 'page.items.empty.archivedDescription' : 'page.items.empty.description'
          }
        />
      )
    }

    if (activeTab === 'habits') {
      return <HabitsTab habits={visibleItems as Habit[]} showingArchived={showingArchived} />
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {(visibleItems as ManagedItem[]).map((item) => (
          <ItemCard
            key={item.id}
            title={getCardTitle(item)}
            meta={getCardMeta(item)}
            tone={activeTab === 'tasks' ? 'task' : 'neutral'}
          />
        ))}
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <PageHeader titleId="page.items.title" descriptionId="page.items.description" />

      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label={intl.formatMessage({ id: 'page.items.tabs.aria' })}
      >
        {itemTabs.map((tab) => (
          <button
            key={tab.key}
            id={`items-tab-${tab.key}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`items-panel-${tab.key}`}
            onClick={() => {
              setActiveTab(tab.key)
              setShowingArchived(false)
            }}
            className={cn(
              'rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted',
              activeTab === tab.key && 'bg-primary text-primary-foreground',
            )}
          >
            <FormattedMessage id={tab.labelId} />
          </button>
        ))}
      </div>

      <section
        id={`items-panel-${activeTabConfig.key}`}
        className="space-y-4"
        role="tabpanel"
        aria-labelledby={`items-tab-${activeTabConfig.key}`}
      >
        <ItemsTabHeader
          titleId={activeTabConfig.titleId}
          showingArchived={showingArchived}
          onToggleArchive={() => setShowingArchived((current) => !current)}
        />
        {renderCards()}
      </section>
    </section>
  )
}
