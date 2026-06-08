import { parseISO } from 'date-fns'
import { FormattedMessage, useIntl } from 'react-intl'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import { getHabitFrequencySummary, type Habit, type HabitDayOfWeek } from '@/domain/habits'
import type { Task } from '@/domain/tasks'
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery'
import { useTodayHabitsQuery } from '@/features/habits/hooks/useTodayHabitsQuery'
import { useMoodLogForDateQuery } from '@/features/mood/hooks/useMoodLogForDateQuery'
import { useTodayTasksQuery } from '@/features/tasks/hooks/useTodayTasksQuery'
import { mockData } from '@/integrations/mock/mockData'
import type { ISODateString } from '@/shared/types'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ItemCard } from '@/shared/ui/ItemCard'
import { StatCard } from '@/shared/ui/StatCard'
import { SuggestionCard } from '@/shared/ui/SuggestionCard'

import { TodayItemCard } from './TodayItemCard'

type Intl = ReturnType<typeof useIntl>

function formatWeekdays(intl: Intl, days: readonly HabitDayOfWeek[]) {
  return intl.formatList(
    days.map((day) => intl.formatMessage({ id: `page.items.weekday.short.${day}` })),
  )
}

function formatHabitFrequency(intl: Intl, habit: Habit) {
  const descriptor = getHabitFrequencySummary(habit.scheduleRule)

  if (
    habit.scheduleRule.kind === 'flexiblePeriod' &&
    habit.goalConfig.trackingType === 'timesPerPeriod'
  ) {
    return intl.formatMessage(
      { id: 'items.frequency.timesPerPeriod' },
      {
        count: habit.goalConfig.targetCount,
        period: intl.formatMessage({ id: `items.period.${habit.goalConfig.period}` }),
      },
    )
  }

  if (habit.scheduleRule.kind === 'specificDaysOfWeek') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      { days: formatWeekdays(intl, habit.scheduleRule.daysOfWeek) },
    )
  }

  if (habit.scheduleRule.kind === 'everyXWeeks') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      {
        count: habit.scheduleRule.intervalWeeks,
        days: formatWeekdays(intl, habit.scheduleRule.daysOfWeek),
      },
    )
  }

  if (habit.scheduleRule.kind === 'firstWeekdayOfMonth') {
    return intl.formatMessage(
      { id: descriptor.messageId },
      {
        weekday: intl.formatMessage({
          id: `page.items.weekday.long.${habit.scheduleRule.weekday}`,
        }),
      },
    )
  }

  return intl.formatMessage({ id: descriptor.messageId }, descriptor.values)
}

function formatTaskDueDate(intl: Intl, task: Task, today: ISODateString) {
  if (!task.dueDate) {
    return intl.formatMessage({ id: 'page.items.task.date.none' })
  }

  const formattedDate = intl.formatDate(parseISO(task.dueDate), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
  })

  if (task.dueDate < today) {
    return intl.formatMessage({ id: 'page.items.task.date.overdue' }, { date: formattedDate })
  }
  if (task.dueDate === today) {
    return intl.formatMessage({ id: 'page.items.task.date.today' }, { date: formattedDate })
  }
  return intl.formatMessage({ id: 'page.items.task.date.upcoming' }, { date: formattedDate })
}

