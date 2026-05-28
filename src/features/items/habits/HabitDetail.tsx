import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useIntl } from 'react-intl'

import type { Category } from '@/domain/categories'
import type { Habit } from '@/domain/habits'
import { useArchiveHabitMutation } from '@/features/habits/hooks/useArchiveHabitMutation'
import {
  useDeleteHabitMutation,
  useResetHabitProgressMutation,
  useUpdateHabitMutation,
} from '@/features/habits/hooks/useHabitDetailMutations'
import { useHabitLogsRangeQuery } from '@/features/habits/hooks/useHabitLogsRangeQuery'
import type { ISODateString } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { cn } from '@/shared/utils/cn'

import { HabitCalendarTab } from './HabitCalendarTab'
import { HabitConfirmationDialog, type HabitDangerAction } from './HabitConfirmationDialog'
import { HabitEditTab } from './HabitEditTab'
import { HabitStatsTab } from './HabitStatsTab'

export type HabitDetailTab = 'calendar' | 'stats' | 'edit'

type HabitDetailProps = {
  habit: Habit
  categories: Category[]
  initialTab: HabitDetailTab
  initialDangerAction?: HabitDangerAction
  today: ISODateString
  onClose: () => void
  onArchived: (habit: Habit) => void
  onDeleted: (habit: Habit) => void
}

const detailTabs: HabitDetailTab[] = ['calendar', 'stats', 'edit']

export function HabitDetail({
  habit,
  categories,
  initialTab,
  initialDangerAction,
  today,
  onClose,
  onArchived,
  onDeleted,
}: HabitDetailProps) {
  const intl = useIntl()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [confirmation, setConfirmation] = useState<HabitDangerAction | null>(
    initialDangerAction ?? null,
  )
  const [noticeId, setNoticeId] = useState<string | null>(null)
  const logsQuery = useHabitLogsRangeQuery({ from: habit.startsOn, to: today })
  const updateMutation = useUpdateHabitMutation()
  const archiveMutation = useArchiveHabitMutation()
  const resetMutation = useResetHabitProgressMutation()
  const deleteMutation = useDeleteHabitMutation()
  const pending =
    updateMutation.isPending ||
    archiveMutation.isPending ||
    resetMutation.isPending ||
    deleteMutation.isPending

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !confirmation) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [confirmation, onClose])

  const confirmAction = () => {
    if (confirmation === 'reset') {
      resetMutation.mutate(habit.id, {
        onSuccess: () => {
          setConfirmation(null)
          setNoticeId('page.items.habit.detail.progressReset')
        },
      })
    } else if (confirmation === 'delete') {
      deleteMutation.mutate(habit.id, {
        onSuccess: () => onDeleted(habit),
      })
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex bg-foreground/30 backdrop-blur-sm md:items-center md:justify-center md:p-6" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={intl.formatMessage({ id: 'page.items.habit.detail.title' }, { habit: habit.title })}
        className="relative flex h-full w-full flex-col overflow-hidden bg-background shadow-2xl md:max-h-[min(92vh,54rem)] md:max-w-3xl md:rounded-[1.7rem] md:border md:border-border/75"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="border-b border-border/70 bg-card/70 px-4 pb-4 pt-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-semibold tracking-tight">{habit.title}</h2>
            <Button
              variant="ghost"
              className="h-10 w-10 rounded-full border border-border/70 p-0"
              aria-label={intl.formatMessage({ id: 'action.close' })}
              onClick={onClose}
            >
              <X aria-hidden="true" size={18} />
            </Button>
          </div>
          <div
            role="tablist"
            aria-label={intl.formatMessage({ id: 'page.items.habit.detail.tabs' })}
            className="mt-5 flex rounded-full border border-border/70 bg-muted/40 p-1"
          >
            {detailTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`habit-detail-panel-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors',
                  activeTab === tab && 'bg-card text-foreground shadow-sm',
                )}
              >
                {intl.formatMessage({ id: `page.items.habit.detail.tab.${tab}` })}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {noticeId ? (
            <p role="status" className="mb-4 rounded-xl border border-border/70 bg-muted/55 px-4 py-3 text-sm text-muted-foreground">
              {intl.formatMessage({ id: noticeId })}
            </p>
          ) : null}
          {logsQuery.isLoading ? (
            <EmptyState titleId="shared.loading.title" descriptionId="shared.loading.description" />
          ) : logsQuery.isError ? (
            <EmptyState titleId="shared.error.title" descriptionId="shared.error.description" />
          ) : (
            <div
              id={`habit-detail-panel-${activeTab}`}
              role="tabpanel"
              aria-label={intl.formatMessage({ id: `page.items.habit.detail.tab.${activeTab}` })}
            >
              {activeTab === 'calendar' ? (
                <HabitCalendarTab habit={habit} logs={logsQuery.data ?? []} today={today} />
              ) : activeTab === 'stats' ? (
                <HabitStatsTab habit={habit} logs={logsQuery.data ?? []} today={today} />
              ) : (
                <HabitEditTab
                  habit={habit}
                  categories={categories}
                  archived={habit.lifecycleStatus === 'archived'}
                  pending={pending}
                  onSave={(input) =>
                    updateMutation.mutate(input, {
                      onSuccess: () => setNoticeId('page.items.habit.detail.saved'),
                    })
                  }
                  onArchive={() =>
                    archiveMutation.mutate(habit.id, {
                      onSuccess: () => onArchived(habit),
                    })
                  }
                  onRequestDangerAction={setConfirmation}
                />
              )}
            </div>
          )}
        </div>

        <HabitConfirmationDialog
          habit={habit}
          action={confirmation}
          pending={pending}
          onCancel={() => setConfirmation(null)}
          onConfirm={confirmAction}
        />
      </section>
    </div>
  )
}
