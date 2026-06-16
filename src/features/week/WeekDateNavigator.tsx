import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useIntl } from 'react-intl'

import { getWeekDates, shiftWeek, type WeekStartsOn } from '@/domain/planning'
import type { ISODateString } from '@/shared/types'
import { Button } from '@/shared/ui/button'

import { formatWeekRange } from './week.utils'

type WeekDateNavigatorProps = {
  selectedWeekStart: ISODateString
  weekStartsOn: WeekStartsOn
  onWeekChange: (date: ISODateString) => void
  onOpenDatePicker: () => void
}

export const WeekDateNavigator = ({
  selectedWeekStart,
  weekStartsOn,
  onWeekChange,
  onOpenDatePicker,
}: WeekDateNavigatorProps) => {
  const intl = useIntl()
  const weekDates = getWeekDates(selectedWeekStart, weekStartsOn)

  return (
    <div className="flex flex-col gap-3 rounded-[1.35rem] border border-border/70 bg-card/65 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full min-w-0 items-center gap-2 sm:flex-1">
        <Button
          type="button"
          variant="ghost"
          className="size-10 shrink-0 rounded-full border border-border/70 p-0 text-muted-foreground"
          aria-label={intl.formatMessage({ id: 'page.week.action.previousWeek' })}
          onClick={() => onWeekChange(shiftWeek(selectedWeekStart, -1))}
        >
          <ChevronLeft aria-hidden="true" size={18} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-auto min-w-0 flex-1 justify-start rounded-2xl border border-transparent px-3 py-2 text-left hover:border-border/70 hover:bg-background/60"
          onClick={onOpenDatePicker}
        >
          <span className="min-w-0">
            <span className="block text-base font-semibold leading-snug">
              {intl.formatMessage(
                { id: 'page.week.heading.range' },
                { range: formatWeekRange(intl, weekDates) },
              )}
            </span>
            <span className="block text-xs text-muted-foreground">
              {intl.formatMessage({ id: 'page.week.heading.helper' })}
            </span>
          </span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="size-10 shrink-0 rounded-full border border-border/70 p-0 text-muted-foreground"
          aria-label={intl.formatMessage({ id: 'page.week.action.nextWeek' })}
          onClick={() => onWeekChange(shiftWeek(selectedWeekStart, 1))}
        >
          <ChevronRight aria-hidden="true" size={18} />
        </Button>
      </div>
    </div>
  )
}