export function TodayPage() {
  const intl = useIntl()
  const featureToggles = useAppPreferencesStore((state) => state.featureToggles)
  const habitsQuery = useTodayHabitsQuery()
  const tasksQuery = useTodayTasksQuery()
  const moodQuery = useMoodLogForDateQuery()
  const categoriesQuery = useCategoriesQuery()

  if (
    habitsQuery.isLoading ||
    tasksQuery.isLoading ||
    moodQuery.isLoading ||
    categoriesQuery.isLoading
  ) {
    return (
      <section className="space-y-6">
        <EmptyState titleId="shared.loading.title" descriptionId="shared.loading.description" />
      </section>
    )
  }

  if (habitsQuery.isError || tasksQuery.isError || moodQuery.isError || categoriesQuery.isError) {
    return (
      <section className="space-y-6">
        <EmptyState titleId="shared.error.title" descriptionId="shared.error.description" />
      </section>
    )
  }

  const todayHabits = habitsQuery.data?.habits ?? []
  const todayTasks = tasksQuery.data?.tasks ?? []
  const habitsCompletedCount = habitsQuery.data?.completedCount ?? 0
  const tasksCompletedCount = tasksQuery.data?.completedCount ?? 0
  const completionCompleted = habitsCompletedCount + tasksCompletedCount
  const completionTotal = todayHabits.length + todayTasks.length
  const completionPercentage =
    completionTotal > 0 ? Math.round((completionCompleted / completionTotal) * 100) : 0
  const leadHabit = todayHabits[0]
  const leadTask = todayTasks[0]
  const todayHabitLogs = habitsQuery.data?.logs ?? []
  const todayMood = moodQuery.data
  const categoriesById = new Map(
    (categoriesQuery.data ?? []).map((category) => [category.id, category]),
  )

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          labelId="page.today.stat.completed"
          value={`${completionPercentage}%`}
          detailId="page.today.stat.completedDetail"
        />
        <StatCard
          labelId="page.today.stat.habits"
          value={`${habitsCompletedCount}/${todayHabits.length}`}
          detailId="page.today.stat.habitsDetail"
        />
        <StatCard
          labelId="page.today.stat.tasks"
          value={`${tasksCompletedCount}/${todayTasks.length}`}
          detailId="page.today.stat.tasksDetail"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              {intl.formatMessage({ id: 'page.today.greeting' }, { name: 'Ari' })}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              <FormattedMessage id="page.today.summary" />
            </p>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            {leadHabit ? (
              <TodayItemCard
                title={leadHabit.title}
                meta={formatHabitFrequency(intl, leadHabit)}
                category={
                  leadHabit.categoryId ? categoriesById.get(leadHabit.categoryId) : undefined
                }
                fallbackCategoryLabel={intl.formatMessage({
                  id: 'page.items.habit.category.none',
                })}
                priority={leadHabit.priority}
                priorityLabel={`${intl.formatMessage({ id: 'page.items.habit.edit.priority' })}: ${intl.formatMessage({ id: `page.items.priority.${leadHabit.priority}` })}`}
                completed={todayHabitLogs.some(
                  (log) => log.habitId === leadHabit.id && log.status === 'completed',
                )}
              />
            ) : (
              <EmptyState
                titleId="page.items.empty.title"
                descriptionId="page.items.empty.description"
              />
            )}

            {leadTask ? (
              <TodayItemCard
                title={leadTask.title}
                meta={formatTaskDueDate(intl, leadTask, mockData.today)}
                category={leadTask.categoryId ? categoriesById.get(leadTask.categoryId) : undefined}
                fallbackCategoryLabel={intl.formatMessage({
                  id: 'page.items.task.category.none',
                })}
                priority={leadTask.priority}
                priorityLabel={`${intl.formatMessage({ id: 'page.items.task.edit.priority' })}: ${intl.formatMessage({ id: `page.items.priority.${leadTask.priority}` })}`}
                completed={leadTask.completionStatus === 'completed'}
              />
            ) : (
              <EmptyState
                titleId="page.items.empty.title"
                descriptionId="page.items.empty.description"
              />
            )}
          </div>

          {featureToggles.suggestions ? (
            <SuggestionCard
              titleId="page.today.suggestion.title"
              descriptionId="page.today.suggestion.description"
              actionId="page.today.suggestion.action"
            />
          ) : null}
        </div>

        <div className="space-y-4">
          {featureToggles.mood ? (
            <ItemCard
              titleId="page.today.moodPrompt.title"
              meta={
                todayMood
                  ? `${todayMood.mood} - ${todayMood.loggedForDate}`
                  : intl.formatMessage({ id: 'page.today.moodPrompt.meta' })
              }
              tone="neutral"
            />
          ) : null}

          <ItemCard
            titleId="page.today.simpleMode.title"
            metaId="page.today.simpleMode.meta"
            tone="neutral"
          />
        </div>
      </div>
    </section>
  )
}
