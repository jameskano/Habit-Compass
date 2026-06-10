import { Link } from '@tanstack/react-router'
import { FormattedMessage } from 'react-intl'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import { mockAppShellData } from '@/shared/config/mockAppShellData'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ItemCard } from '@/shared/ui/ItemCard'
import { StatCard } from '@/shared/ui/StatCard'

export const WeekPage = () => {
  const weeklyPlanningEnabled = useAppPreferencesStore(
    (state) => state.featureToggles.weeklyPlanning,
  )

  return (
    <section className="space-y-6">
      {!weeklyPlanningEnabled ? (
        <EmptyState
          titleId="page.week.disabled.title"
          descriptionId="page.week.disabled.description"
          action={
            <Link
              to="/settings"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
            >
              <FormattedMessage id="page.week.disabled.action" />
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              labelId="page.week.stat.focus"
              value={mockAppShellData.week.focusCount}
              detailId="page.week.stat.focusDetail"
            />
            <StatCard
              labelId="page.week.stat.priorities"
              value={mockAppShellData.week.prioritiesCount}
              detailId="page.week.stat.prioritiesDetail"
            />
            <StatCard
              labelId="page.week.stat.attention"
              value={mockAppShellData.week.categoriesNeedingAttention}
              detailId="page.week.stat.attentionDetail"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ItemCard titleId="page.week.focus.title" metaId="page.week.focus.meta" tone="habit" />
            <ItemCard
              titleId="page.week.priorities.title"
              metaId="page.week.priorities.meta"
              tone="task"
            />
            <ItemCard
              titleId="page.week.quadrant.title"
              metaId="page.week.quadrant.meta"
              tone="neutral"
            />
            <ItemCard
              titleId="page.week.attention.title"
              metaId="page.week.attention.meta"
              tone="category"
            />
          </div>
        </>
      )}
    </section>
  )
}
