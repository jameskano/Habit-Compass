import { CalendarCheck, CalendarDays } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useIntl } from 'react-intl'

import {
  calendarDateToISODate,
  isoDateToCalendarDate,
} from '@/features/items/components/datePickerUtils'
import type { ISODateString } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover'
import { LazyCalendar } from '@/shared/ui/LazyCalendar'
import { useShellActions } from '@/shared/ui/useShellActions'
import { cn } from '@/shared/utils/cn'

type UseTodayShellActionsInput = {
  actualToday: ISODateString
  selectedDate: ISODateString
  datePickerOpen: boolean
  setDatePickerOpen: (open: boolean) => void
  setSelectedDate: (date: ISODateString) => void
}

export const useTodayShellActions = ({
  actualToday,
  selectedDate,
  datePickerOpen,
  setDatePickerOpen,
  setSelectedDate,
}: UseTodayShellActionsInput) => {
  const intl = useIntl()
  const selectCalendarDate = useCallback(
    (date: Date | undefined) => {
      if (!date) {
        return
      }
      setSelectedDate(calendarDateToISODate(date) as ISODateString)
      setDatePickerOpen(false)
    },
    [setDatePickerOpen, setSelectedDate],
  )

  const todayHeaderActions = useMemo(
    () => (
      <>
        {selectedDate !== actualToday ? (
          <Button
            type="button"
            variant="ghost"
            className="size-10 rounded-full border border-border/70 bg-card/90 p-0 text-foreground"
            aria-label={intl.formatMessage({ id: 'page.today.action.today' })}
            onClick={() => setSelectedDate(actualToday)}
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
              aria-label={intl.formatMessage({ id: 'page.today.action.chooseDate' })}
            >
              <CalendarDays aria-hidden="true" size={18} />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto">
            <LazyCalendar
              mode="single"
              selected={isoDateToCalendarDate(selectedDate)}
              defaultMonth={isoDateToCalendarDate(selectedDate)}
              onSelect={selectCalendarDate}
            />
          </PopoverContent>
        </Popover>
      </>
    ),
    [
      actualToday,
      datePickerOpen,
      intl,
      selectCalendarDate,
      selectedDate,
      setDatePickerOpen,
      setSelectedDate,
    ],
  )

  useShellActions(todayHeaderActions)
}
