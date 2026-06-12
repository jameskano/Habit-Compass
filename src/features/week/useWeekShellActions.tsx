import { CalendarCheck, CalendarDays } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useIntl } from 'react-intl'

import { getWeekStart, type WeekStartsOn } from '@/domain/planning'
import {
  calendarDateToISODate,
  isoDateToCalendarDate,
} from '@/features/items/components/datePickerUtils'
import type { ISODateString } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Calendar } from '@/shared/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { useShellActions } from '@/shared/ui/useShellActions'
import { cn } from '@/shared/utils/cn'

type UseWeekShellActionsInput = {
  currentWeekStart: ISODateString
  selectedWeekStart: ISODateString
  datePickerOpen: boolean
  weekStartsOn: WeekStartsOn
  setDatePickerOpen: (open: boolean) => void
  setSelectedWeekStart: (date: ISODateString) => void
}

export const useWeekShellActions = ({
  currentWeekStart,
  selectedWeekStart,
  datePickerOpen,
  weekStartsOn,
  setDatePickerOpen,
  setSelectedWeekStart,
}: UseWeekShellActionsInput) => {
  const intl = useIntl()
  const selectCalendarDate = useCallback(
    (date: Date | undefined) => {
      if (!date) {
        return
      }

      setSelectedWeekStart(getWeekStart(calendarDateToISODate(date) as ISODateString, weekStartsOn))
      setDatePickerOpen(false)
    },
    [setDatePickerOpen, setSelectedWeekStart, weekStartsOn],
  )

  const weekHeaderActions = useMemo(
    () => (
      <>
        {selectedWeekStart !== currentWeekStart ? (
          <Button
            type="button"
            variant="ghost"
            className="size-10 rounded-full border border-border/70 bg-card/90 p-0 text-foreground"
            aria-label={intl.formatMessage({ id: 'page.week.action.currentWeek' })}
            onClick={() => setSelectedWeekStart(currentWeekStart)}
          >
            <CalendarCheck aria-hidden="true" size={18} />
          </Button>
        ) : null}
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className={cn(
                'size-10 rounded-full border border-border/70 bg-card/90 p-0 text-foreground',
                datePickerOpen && 'border-primary bg-primary/15 text-primary',
              )}
              aria-label={intl.formatMessage({ id: 'page.week.action.chooseWeek' })}
            >
              <CalendarDays aria-hidden="true" size={18} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto">
            <Calendar
              mode="single"
              weekStartsOn={weekStartsOn}
              selected={isoDateToCalendarDate(selectedWeekStart)}
              defaultMonth={isoDateToCalendarDate(selectedWeekStart)}
              onSelect={selectCalendarDate}
            />
          </PopoverContent>
        </Popover>
      </>
    ),
    [
      currentWeekStart,
      datePickerOpen,
      intl,
      selectCalendarDate,
      selectedWeekStart,
      setDatePickerOpen,
      setSelectedWeekStart,
      weekStartsOn,
    ],
  )

  useShellActions(weekHeaderActions)
}
