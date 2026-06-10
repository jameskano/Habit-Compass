import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { FeatureToggle } from '@/shared/ui/FeatureToggle'

const onboardingStyles = [
  {
    value: 'simple',
    labelId: 'onboarding.style.simple',
    descriptionId: 'onboarding.style.simpleDescription',
  },
  {
    value: 'intentional',
    labelId: 'onboarding.style.intentional',
    descriptionId: 'onboarding.style.intentionalDescription',
  },
  {
    value: 'adaptive',
    labelId: 'onboarding.style.adaptive',
    descriptionId: 'onboarding.style.adaptiveDescription',
  },
] as const

export const OnboardingPage = () => {
  const navigate = useNavigate()
  const intl = useIntl()
  const [step, setStep] = useState(0)
  const [style, setStyle] = useState<(typeof onboardingStyles)[number]['value']>('simple')
  const [firstHabitName, setFirstHabitName] = useState('')
  const theme = useAppPreferencesStore((state) => state.theme)
  const locale = useAppPreferencesStore((state) => state.locale)
  const featureToggles = useAppPreferencesStore((state) => state.featureToggles)
  const setTheme = useAppPreferencesStore((state) => state.setTheme)
  const setLocale = useAppPreferencesStore((state) => state.setLocale)
  const setFeatureToggle = useAppPreferencesStore((state) => state.setFeatureToggle)

  const stepCount = 3

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <ol
        className="grid gap-2 md:grid-cols-3"
        aria-label={intl.formatMessage({ id: 'onboarding.steps.aria' })}
      >
        {Array.from({ length: stepCount }, (_, index) => (
          <li
            key={index}
            className={`rounded-2xl border px-4 py-3 text-sm ${
              step === index
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border/70 bg-card/90 text-muted-foreground'
            }`}
          >
            <FormattedMessage id={`onboarding.step.${index + 1}.label`} />
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <Card className="space-y-4 rounded-[1.5rem] p-5">
          <h2 className="text-xl font-semibold">
            <FormattedMessage id="onboarding.step.1.title" />
          </h2>
          <div className="grid gap-3">
            {onboardingStyles.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={style === option.value}
                onClick={() => setStyle(option.value)}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  style === option.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border/70 bg-card hover:bg-muted'
                }`}
              >
                <p className="font-semibold">{intl.formatMessage({ id: option.labelId })}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {intl.formatMessage({ id: option.descriptionId })}
                </p>
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card className="space-y-4 rounded-[1.5rem] p-5">
          <h2 className="text-xl font-semibold">
            <FormattedMessage id="onboarding.step.2.title" />
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            <FormattedMessage id="onboarding.step.2.description" />
          </p>
          <label className="block space-y-2">
            <span className="text-sm font-medium">
              <FormattedMessage id="onboarding.step.2.inputLabel" />
            </span>
            <input
              value={firstHabitName}
              onChange={(event) => setFirstHabitName(event.target.value)}
              className="min-h-11 w-full rounded-2xl border border-border/70 bg-card px-4 text-foreground"
            />
          </label>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <FormattedMessage
              id="onboarding.step.2.preview"
              values={{
                value:
                  firstHabitName || intl.formatMessage({ id: 'onboarding.step.2.previewFallback' }),
              }}
            />
          </p>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="space-y-5 rounded-[1.5rem] p-5">
          <h2 className="text-xl font-semibold">
            <FormattedMessage id="onboarding.step.3.title" />
          </h2>
          <div className="space-y-3">
            <p className="text-sm font-semibold">
              <FormattedMessage id="settings.theme.title" />
            </p>
            <div className="flex flex-wrap gap-2">
              {(['light', 'dark', 'system'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={theme === option}
                  onClick={() => setTheme(option)}
                  className={`rounded-full border px-4 py-2 text-sm ${
                    theme === option
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border/70 bg-card text-foreground'
                  }`}
                >
                  <FormattedMessage id={`settings.theme.${option}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">
              <FormattedMessage id="settings.locale.title" />
            </p>
            <div className="flex flex-wrap gap-2">
              {(['en', 'es'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={locale === option}
                  onClick={() => setLocale(option)}
                  className={`rounded-full border px-4 py-2 text-sm ${
                    locale === option
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border/70 bg-card text-foreground'
                  }`}
                >
                  <FormattedMessage id={`settings.locale.${option}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <FeatureToggle
              id="onboarding-mood"
              labelId="settings.toggle.mood"
              descriptionId="onboarding.personalize.mood"
              checked={featureToggles.mood}
              onChange={(checked) => setFeatureToggle('mood', checked)}
            />
            <FeatureToggle
              id="onboarding-weekly"
              labelId="settings.toggle.weeklyPlanning"
              descriptionId="onboarding.personalize.weeklyPlanning"
              checked={featureToggles.weeklyPlanning}
              onChange={(checked) => setFeatureToggle('weeklyPlanning', checked)}
            />
            <FeatureToggle
              id="onboarding-suggestions"
              labelId="settings.toggle.suggestions"
              descriptionId="onboarding.personalize.suggestions"
              checked={featureToggles.suggestions}
              onChange={(checked) => setFeatureToggle('suggestions', checked)}
            />
          </div>
        </Card>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setStep((currentStep) => Math.max(0, currentStep - 1))}
          disabled={step === 0}
          className="rounded-full"
        >
          <FormattedMessage id="action.back" />
        </Button>

        {step < stepCount - 1 ? (
          <Button
            onClick={() => setStep((currentStep) => Math.min(stepCount - 1, currentStep + 1))}
            className="rounded-full"
          >
            <FormattedMessage id="action.next" />
          </Button>
        ) : (
          <Button onClick={() => void navigate({ to: '/today' })} className="rounded-full">
            <FormattedMessage id="action.finish" />
          </Button>
        )}
      </div>
    </section>
  )
}
