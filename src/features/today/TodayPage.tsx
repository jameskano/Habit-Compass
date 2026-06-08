import { FormattedMessage, useIntl } from 'react-intl'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import { useTodayHabitsQuery } from '@/features/habits/hooks/useTodayHabitsQuery'
import { useMoodLogForDateQuery } from '@/features/mood/hooks/useMoodLogForDateQuery'
import { useTodayTasksQuery } from '@/features/tasks/hooks/useTodayTasksQuery'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ItemCard } from '@/shared/ui/ItemCard'
import { StatCard } from '@/shared/ui/StatCard'
import { SuggestionCard } from '@/shared/ui/SuggestionCard'

export function TodayPage() {
  const intl = useIntl()
  const featureToggles = useAppPreferencesStore((state) => state.featureToggles)
  const habitsQuery = useTodayHabitsQuery()
  const tasksQuery = useTodayTasksQuery()
  const moodQuery = useMoodLogForDateQuery()

  if (habitsQuery.isLoading || tasksQuery.isLoading || moodQuery.isLoading) {
    return (
      <section className="space-y-6">
        <EmptyState titleId="shared.loading.title" descriptionId="shared.loading.description" />
      </section>
    )
  }

  if (habitsQuery.isError || tasksQuery.isError || moodQuery.isError) {
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
  const todayMood = moodQuery.data

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
              <ItemCard title={leadHabit.title} meta={leadHabit.notes ?? ''} tone="habit" />
            ) : (
              <EmptyState titleId="page.items.empty.title" descriptionId="page.items.empty.description" />
            )}

            {leadTask ? (
              <ItemCard title={leadTask.title} meta={leadTask.notes ?? ''} tone="task" />
            ) : (
              <EmptyState titleId="page.items.empty.title" descriptionId="page.items.empty.description" />
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
