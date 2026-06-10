import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, type DayPickerProps } from 'react-day-picker'

import { cn } from '@/shared/utils/cn'

const Calendar = ({ className, classNames, ...props }: DayPickerProps) => {
  return (
    <DayPicker
      showOutsideDays
      className={cn('p-1 text-sm', className)}
      classNames={{
        root: 'rdp-root',
        months: 'flex flex-col gap-4',
        month: 'flex flex-col gap-3',
        month_caption: 'relative flex items-center justify-center px-10',
        caption_label: 'text-sm font-semibold',
        nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
        button_previous:
          'inline-flex size-8 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:bg-muted',
        button_next:
          'inline-flex size-8 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:bg-muted',
        month_grid: 'w-full border-collapse',
        weekdays: 'grid grid-cols-7',
        weekday:
          'flex h-8 items-center justify-center text-[0.72rem] font-medium text-muted-foreground',
        week: 'grid grid-cols-7',
        day: 'p-0',
        day_button:
          'flex size-9 items-center justify-center rounded-full text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        outside: 'text-muted-foreground/45',
        disabled: 'pointer-events-none text-muted-foreground/35',
        selected:
          '[&_button]:bg-primary [&_button]:text-primary-foreground [&_button]:hover:bg-primary [&_button]:hover:text-primary-foreground',
        today: '[&_button]:border [&_button]:border-primary/65',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft aria-hidden="true" size={16} />
          ) : (
            <ChevronRight aria-hidden="true" size={16} />
          ),
        ...props.components,
      }}
      {...props}
    />
  )
}

export { Calendar }
