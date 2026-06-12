import { Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { FormattedMessage } from 'react-intl'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import { getWeekDates, getWeekStart, toISODate } from '@/domain/planning'
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery'
import { useHabitLogsRangeQuery } from '@/features/habits/hooks/useHabitLogsRangeQuery'
import { useHabitsQuery } from '@/features/habits/hooks/useHabitsQuery'
import type { ISODateString } from '@/shared/types'
import { EmptyState } from '@/shared/ui/EmptyState'

import { WeekBigRocksSection } from './WeekBigRocksSection'
import { WeekDateNavigator } from './WeekDateNavigator'
import { WeekFocusSection } from './WeekFocusSection'
import { WeekLifeAreasSection } from './WeekLifeAreasSection'
import { WeeklyMapSection } from './WeeklyMapSection'
import { WeeklyReviewSection } from './WeeklyReviewSection'
import { useWeekShellActions } from './useWeekShellActions'
import { useWeeklyBigRocksQuery, useWeeklyPlanQuery } from './useWeeklyPlanQuery'
import { useWeeklyPlanMutations } from './useWeeklyPlanMutations'

const emptyHabits: NonNullable<ReturnType<typeof useHabitsQuery>['data']> = []
const emptyCategories: NonNullable<ReturnType<typeof useCategoriesQuery>['data']> = []
const emptyBigRocks: NonNullable<ReturnType<typeof useWeeklyBigRocksQuery>['data']> = []
const emptyHabitLogs: NonNullable<ReturnType<typeof useHabitLogsRangeQuery>['data']> = []

export const WeekPage = () => {
  const weeklyPlanningEnabled = useAppPreferencesStore(
    (state) => state.featureToggles.weeklyPlanning,
  )
  const weekStartsOn = useAppPreferencesStore((state) => state.weekStartsOn)
  const today = toISODate(new Date())
  const currentWeekStart = getWeekStart(today, weekStartsOn)
  const [selectedWeekStart, setSelectedWeekStart] = useState<ISODateString>(currentWeekStart)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const weekDates = getWeekDates(selectedWeekStart, weekStartsOn)

  useEffect(() => {
    setSelectedWeekStart((current) => getWeekStart(current, weekStartsOn))
  }, [weekStartsOn])

  useWeekShellActions({
    currentWeekStart,
    selectedWeekStart,
    datePickerOpen,
    weekStartsOn,
    setDatePickerOpen,
    setSelectedWeekStart,
  })

  const weeklyPlanQuery = useWeeklyPlanQuery(selectedWeekStart)
  const weeklyBigRocksQuery = useWeeklyBigRocksQuery(weeklyPlanQuery.data?.id ?? null)
  const habitsQuery = useHabitsQuery()
  const categoriesQuery = useCategoriesQuery()
  const habitLogsQuery = useHabitLogsRangeQuery({
    from: weekDates[0],
    to: weekDates[weekDates.length - 1],
  })
  const mutations = useWeeklyPlanMutations()

  const habits = habitsQuery.data ?? emptyHabits
  const categories = categoriesQuery.data ?? emptyCategories
  const bigRocks = weeklyBigRocksQuery.data ?? emptyBigRocks
  const selectedBigRockHabits = useMemo(
    () =>
      bigRocks
        .map((bigRock) => habits.find((habit) => habit.id === bigRock.habitId))
        .filter((habit): habit is NonNullable<typeof habit> => Boolean(habit)),
    [bigRocks, habits],
  )

  const isLoading =
    weeklyPlanQuery.isLoading ||
    weeklyBigRocksQuery.isLoading ||
    habitsQuery.isLoading ||
    categoriesQuery.isLoading ||
    habitLogsQuery.isLoading
  const isError =
    weeklyPlanQuery.isError ||
    weeklyBigRocksQuery.isError ||
    habitsQuery.isError ||
    categoriesQuery.isError ||
    habitLogsQuery.isError
  const planningPending =
    mutations.saveFocus.isPending ||
    mutations.saveReview.isPending ||
    mutations.addBigRock.isPending ||
    mutations.removeBigRock.isPending

  if (!weeklyPlanningEnabled) {
    return (
      <section className="space-y-6">
        <EmptyState
          titleId="page.week.disabled.title"
          descriptionId="page.week.disabled.description"
          action={
            <Link
              to="/settings"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
            >
              <FormattedMessage id="page.week.disabled.action" />
            </Link>
          }
        />
      </section>
    )
  }

  if (isLoading) {
    return (
      <section className="space-y-6">
        <EmptyState titleId="shared.loading.title" descriptionId="shared.loading.description" />
      </section>
    )
  }

  if (isError) {
    return (
      <section className="space-y-6">
        <EmptyState titleId="shared.error.title" descriptionId="shared.error.description" />
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <WeekDateNavigator
        selectedWeekStart={selectedWeekStart}
        weekStartsOn={weekStartsOn}
        onWeekChange={setSelectedWeekStart}
        onOpenDatePicker={() => setDatePickerOpen(true)}
      />

      <WeekFocusSection
        plan={weeklyPlanQuery.data ?? null}
        selectedWeekStart={selectedWeekStart}
        pending={mutations.saveFocus.isPending}
        onSave={mutations.saveFocus.mutate}
      />

      <WeekBigRocksSection
        categories={categories}
        habits={habits}
        pending={planningPending}
        plan={weeklyPlanQuery.data ?? null}
        selectorOpen={selectorOpen}
        selectedHabits={selectedBigRockHabits}
        selectedWeekStart={selectedWeekStart}
        onAddBigRock={mutations.addBigRock.mutate}
        onRemoveBigRock={mutations.removeBigRock.mutate}
        onSelectorOpenChange={setSelectorOpen}
      />

      <WeeklyMapSection
        habits={selectedBigRockHabits}
        logs={habitLogsQuery.data ?? emptyHabitLogs}
        selectedWeekStart={selectedWeekStart}
        weekStartsOn={weekStartsOn}
        today={today}
        onAddBigRock={() => setSelectorOpen(true)}
      />

      <WeekLifeAreasSection categories={categories} habits={selectedBigRockHabits} />

      <WeeklyReviewSection
        plan={weeklyPlanQuery.data ?? null}
        pending={mutations.saveReview.isPending}
        selectedWeekStart={selectedWeekStart}
        onSave={mutations.saveReview.mutate}
      />
    </section>
  )
}
