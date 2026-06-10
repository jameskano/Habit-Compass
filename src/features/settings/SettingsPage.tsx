import { FormattedMessage, useIntl } from 'react-intl'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { FeatureToggle } from '@/shared/ui/FeatureToggle'

const themeOptions = [
  { value: 'light', labelId: 'settings.theme.light' },
  { value: 'dark', labelId: 'settings.theme.dark' },
  { value: 'system', labelId: 'settings.theme.system' },
] as const

const localeOptions = [
  { value: 'en', labelId: 'settings.locale.en' },
  { value: 'es', labelId: 'settings.locale.es' },
] as const

const toggleItems = [
  {
    key: 'mood',
    labelId: 'settings.toggle.mood',
    descriptionId: 'settings.toggle.moodDescription',
  },
  {
    key: 'weeklyPlanning',
    labelId: 'settings.toggle.weeklyPlanning',
    descriptionId: 'settings.toggle.weeklyPlanningDescription',
  },
  {
    key: 'suggestions',
    labelId: 'settings.toggle.suggestions',
    descriptionId: 'settings.toggle.suggestionsDescription',
  },
  {
    key: 'habitCompletionLevels',
    labelId: 'settings.toggle.habitCompletionLevels',
    descriptionId: 'settings.toggle.habitCompletionLevelsDescription',
  },
  {
    key: 'reflections',
    labelId: 'settings.toggle.reflections',
    descriptionId: 'settings.toggle.reflectionsDescription',
  },
  {
    key: 'categories',
    labelId: 'settings.toggle.categories',
    descriptionId: 'settings.toggle.categoriesDescription',
  },
] as const

export const SettingsPage = () => {
  const intl = useIntl()
  const theme = useAppPreferencesStore((state) => state.theme)
  const locale = useAppPreferencesStore((state) => state.locale)
  const featureToggles = useAppPreferencesStore((state) => state.featureToggles)
  const setTheme = useAppPreferencesStore((state) => state.setTheme)
  const setLocale = useAppPreferencesStore((state) => state.setLocale)
  const setFeatureToggle = useAppPreferencesStore((state) => state.setFeatureToggle)

  return (
    <section className="space-y-6">
      <Card className="space-y-4 rounded-2xl p-5">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">
            <FormattedMessage id="settings.theme.title" />
          </h2>
          <p className="text-sm text-muted-foreground">
            <FormattedMessage id="settings.theme.description" />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={theme === option.value}
              onClick={() => setTheme(option.value)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                theme === option.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/70 bg-card text-foreground hover:bg-muted'
              }`}
            >
              {intl.formatMessage({ id: option.labelId })}
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-4 rounded-2xl p-5">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">
            <FormattedMessage id="settings.locale.title" />
          </h2>
          <p className="text-sm text-muted-foreground">
            <FormattedMessage id="settings.locale.description" />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {localeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={locale === option.value}
              onClick={() => setLocale(option.value)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                locale === option.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border/70 bg-card text-foreground hover:bg-muted'
              }`}
            >
              {intl.formatMessage({ id: option.labelId })}
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            <FormattedMessage id="settings.toggles.title" />
          </h2>
          <p className="text-sm text-muted-foreground">
            <FormattedMessage id="settings.toggles.description" />
          </p>
        </div>
        {toggleItems.map((toggle) => (
          <FeatureToggle
            key={toggle.key}
            id={`toggle-${toggle.key}`}
            labelId={toggle.labelId}
            descriptionId={toggle.descriptionId}
            checked={featureToggles[toggle.key]}
            onChange={(checked) => setFeatureToggle(toggle.key, checked)}
          />
        ))}
      </div>

      <Card className="space-y-4 rounded-2xl border-rose-200/50 bg-rose-50/70 p-5 dark:border-rose-900/40 dark:bg-rose-950/20">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            <FormattedMessage id="settings.reset.title" />
          </h2>
          <p className="text-sm text-muted-foreground">
            <FormattedMessage id="settings.reset.description" />
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" className="rounded-full" disabled>
            <FormattedMessage id="settings.reset.soft" />
          </Button>
          <Button className="rounded-full opacity-80" disabled>
            <FormattedMessage id="settings.reset.hard" />
          </Button>
        </div>
      </Card>
    </section>
  )
}
