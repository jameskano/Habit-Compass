import { X } from 'lucide-react'
import { useIntl } from 'react-intl'

import type { Category } from '@/domain/categories'
import type { Habit } from '@/domain/habits'
import { Button } from '@/shared/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui/sheet'

import { buildCategoryMap, formatHabitFrequencyForWeek } from './week.utils'

type WeekHabitSelectorSheetProps = {
  categories: Category[]
  habits: Habit[]
  open: boolean
  pending: boolean
  selectedHabitIds: Set<string>
  onClose: () => void
  onSelectHabit: (habit: Habit) => void
}

export const WeekHabitSelectorSheet = ({
  categories,
  habits,
  open,
  pending,
  selectedHabitIds,
  onClose,
  onSelectHabit,
}: WeekHabitSelectorSheetProps) => {
  const intl = useIntl()
  const categoriesById = buildCategoryMap(categories)
  const availableHabits = habits.filter(
    (habit) => habit.lifecycleStatus === 'active' && !selectedHabitIds.has(habit.id),
  )

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : null)}>
      <SheetContent
        aria-label={intl.formatMessage({ id: 'page.week.bigRocks.selectorTitle' })}
        aria-describedby={undefined}
        className="max-h-[88vh] overflow-y-auto"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <SheetTitle className="text-xl font-semibold">
              {intl.formatMessage({ id: 'page.week.bigRocks.selectorTitle' })}
            </SheetTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {intl.formatMessage({ id: 'page.week.bigRocks.selectorDescription' })}
            </p>
          </div>
          <Button
            variant="ghost"
            type="button"
            className="h-10 w-10 rounded-full border border-border/70 p-0"
            aria-label={intl.formatMessage({ id: 'action.close' })}
            onClick={onClose}
          >
            <X aria-hidden="true" size={18} />
          </Button>
        </div>

        {availableHabits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/75 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
            {intl.formatMessage({ id: 'page.week.bigRocks.selectorEmpty' })}
          </div>
        ) : (
          <div className="space-y-2">
            {availableHabits.map((habit) => {
              const category = habit.categoryId ? categoriesById.get(habit.categoryId) : null
              const categoryName =
                category?.name ?? intl.formatMessage({ id: 'page.items.habit.category.none' })
              const frequency = formatHabitFrequencyForWeek(intl, habit)

              return (
                <button
                  key={habit.id}
                  type="button"
                  disabled={pending}
                  className="w-full rounded-2xl border border-border/70 bg-card/80 p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => onSelectHabit(habit)}
                >
                  <span className="block text-sm font-semibold text-foreground">{habit.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {intl.formatMessage(
                      { id: 'page.week.bigRocks.selectorMeta' },
                      { category: categoryName, frequency },
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
