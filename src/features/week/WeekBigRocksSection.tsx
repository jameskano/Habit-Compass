import { Plus, X } from 'lucide-react'
import { useIntl } from 'react-intl'

import type { Category } from '@/domain/categories'
import type { Habit } from '@/domain/habits'
import { canAddWeeklyBigRock, MAX_WEEKLY_BIG_ROCKS, type WeeklyPlan } from '@/domain/planning'
import type { ISODateString } from '@/shared/types'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'

import { WeekHabitSelectorSheet } from './WeekHabitSelectorSheet'
import { buildCategoryMap } from './week.utils'

type WeekBigRocksSectionProps = {
  categories: Category[]
  habits: Habit[]
  pending: boolean
  plan: WeeklyPlan | null
  selectorOpen: boolean
  selectedHabits: Habit[]
  selectedWeekStart: ISODateString
  onAddBigRock: (input: { weekStartDate: ISODateString; habitId: string }) => void
  onRemoveBigRock: (input: {
    weekStartDate: ISODateString
    weeklyPlanId: string
    habitId: string
  }) => void
  onSelectorOpenChange: (open: boolean) => void
}

export const WeekBigRocksSection = ({
  categories,
  habits,
  pending,
  plan,
  selectorOpen,
  selectedHabits,
  selectedWeekStart,
  onAddBigRock,
  onRemoveBigRock,
  onSelectorOpenChange,
}: WeekBigRocksSectionProps) => {
  const intl = useIntl()
  const categoriesById = buildCategoryMap(categories)
  const selectedHabitIds = new Set(selectedHabits.map((habit) => habit.id))
  const canAdd = canAddWeeklyBigRock(selectedHabits.length)

  return (
    <>
      <Card className="rounded-2xl border-border/70 bg-card/85 p-4">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">
              {intl.formatMessage({ id: 'page.week.bigRocks.title' })}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {intl.formatMessage(
                { id: 'page.week.bigRocks.helper' },
                { count: MAX_WEEKLY_BIG_ROCKS },
              )}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="h-10 rounded-full border border-border/70 px-3"
            disabled={!canAdd || pending}
            onClick={() => onSelectorOpenChange(true)}
          >
            <Plus aria-hidden="true" size={17} />
            <span className="ml-1.5">{intl.formatMessage({ id: 'page.week.bigRocks.add' })}</span>
          </Button>
        </div>

        {selectedHabits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/75 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
            {intl.formatMessage({ id: 'page.week.bigRocks.empty' })}
          </div>
        ) : (
          <div className="space-y-2">
            {selectedHabits.map((habit) => {
              const category = habit.categoryId ? categoriesById.get(habit.categoryId) : null
              const categoryName =
                category?.name ?? intl.formatMessage({ id: 'page.items.habit.category.none' })

              return (
                <div
                  key={habit.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/55 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{habit.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {intl.formatMessage(
                        { id: 'page.week.bigRocks.rowMeta' },
                        { category: categoryName },
                      )}
                    </p>
                  </div>
                  {plan ? (
                    <Button
                      type="button"
                      variant="ghost"
                      className="size-9 shrink-0 rounded-full border border-border/70 p-0"
                      disabled={pending}
                      aria-label={intl.formatMessage(
                        { id: 'page.week.bigRocks.remove' },
                        { habit: habit.title },
                      )}
                      onClick={() =>
                        onRemoveBigRock({
                          weekStartDate: selectedWeekStart,
                          weeklyPlanId: plan.id,
                          habitId: habit.id,
                        })
                      }
                    >
                      <X aria-hidden="true" size={16} />
                    </Button>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}

        {!canAdd ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {intl.formatMessage({ id: 'page.week.bigRocks.limit' })}
          </p>
        ) : null}
      </Card>

      <WeekHabitSelectorSheet
        categories={categories}
        habits={habits}
        open={selectorOpen}
        pending={pending}
        selectedHabitIds={selectedHabitIds}
        onClose={() => onSelectorOpenChange(false)}
        onSelectHabit={(habit) => {
          onAddBigRock({ weekStartDate: selectedWeekStart, habitId: habit.id })
          onSelectorOpenChange(false)
        }}
      />
    </>
  )
}
