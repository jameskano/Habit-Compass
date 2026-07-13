import { useMemo, useState } from 'react'

import type { LimitedItemKind } from '@/domain/subscriptions'
import { canUseItemKind, getItemLimitCounts, getItemLimitState } from '@/domain/subscriptions'
import { useHabitsQuery } from '@/features/habits/hooks/useHabitsQuery'
import { useRecurrentTasksQuery } from '@/features/recurrent-tasks/hooks/useRecurrentTasksQuery'
import { useSubscriptionSnapshotQuery } from '@/features/settings/useSubscriptionSnapshotQuery'
import { useTasksQuery } from '@/features/tasks/hooks/useTasksQuery'

export type ItemLimitAction = 'create' | 'restore'

export type ItemLimitDialogState = {
  action: ItemLimitAction
  kind: LimitedItemKind
}

export const useItemLimitGate = () => {
  const habitsQuery = useHabitsQuery()
  const tasksQuery = useTasksQuery()
  const recurrentTasksQuery = useRecurrentTasksQuery()
  const subscriptionQuery = useSubscriptionSnapshotQuery()
  const [dialogState, setDialogState] = useState<ItemLimitDialogState | null>(null)
  const isPremium = subscriptionQuery.data?.hasActiveEntitlement === true
  const loading =
    habitsQuery.isLoading ||
    tasksQuery.isLoading ||
    recurrentTasksQuery.isLoading ||
    subscriptionQuery.isLoading

  const counts = useMemo(
    () =>
      getItemLimitCounts({
        habits: habitsQuery.data ?? [],
        recurrentTasks: recurrentTasksQuery.data ?? [],
        tasks: tasksQuery.data ?? [],
      }),
    [habitsQuery.data, recurrentTasksQuery.data, tasksQuery.data],
  )

  const getLimitState = (kind: LimitedItemKind) => getItemLimitState({ counts, isPremium, kind })

  const canUse = (kind: LimitedItemKind) => loading || canUseItemKind(getLimitState(kind))

  const openLimitDialog = (kind: LimitedItemKind, action: ItemLimitAction = 'create') => {
    setDialogState({ action, kind })
  }

  const closeLimitDialog = () => setDialogState(null)

  return {
    canUse,
    closeLimitDialog,
    counts,
    dialogState,
    getLimitState,
    isPremium,
    loading,
    openLimitDialog,
  }
}
