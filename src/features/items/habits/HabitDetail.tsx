import { X } from 'lucide-react'
import { useRef, useState } from 'react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'

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

const activeDetailTabs: HabitDetailTab[] = ['calendar', 'stats', 'edit']

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
  const initialDangerActionRef = useRef<HabitDangerAction | undefined>(initialDangerAction)
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
  const detailTabs =
    habit.lifecycleStatus === 'archived' ? activeDetailTabs.filter((tab) => tab !== 'edit') : activeDetailTabs

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
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !confirmation) {
          onClose()
        }
      }}
    >
      <DialogContent
        aria-modal="true"
        aria-label={intl.formatMessage({ id: 'page.items.habit.detail.title' }, { habit: habit.title })}
        aria-describedby={undefined}
        className="fixed inset-0 left-0 top-0 z-50 flex h-full w-full max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden rounded-none border-0 bg-background p-0 shadow-2xl md:left-1/2 md:top-1/2 md:max-h-[min(92vh,54rem)] md:max-w-3xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[1.7rem] md:border md:border-border/75"
      >
        <DialogHeader>
          <DialogTitle className="sr-only">
            {intl.formatMessage({ id: 'page.items.habit.detail.title' }, { habit: habit.title })}
          </DialogTitle>
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
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as HabitDetailTab)}>
            <TabsList
              aria-label={intl.formatMessage({ id: 'page.items.habit.detail.tabs' })}
              className="mt-5 flex rounded-full border border-border/70 bg-muted/40 p-1"
            >
              {detailTabs.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="flex-1 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  {intl.formatMessage({ id: `page.items.habit.detail.tab.${tab}` })}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </DialogHeader>

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
            <Tabs value={activeTab}>
              <TabsContent
                value={activeTab}
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
                  today={today}
                  archived={habit.lifecycleStatus === 'archived'}
                  pending={pending}
                  onSave={(input, options) =>
                    updateMutation.mutate(input, {
                      onSuccess: () => {
                        if (options?.archiveAfterSave) {
                          archiveMutation.mutate({ habitId: habit.id, date: today }, {
                            onSuccess: () => onArchived(habit),
                          })
                          return
                        }
                        setNoticeId('page.items.habit.detail.saved')
                      },
                    })
                  }
                  onArchive={() =>
                    archiveMutation.mutate({ habitId: habit.id, date: today }, {
                      onSuccess: () => onArchived(habit),
                    })
                  }
                  onRequestDangerAction={setConfirmation}
                />
              )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        <HabitConfirmationDialog
          habit={habit}
          action={confirmation}
          pending={pending}
          onCancel={() => {
            setConfirmation(null)
            if (initialDangerActionRef.current) {
              initialDangerActionRef.current = undefined
              onClose()
            }
          }}
          onConfirm={confirmAction}
        />
      </DialogContent>
    </Dialog>
  )
}
