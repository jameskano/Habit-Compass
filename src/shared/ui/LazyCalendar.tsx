import { lazy, Suspense } from 'react'
import type { DayPickerProps } from 'react-day-picker'

import { CalendarPendingState } from './LazyLoadingFallbacks'

const Calendar = lazy(() => import('./calendar').then((module) => ({ default: module.Calendar })))

export const LazyCalendar = (props: DayPickerProps) => (
  <Suspense fallback={<CalendarPendingState />}>
    <Calendar {...props} />
  </Suspense>
)
