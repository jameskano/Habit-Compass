import { BarChart3, Check, Edit3, Eraser, RotateCcw, SkipForward, Undo2 } from 'lucide-react'

import {
  isMeasurableHabit,
  type HabitTodayState,
  type TodayDateMode,
  type TodayItem,
} from '@/domain/today'
import type { HabitDangerAction } from '@/features/items/habits/HabitConfirmationDialog'

import type { TodayMenuAction } from './TodayActionSheet'
import type { TodayCompletionActions, TodayOpenHabitDetail } from './today.types'

type UseTodayMenuActionsInput = {
  dateMode: TodayDateMode
  closeMenu: () => void
  completionActions: TodayCompletionActions
  openAmountInput: (habitId: string) => void
  openHabitDetail: TodayOpenHabitDetail
  requestHabitDangerAction: (
    habit: Extract<TodayItem, { type: 'habit' }>['habit'],
    action: HabitDangerAction,
  ) => void
  openTaskEdit: (taskId: string) => void
  openRecurrentTaskEdit: (taskId: string) => void
}

export const useTodayMenuActions = (input: UseTodayMenuActionsInput) => {
  const {
    dateMode,
    closeMenu,
    completionActions,
    openAmountInput,
    openHabitDetail,
    requestHabitDangerAction,
    openTaskEdit,
    openRecurrentTaskEdit,
  } = input

  const menuActionsForItem = (item: TodayItem | null): TodayMenuAction[] => {
    if (!item) {
      return []
    }

    const run = (action: () => void) => () => {
      closeMenu()
      action()
    }

    if (item.type === 'habit') {
      const habit = item.habit
      const isFuture = dateMode === 'future'
      const minimumEnabled = habit.enabledCompletionLevels.includes('minimum')
      const nonCompletionActions: TodayMenuAction[] = [
        {
          labelId: 'page.items.habit.menu.stats',
          icon: BarChart3,
          dividerBefore: !isFuture,
          onSelect: () => openHabitDetail(habit, 'stats'),
        },
        {
          labelId: 'page.items.habit.menu.edit',
          icon: Edit3,
          onSelect: () => openHabitDetail(habit, 'edit'),
        },
        {
          labelId: 'page.items.habit.menu.reset',
          icon: RotateCcw,
          onSelect: () => requestHabitDangerAction(habit, 'reset'),
        },
      ]

      if (isFuture) {
        return nonCompletionActions
      }

      const state = item.state as HabitTodayState
      if (isMeasurableHabit(habit)) {
        const measurableActions =
          state === 'skipped'
            ? [
                {
                  labelId: 'page.today.menu.habit.enterAmount',
                  icon: Check,
                  onSelect: run(() => openAmountInput(habit.id)),
                },
                {
                  labelId: 'page.today.menu.habit.undoSkip',
                  icon: Undo2,
                  onSelect: run(() => completionActions.clearHabitLog(habit)),
                },
              ]
            : state === 'undone'
              ? [
                  {
                    labelId: 'page.today.menu.habit.enterAmount',
                    icon: Check,
                    onSelect: run(() => openAmountInput(habit.id)),
                  },
                  {
                    labelId: 'page.today.menu.habit.skip',
                    icon: SkipForward,
                    onSelect: run(() => completionActions.skipHabit(habit)),
                  },
                ]
              : [
                  {
                    labelId: 'page.today.menu.habit.editAmount',
                    icon: Edit3,
                    onSelect: run(() => openAmountInput(habit.id)),
                  },
                  {
                    labelId: 'page.today.menu.habit.clearAmount',
                    icon: Eraser,
                    onSelect: run(() => completionActions.clearHabitLog(habit)),
                  },
                  {
                    labelId: 'page.today.menu.habit.skip',
                    icon: SkipForward,
                    onSelect: run(() => completionActions.skipHabit(habit)),
                  },
                ]

        return [...measurableActions, ...nonCompletionActions]
      }

      const completeStandard = {
        labelId:
          state === 'minimumCompleted'
            ? 'page.today.menu.habit.completeStandard'
            : 'page.today.menu.habit.complete',
        icon: Check,
        onSelect: run(() => completionActions.upsertHabitCompleted(habit, 'standard')),
      }
      const completeMinimum = {
        labelId: 'page.today.menu.habit.completeMinimum',
        icon: Check,
        onSelect: run(() => completionActions.upsertHabitCompleted(habit, 'minimum')),
      }
      const undoCompletion = {
        labelId: 'page.today.menu.habit.undoCompletion',
        icon: Undo2,
        onSelect: run(() => completionActions.clearHabitLog(habit)),
      }
      const skip = {
        labelId: 'page.today.menu.habit.skip',
        icon: SkipForward,
        onSelect: run(() => completionActions.skipHabit(habit)),
      }
      const undoSkip = {
        labelId: 'page.today.menu.habit.undoSkip',
        icon: Undo2,
        onSelect: run(() => completionActions.clearHabitLog(habit)),
      }

      if (state === 'standardCompleted') {
        return [
          undoCompletion,
          ...(minimumEnabled ? [completeMinimum] : []),
          skip,
          ...nonCompletionActions,
        ]
      }
      if (state === 'minimumCompleted') {
        return [completeStandard, undoCompletion, skip, ...nonCompletionActions]
      }
      if (state === 'skipped') {
        return [
          completeStandard,
          ...(minimumEnabled ? [completeMinimum] : []),
          undoSkip,
          ...nonCompletionActions,
        ]
      }
      return [
        completeStandard,
        ...(minimumEnabled ? [completeMinimum] : []),
        skip,
        ...nonCompletionActions,
      ]
    }

    const isDone =
      item.type === 'task'
        ? item.task.completionStatus === 'completed'
        : item.occurrence.status === 'completed'
    const editAction = {
      labelId: 'page.today.menu.item.edit',
      icon: Edit3,
      dividerBefore: dateMode !== 'future',
      onSelect: run(() => {
        if (item.type === 'task') {
          openTaskEdit(item.task.id)
        } else {
          openRecurrentTaskEdit(item.task.id)
        }
      }),
    }

    if (dateMode === 'future') {
      return [editAction]
    }

    return [
      {
        labelId: isDone ? 'page.today.menu.item.markPending' : 'page.today.menu.item.markDone',
        icon: isDone ? Undo2 : Check,
        onSelect: run(() => {
          if (item.type === 'task') {
            completionActions.toggleTask(item)
          } else {
            completionActions.toggleRecurrentTask(item)
          }
        }),
      },
      editAction,
    ]
  }

  return { menuActionsForItem }
}
