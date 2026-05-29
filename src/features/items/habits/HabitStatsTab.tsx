import { parseISO } from 'date-fns'
import { useState } from 'react'
import { useIntl } from 'react-intl'

import {
  calculateHabitDetailStats,
  createHabitCompletionBars,
  type Habit,
  type HabitChartPeriod,
  type HabitLog,
} from '@/domain/habits'
import type { ISODateString } from '@/shared/types'
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs'

type HabitStatsTabProps = {
  habit: Habit
  logs: HabitLog[]
  today: ISODateString
}

const periods: HabitChartPeriod[] = ['week', 'month', 'year']

export function HabitStatsTab({ habit, logs, today }: HabitStatsTabProps) {
  const intl = useIntl()
  const [chartPeriod, setChartPeriod] = useState<HabitChartPeriod>('week')
  const summary = calculateHabitDetailStats({ habit, logs, today })
  const bars = createHabitCompletionBars({ logs, period: chartPeriod, today, startsOn: habit.startsOn })
  const maxValue = Math.max(...bars.map((bar) => bar.completionEvents), 1)
  const shortDate = new Intl.DateTimeFormat(intl.locale, {
    month: 'short',
    day: 'numeric',
  })
  const month = new Intl.DateTimeFormat(intl.locale, { month: 'short' })
  const year = new Intl.DateTimeFormat(intl.locale, { year: 'numeric' })

  const labelForBar = (from: ISODateString) =>
    chartPeriod === 'week'
      ? shortDate.format(parseISO(from))
      : chartPeriod === 'month'
        ? month.format(parseISO(from))
        : year.format(parseISO(from))

  const statTiles = [
    { id: 'page.items.habit.stats.thisWeek', value: summary.completionsThisWeek },
    { id: 'page.items.habit.stats.thisMonth', value: summary.completionsThisMonth },
    { id: 'page.items.habit.stats.thisYear', value: summary.completionsThisYear },
    { id: 'page.items.habit.stats.total', value: summary.totalCompletions },
  ]

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-[14rem_1fr]">
        <div className="flex flex-col items-center justify-center rounded-[1.4rem] border border-border/70 bg-card/90 p-5">
          <div
            className="grid h-36 w-36 place-items-center rounded-full"
            style={{
              background: `conic-gradient(hsl(var(--primary)) ${summary.completionPercentage}%, hsl(var(--muted)) 0)`,
            }}
          >
            <div className="grid h-[7.2rem] w-[7.2rem] place-items-center rounded-full bg-card">
              <div className="text-center">
                <p className="text-3xl font-semibold">{summary.completionPercentage}%</p>
                <p className="text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                  {intl.formatMessage({ id: 'page.items.habit.stat.completion' })}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {statTiles.map(({ id, value }) => (
            <div key={id} className="rounded-2xl border border-border/65 bg-card/90 p-4">
              <p className="text-2xl font-semibold">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{intl.formatMessage({ id })}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="space-y-4 rounded-[1.4rem] border border-border/70 bg-card/90 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold">{intl.formatMessage({ id: 'page.items.habit.stats.chartTitle' })}</h3>
          <Tabs value={chartPeriod} onValueChange={(value) => setChartPeriod(value as HabitChartPeriod)}>
          <TabsList className="flex rounded-full border border-border/70 bg-muted/35 p-1" aria-label={intl.formatMessage({ id: 'page.items.habit.stats.periods' })}>
            {periods.map((period) => (
              <TabsTrigger
                key={period}
                value={period}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                {intl.formatMessage({ id: `page.items.habit.stats.period.${period}` })}
              </TabsTrigger>
            ))}
          </TabsList>
          </Tabs>
        </div>
        <div className="flex min-h-44 items-end gap-2 overflow-x-auto pb-1" aria-label={intl.formatMessage({ id: 'page.items.habit.stats.chartAria' })}>
          {bars.map((bar) => (
            <div key={bar.from} className="flex min-w-9 flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">{bar.completionEvents}</span>
              <span
                className="w-full rounded-t-lg bg-primary/75"
                style={{ height: `${Math.max((bar.completionEvents / maxValue) * 96, 5)}px` }}
                title={`${labelForBar(bar.from)}: ${bar.completionEvents}`}
              />
              <span className="text-[0.62rem] text-muted-foreground">{labelForBar(bar.from)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
