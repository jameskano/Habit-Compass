import { formatISO, parseISO, subDays } from 'date-fns'
import { useMemo, useState } from 'react'
import { useIntl } from 'react-intl'

import type { Habit } from '@/domain/habits'
import { useCategoriesQuery } from '@/features/categories/hooks/useCategoriesQuery'
import { useArchiveHabitMutation } from '@/features/habits/hooks/useArchiveHabitMutation'
import { useHabitLogsRangeQuery } from '@/features/habits/hooks/useHabitLogsRangeQuery'
import type { ISODateString } from '@/shared/types'
import { EmptyState } from '@/shared/ui/EmptyState'

import { HabitCard } from './HabitCard'
import { HabitDetail, type HabitDetailTab } from './HabitDetail'
import type { HabitDangerAction } from './HabitConfirmationDialog'
import { HabitOptionsSheet } from './HabitOptionsSheet'

type HabitsTabProps = {
  habits: Habit[]
  showingArchived: boolean
}

type Announcement = {
  id: string
  title: string
}

type DetailSelection = {
  habitId: string
  tab: HabitDetailTab
  dangerAction?: HabitDangerAction
}

function asISODate(value: Date) {
  return formatISO(value, { representation: 'date' }) as ISODateString
}

export function HabitsTab({ habits, showingArchived }: HabitsTabProps) {
  const intl = useIntl()
  const today = asISODate(new Date())
  const dates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        asISODate(subDays(parseISO(today), 6 - index)),
      ),
    [today],
  )
  const from = dates[0]
  const categoriesQuery = useCategoriesQuery()
  const logsQuery = useHabitLogsRangeQuery({ from, to: today })
  const archiveMutation = useArchiveHabitMutation()
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)
  const [detailSelection, setDetailSelection] = useState<DetailSelection | null>(null)
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const selectedHabit = habits.find((habit) => habit.id === selectedHabitId) ?? null
  const detailHabit =
    habits.find((habit) => habit.id === detailSelection?.habitId) ?? null

  if (logsQuery.isLoading) {
    return <EmptyState titleId="shared.loading.title" descriptionId="shared.loading.description" />
  }

  if (logsQuery.isError) {
    return <EmptyState titleId="shared.error.title" descriptionId="shared.error.description" />
  }

  const categoriesById = new Map((categoriesQuery.data ?? []).map((category) => [category.id, category]))
  const orderedHabits = [...habits].sort((left, right) => left.order - right.order)

  const openDetail = (
    habit: Habit,
    tab: HabitDetailTab,
    dangerAction?: HabitDangerAction,
  ) => {
    setSelectedHabitId(null)
    setDetailSelection({ habitId: habit.id, tab, dangerAction })
  }

  const archiveHabit = (habit: Habit) => {
    archiveMutation.mutate(habit.id, {
      onSuccess: () => {
        setSelectedHabitId(null)
        setDetailSelection(null)
        setAnnouncement({ id: 'page.items.habit.archived', title: habit.title })
      },
    })
  }

  return (
    <>
      {announcement ? (
        <p
          role="status"
          className="rounded-xl border border-border/70 bg-muted/55 px-4 py-3 text-sm text-muted-foreground"
        >
          {intl.formatMessage({ id: announcement.id }, { habit: announcement.title })}
        </p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {orderedHabits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            category={habit.categoryId ? categoriesById.get(habit.categoryId) : undefined}
            logs={(logsQuery.data ?? []).filter((log) => log.habitId === habit.id)}
            dates={dates}
            from={from}
            today={today}
            archived={showingArchived}
            onOpenOptions={() => setSelectedHabitId(habit.id)}
            onOpenCalendar={() => openDetail(habit, 'calendar')}
            onSwipeEdit={() => openDetail(habit, 'edit')}
            onSwipeArchive={() => archiveHabit(habit)}
          />
        ))}
      </div>
      <HabitOptionsSheet
        habit={selectedHabit}
        archived={showingArchived}
        onClose={() => setSelectedHabitId(null)}
        onOpenDetail={openDetail}
        onArchive={archiveHabit}
      />
      {detailHabit && detailSelection ? (
        <HabitDetail
          key={`${detailHabit.id}:${detailSelection.tab}:${detailSelection.dangerAction ?? ''}`}
          habit={detailHabit}
          categories={categoriesQuery.data ?? []}
          initialTab={detailSelection.tab}
          initialDangerAction={detailSelection.dangerAction}
          today={today}
          onClose={() => setDetailSelection(null)}
          onArchived={archiveHabit}
          onDeleted={(habit) => {
            setDetailSelection(null)
            setAnnouncement({ id: 'page.items.habit.deleted', title: habit.title })
          }}
        />
      ) : null}
    </>
  )
}
