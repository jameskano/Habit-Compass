import { useMemo } from 'react'
import { useIntl } from 'react-intl'

import type { Category } from '@/domain/categories'
import type { Habit } from '@/domain/habits'
import { groupBigRockHabitsByLifeArea } from '@/domain/planning'
import { Card } from '@/shared/ui/card'

type WeekLifeAreasSectionProps = {
  categories: Category[]
  habits: Habit[]
}

export const WeekLifeAreasSection = ({ categories, habits }: WeekLifeAreasSectionProps) => {
  const intl = useIntl()
  const groups = useMemo(
    () =>
      groupBigRockHabitsByLifeArea({
        habits,
        categories,
        uncategorizedLabel: intl.formatMessage({ id: 'page.items.habit.category.none' }),
      }),
    [categories, habits, intl],
  )

  return (
    <Card className="rounded-2xl border-border/70 bg-card/85 p-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold">
          {intl.formatMessage({ id: 'page.week.lifeAreas.title' })}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {intl.formatMessage({ id: 'page.week.lifeAreas.helper' })}
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/75 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
          {intl.formatMessage({ id: 'page.week.lifeAreas.empty' })}
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <section
              key={group.id}
              className="rounded-2xl border border-border/65 bg-background/55 p-3"
            >
              <h3 className="text-sm font-semibold">{group.name}</h3>
              <ul className="mt-2 space-y-1.5">
                {group.habits.map((habit) => (
                  <li key={habit.id} className="text-sm text-muted-foreground">
                    {habit.title}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </Card>
  )
}
