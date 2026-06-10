import { getHabitAmountInputMetadata, type Habit } from '@/domain/habits'
import { isMeasurableHabit, type TodayItem } from '@/domain/today'
import {
  useRemoveHabitLogMutation,
  useUpsertHabitLogMutation,
} from '@/features/habits/hooks/useHabitLogMutations'
import { useCompleteRecurrentOccurrenceMutation } from '@/features/recurrent-tasks/hooks/useRecurrentTaskMutations'
import { useCompleteTaskMutation } from '@/features/tasks/hooks/useTaskMutations'
import { useAppToast } from '@/shared/hooks/useAppToast'
import type { ISODateString } from '@/shared/types'

type UseTodayCompletionActionsInput = {
  selectedDate: ISODateString
  completionEnabled: boolean
  openAmountInput: (habitId: string) => void
}

export const useTodayCompletionActions = (input: UseTodayCompletionActionsInput) => {
  const { selectedDate, completionEnabled, openAmountInput } = input
  const appToast = useAppToast()
  const upsertHabitLogMutation = useUpsertHabitLogMutation()
  const removeHabitLogMutation = useRemoveHabitLogMutation()
  const completeTaskMutation = useCompleteTaskMutation()
  const completeRecurrentMutation = useCompleteRecurrentOccurrenceMutation()

  const upsertHabitCompleted = (habit: Habit, completionLevel?: 'minimum' | 'standard') => {
    upsertHabitLogMutation.mutate({
      habitId: habit.id,
      logDate: selectedDate,
      status: 'completed',
      completionLevel,
    })
  }

  const skipHabit = (habit: Habit) => {
    upsertHabitLogMutation.mutate({
      habitId: habit.id,
      logDate: selectedDate,
      status: 'skipped',
    })
  }

  const clearHabitLog = (habit: Habit) => {
    removeHabitLogMutation.mutate({ habitId: habit.id, logDate: selectedDate })
  }

  const toggleTask = (item: Extract<TodayItem, { type: 'task' }>) => {
    const nextStatus = item.task.completionStatus === 'completed' ? 'pending' : 'completed'
    completeTaskMutation.mutate(
      { taskId: item.task.id, status: nextStatus },
      {
        onSuccess: () => {
          appToast.success({
            id:
              nextStatus === 'completed'
                ? 'page.today.toast.task.completed'
                : 'page.today.toast.task.pending',
            values: { task: item.task.title },
          })
        },
      },
    )
  }

  const toggleRecurrentTask = (item: Extract<TodayItem, { type: 'recurrentTask' }>) => {
    const nextStatus = item.occurrence.status === 'completed' ? 'pending' : 'completed'
    completeRecurrentMutation.mutate(
      {
        recurrentTaskId: item.task.id,
        occurrenceDate: selectedDate,
        status: nextStatus,
      },
      {
        onSuccess: () => {
          appToast.success({
            id:
              nextStatus === 'completed'
                ? 'page.today.toast.recurrent.completed'
                : 'page.today.toast.recurrent.pending',
          })
        },
      },
    )
  }

  const runPrimaryAction = (item: TodayItem) => {
    if (!completionEnabled) {
      return
    }

    if (item.type === 'habit') {
      if (isMeasurableHabit(item.habit)) {
        openAmountInput(item.habit.id)
        return
      }

      if (item.log?.status === 'completed') {
        clearHabitLog(item.habit)
      } else {
        upsertHabitCompleted(item.habit, 'standard')
      }
      return
    }

    if (item.type === 'task') {
      toggleTask(item)
      return
    }

    toggleRecurrentTask(item)
  }

  const saveHabitAmount = (habit: Habit, amount: number, onSuccess: () => void) => {
    const metadata = getHabitAmountInputMetadata(habit)
    if (!metadata) {
      return
    }
    if (amount <= 0) {
      removeHabitLogMutation.mutate({ habitId: habit.id, logDate: selectedDate }, { onSuccess })
      return
    }
    upsertHabitLogMutation.mutate(
      {
        habitId: habit.id,
        logDate: selectedDate,
        status: 'completed',
        value: amount,
        unit: metadata.unit,
      },
      { onSuccess },
    )
  }

  return {
    clearHabitLog,
    isHabitAmountPending: upsertHabitLogMutation.isPending || removeHabitLogMutation.isPending,
    runPrimaryAction,
    saveHabitAmount,
    skipHabit,
    toggleRecurrentTask,
    toggleTask,
    upsertHabitCompleted,
  }
}
