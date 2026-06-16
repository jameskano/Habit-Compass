import { useIntl } from 'react-intl'

import { deriveHabitDayState, type Habit, type HabitLog } from '@/domain/habits'
import { getWeekDates, type WeekStartsOn } from '@/domain/planning'
import type { ISODateString } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { cn } from '@/shared/utils/cn'
import { habitDayStateClasses } from '@/styles/itemVisualTokens'

type WeeklyMapSectionProps = {
  habits: Habit[]
  logs: HabitLog[]
  selectedWeekStart: ISODateString
  weekStartsOn: WeekStartsOn
  today: ISODateString
  planningLocked: boolean
  onAddBigRock: () => void
}

export const WeeklyMapSection = ({
  habits,
  logs,
  selectedWeekStart,
  weekStartsOn,
  today,
  planningLocked,
  onAddBigRock,
}: WeeklyMapSectionProps) => {
  const intl = useIntl()
  const weekDates = getWeekDates(selectedWeekStart, weekStartsOn)

  const getUtcDate = (date: ISODateString) => new Date(`${date}T00:00:00.000Z`)

  return (
    <Card className="rounded-2xl border-border/70 bg-card/85 p-4">
      <div className="mb-4">
        <h2 className="text-base font-semibold">
          {intl.formatMessage({ id: 'page.week.map.title' })}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {intl.formatMessage({ id: 'page.week.map.helper' })}
        </p>
      </div>

      {habits.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/75 bg-muted/30 p-4">
          <p className="text-sm leading-6 text-muted-foreground">
            {intl.formatMessage({ id: 'page.week.map.empty' })}
          </p>
          {planningLocked ? null : (
            <Button type="button" className="mt-3 rounded-xl" onClick={onAddBigRock}>
              {intl.formatMessage({ id: 'page.week.bigRocks.add' })}
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto pb-1">
          <div className="min-w-[31rem] space-y-3">
            <div
              className="mr-2 grid grid-cols-[minmax(8rem,1fr)_repeat(7,2.35rem)] items-center gap-2"
              aria-label={intl.formatMessage({ id: 'page.week.map.weekdays' })}
            >
              <span aria-hidden="true" />
              {weekDates.map((date) => {
                const weekday = getUtcDate(date).getUTCDay()

                return (
                  <span
                    key={date}
                    className="text-center text-[0.66rem] font-semibold uppercase text-muted-foreground"
                  >
                    {intl.formatMessage({ id: `page.items.weekday.short.${weekday}` })}
                  </span>
                )
              })}
            </div>

            {habits.map((habit) => {
              const habitLogs = logs.filter((log) => log.habitId === habit.id)

              return (
                <div
                  key={habit.id}
                  className="grid grid-cols-[minmax(8rem,1fr)_repeat(7,2.35rem)] items-center gap-2 rounded-2xl border border-border/60 bg-background/50 p-2"
                >
                  <span className="truncate text-sm font-medium">{habit.title}</span>
                  {weekDates.map((date) => {
                    const state = deriveHabitDayState({ habit, logs: habitLogs, date, today })
                    const stateLabel = intl.formatMessage({
                      id: `page.items.habit.dayState.${state}`,
                    })
                    const parsedDate = getUtcDate(date)

                    return (
                      <span
                        key={date}
                        role="img"
                        aria-label={intl.formatMessage(
                          { id: 'page.week.map.cellLabel' },
                          { habit: habit.title, date, state: stateLabel },
                        )}
                        title={stateLabel}
                        className={cn(
                          'mx-auto flex aspect-square w-9 select-none items-center justify-center rounded-lg border text-[0.68rem] font-semibold',
                          habitDayStateClasses[state],
                        )}
                      >
                        {parsedDate.getUTCDate()}
                      </span>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Card>
  )
}
