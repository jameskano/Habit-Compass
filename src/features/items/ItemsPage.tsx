import { useState } from 'react'
import { FormattedMessage } from 'react-intl'

import type { Habit } from '@/domain/habits'
import type { Task } from '@/domain/tasks'
import { useHabitsQuery } from '@/features/habits/hooks/useHabitsQuery'
import { useTasksQuery } from '@/features/tasks/hooks/useTasksQuery'
import { mockData } from '@/integrations/mock/mockData'
import { cn } from '@/shared/utils/cn'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ItemCard } from '@/shared/ui/ItemCard'
import { PageHeader } from '@/shared/ui/PageHeader'

const itemTabs = [
  { key: 'habits', labelId: 'page.items.tab.habits' },
  { key: 'tasks', labelId: 'page.items.tab.tasks' },
  { key: 'recurrent', labelId: 'page.items.tab.recurrent' },
] as const

type ItemTabKey = (typeof itemTabs)[number]['key']
type ManagedItem = Habit | Task

function getCardTitle(item: ManagedItem) {
  return item.title
}

function getCardMeta(item: ManagedItem) {
  return item.notes ?? ''
}

export function ItemsPage() {
  const [activeTab, setActiveTab] = useState<ItemTabKey>('habits')
  const habitsQuery = useHabitsQuery()
  const tasksQuery = useTasksQuery()

  const renderCards = () => {
    if (habitsQuery.isLoading || tasksQuery.isLoading) {
      return (
        <EmptyState titleId="shared.loading.title" descriptionId="shared.loading.description" />
      )
    }

    if (habitsQuery.isError || tasksQuery.isError) {
      return <EmptyState titleId="shared.error.title" descriptionId="shared.error.description" />
    }

    if (activeTab === 'recurrent') {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          {mockData.recurrentPreviewItems.map((item) => (
            <ItemCard key={item.id} title={item.title} meta={item.meta} tone="neutral" />
          ))}
        </div>
      )
    }

    const items: ManagedItem[] = activeTab === 'habits' ? (habitsQuery.data ?? []) : (tasksQuery.data ?? [])

    if (items.length === 0) {
      return (
        <EmptyState titleId="page.items.empty.title" descriptionId="page.items.empty.description" />
      )
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <ItemCard
            key={item.id}
            title={getCardTitle(item)}
            meta={getCardMeta(item)}
            tone={
              activeTab === 'habits'
                ? 'habit'
                : activeTab === 'tasks'
                  ? 'task'
                  : 'neutral'
            }
          />
        ))}
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <PageHeader titleId="page.items.title" descriptionId="page.items.description" />

      <div className="flex flex-wrap gap-2">
        {itemTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            aria-pressed={activeTab === tab.key}
            className={cn(
              'rounded-full border border-border/70 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted',
              activeTab === tab.key && 'bg-primary text-primary-foreground',
            )}
          >
            <FormattedMessage id={tab.labelId} />
          </button>
        ))}
      </div>

      {renderCards()}
    </section>
  )
}
