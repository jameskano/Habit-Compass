import { Link } from '@tanstack/react-router'
import { FormattedMessage } from 'react-intl'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import { useMoodLogsQuery } from '@/features/mood/hooks/useMoodLogsQuery'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ItemCard } from '@/shared/ui/ItemCard'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatCard } from '@/shared/ui/StatCard'

export function MoodPage() {
  const featureToggles = useAppPreferencesStore((state) => state.featureToggles)
  const moodLogsQuery = useMoodLogsQuery()

  return (
    <section className="space-y-6">
      <PageHeader titleId="page.mood.title" descriptionId="page.mood.description" />

      {!featureToggles.mood ? (
        <EmptyState
          titleId="page.mood.disabled.title"
          descriptionId="page.mood.disabled.description"
          action={
            <Link
              to="/settings"
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
            >
              <FormattedMessage id="page.mood.disabled.action" />
            </Link>
          }
        />
      ) : (
        <>
          {moodLogsQuery.isLoading ? (
            <EmptyState titleId="shared.loading.title" descriptionId="shared.loading.description" />
          ) : null}

          {moodLogsQuery.isError ? (
            <EmptyState titleId="shared.error.title" descriptionId="shared.error.description" />
          ) : null}

          {!moodLogsQuery.isLoading && !moodLogsQuery.isError ? (
          <div className="grid gap-4 md:grid-cols-3">
            <ItemCard titleId="page.mood.checkIn.title" metaId="page.mood.checkIn.meta" tone="neutral" />
            <ItemCard titleId="page.mood.reflection.title" metaId="page.mood.reflection.meta" tone="neutral" />
            <StatCard
              labelId="page.mood.history.title"
              value={moodLogsQuery.data?.length ?? 0}
              detailId="page.mood.history.meta"
            />
          </div>
          ) : null}

          {!featureToggles.reflections ? (
            <EmptyState
              titleId="page.mood.reflectionsDisabled.title"
              descriptionId="page.mood.reflectionsDisabled.description"
            />
          ) : null}
        </>
      )}
    </section>
  )
}
