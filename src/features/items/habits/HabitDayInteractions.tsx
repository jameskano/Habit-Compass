import { type ReactNode, useState } from 'react'

import {
  getHabitAmountInputMetadata,
  getHabitLogAmount,
  isHabitDayActionable,
  type Habit,
  type HabitCompletionLevel,
  type HabitLog,
} from '@/domain/habits'
import {
  useRemoveHabitLogMutation,
  useUpsertHabitLogMutation,
} from '@/features/habits/hooks/useHabitLogMutations'
import type { ISODateString } from '@/shared/types'

import { HabitAmountInputSheet } from './HabitAmountInputSheet'
import { HabitDayActionSheet, type HabitDaySheetAction } from './HabitDayActionSheet'

type HabitDayInteractionsRenderProps = {
  isDayDisabled: (date: ISODateString) => boolean
  onLongPressDay: (date: ISODateString) => void
  onTapDay: (date: ISODateString) => void
}

type HabitDayInteractionsProps = {
  children: (props: HabitDayInteractionsRenderProps) => ReactNode
  habit: Habit
  logs: HabitLog[]
  today: ISODateString
}

export const HabitDayInteractions = ({
  children,
  habit,
  logs,
  today,
}: HabitDayInteractionsProps) => {
  const [actionDate, setActionDate] = useState<ISODateString | null>(null)
  const [amountDate, setAmountDate] = useState<ISODateString | null>(null)
  const upsertMutation = useUpsertHabitLogMutation()
  const removeMutation = useRemoveHabitLogMutation()
  const amountMetadata = getHabitAmountInputMetadata(habit)
  const pending = upsertMutation.isPending || removeMutation.isPending

  const getLogForDate = (date: ISODateString) => logs.find((log) => log.loggedForDate === date)

  const isDayDisabled = (date: ISODateString) => !isHabitDayActionable({ habit, date, today })

  const upsertCompleted = (date: ISODateString, completionLevel?: HabitCompletionLevel) => {
    upsertMutation.mutate({
      habitId: habit.id,
      logDate: date,
      status: 'completed',
      completionLevel,
    })
  }

  const skipDay = (date: ISODateString) => {
    upsertMutation.mutate({
      habitId: habit.id,
      logDate: date,
      status: 'skipped',
    })
  }

  const clearLog = (date: ISODateString) => {
    removeMutation.mutate({ habitId: habit.id, logDate: date })
  }

  const onTapDay = (date: ISODateString) => {
    if (isDayDisabled(date)) {
      return
    }

    const log = getLogForDate(date)
    if (habit.goalConfig.trackingType === 'binary') {
      if (log) {
        clearLog(date)
      } else {
        upsertCompleted(date, 'standard')
      }
      return
    }

    if (habit.goalConfig.trackingType === 'timesPerPeriod') {
      if (log?.status === 'completed') {
        clearLog(date)
      } else {
        upsertCompleted(date, 'standard')
      }
      return
    }

    setAmountDate(date)
  }

  const actions: HabitDaySheetAction[] = (() => {
    if (!actionDate) {
      return []
    }

    const run = (action: () => void) => () => {
      setActionDate(null)
      action()
    }

    if (habit.goalConfig.trackingType === 'binary') {
      const minimumEnabled = habit.enabledCompletionLevels.includes('minimum')
      return [
        ...(minimumEnabled
          ? [
              {
                labelId: 'page.items.habit.dayAction.completeStandard',
                onSelect: run(() => upsertCompleted(actionDate, 'standard')),
              },
              {
                labelId: 'page.items.habit.dayAction.completeMinimum',
                onSelect: run(() => upsertCompleted(actionDate, 'minimum')),
              },
            ]
          : [
              {
                labelId: 'page.items.habit.dayAction.complete',
                onSelect: run(() => upsertCompleted(actionDate, 'standard')),
              },
            ]),
        {
          labelId: 'page.items.habit.dayAction.skip',
          onSelect: run(() => skipDay(actionDate)),
        },
        {
          labelId: 'page.items.habit.dayAction.undo',
          onSelect: run(() => clearLog(actionDate)),
        },
      ]
    }

    if (habit.goalConfig.trackingType === 'timesPerPeriod') {
      return [
        {
          labelId: 'page.items.habit.dayAction.complete',
          onSelect: run(() => upsertCompleted(actionDate, 'standard')),
        },
        {
          labelId: 'page.items.habit.dayAction.skip',
          onSelect: run(() => skipDay(actionDate)),
        },
        {
          labelId: 'page.items.habit.dayAction.clear',
          onSelect: run(() => clearLog(actionDate)),
        },
      ]
    }

    return [
      {
        labelId: 'page.items.habit.dayAction.inputAmount',
        onSelect: run(() => setAmountDate(actionDate)),
      },
      {
        labelId: 'page.items.habit.dayAction.skip',
        onSelect: run(() => skipDay(actionDate)),
      },
      {
        labelId: 'page.items.habit.dayAction.clear',
        onSelect: run(() => clearLog(actionDate)),
      },
    ]
  })()

  const amountLog = amountDate ? getLogForDate(amountDate) : null

  return (
    <>
      {children({
        isDayDisabled,
        onLongPressDay: (date) => {
          if (!isDayDisabled(date)) {
            setActionDate(date)
          }
        },
        onTapDay,
      })}
      <HabitDayActionSheet
        habit={habit}
        date={actionDate}
        actions={actions}
        pending={pending}
        onClose={() => setActionDate(null)}
      />
      {amountMetadata ? (
        <HabitAmountInputSheet
          habit={habit}
          date={amountDate}
          initialAmount={getHabitLogAmount(habit, amountLog)}
          metadata={amountMetadata}
          pending={pending}
          onClose={() => setAmountDate(null)}
          onSave={(amount) => {
            if (!amountDate) {
              return
            }
            if (amount === 0) {
              removeMutation.mutate(
                { habitId: habit.id, logDate: amountDate },
                { onSuccess: () => setAmountDate(null) },
              )
              return
            }
            upsertMutation.mutate(
              {
                habitId: habit.id,
                logDate: amountDate,
                status: 'completed',
                value: amount,
                unit: amountMetadata.unit,
              },
              { onSuccess: () => setAmountDate(null) },
            )
          }}
        />
      ) : null}
    </>
  )
}
