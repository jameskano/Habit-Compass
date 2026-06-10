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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { useShellTitle } from '@/shared/ui/useShellTitle'

import { HabitsTab } from './habits/HabitsTab'
import { RecurrentTasksTab } from './recurrent-tasks/RecurrentTasksTab'
import { TasksTab } from './tasks/TasksTab'

const itemTabs = [
  { key: 'habits', labelId: 'page.items.tab.habits' },
  { key: 'tasks', labelId: 'page.items.tab.tasks' },
  { key: 'recurrent', labelId: 'page.items.tab.recurrent' },
] as const

type ItemTabKey = (typeof itemTabs)[number]['key']

export const ItemsPage = () => {
  const intl = useIntl()
  const [activeTab, setActiveTab] = useState<ItemTabKey>('habits')
  const [showingArchived, setShowingArchived] = useState(false)
  const habitsQuery = useHabitsQuery()
  const tasksQuery = useTasksQuery()
  const recurrentTasksQuery = useRecurrentTasksQuery()
  const activeTabConfig = itemTabs.find((tab) => tab.key === activeTab) ?? itemTabs[0]
  useShellTitle(`page.items.section.${activeTab}`)

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

    if (activeTab === 'habits') {
      return (
        <HabitsTab
          habits={visibleItems as Habit[]}
          showingArchived={showingArchived}
          onToggleArchive={() => setShowingArchived((current) => !current)}
        />
      )
    }

    if (activeTab === 'tasks') {
      return (
        <TasksTab
          tasks={visibleItems as Task[]}
          showingArchived={showingArchived}
          onToggleArchive={() => setShowingArchived((current) => !current)}
        />
      )
    }

    return (
      <RecurrentTasksTab
        tasks={visibleItems as RecurrentTask[]}
        showingArchived={showingArchived}
        onToggleArchive={() => setShowingArchived((current) => !current)}
      />
    )
  }

  return (
    <section>
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as ItemTabKey)
          setShowingArchived(false)
        }}
      >
        <TabsList
          className="flex gap-2 overflow-x-auto pb-4 border-b border-border/60"
          aria-label={intl.formatMessage({ id: 'page.items.tabs.aria' })}
        >
          {itemTabs.map((tab) => (
            <TabsTrigger
              key={tab.key}
              id={`items-tab-${tab.key}`}
              value={tab.key}
              className={cn(
                'shrink-0 rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
              )}
            >
              <FormattedMessage id={tab.labelId} />
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent
          id={`items-panel-${activeTabConfig.key}`}
          value={activeTabConfig.key}
          aria-labelledby={`items-tab-${activeTabConfig.key}`}
        >
          {renderCards()}
        </TabsContent>
      </Tabs>
    </section>
  )
}
