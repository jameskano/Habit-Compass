import { Crown, Database, Shield, Tags } from 'lucide-react'
import { useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import { canShowSecurityAndSignIn } from '@/domain/auth'
import { Sheet, SheetContent } from '@/shared/ui/sheet'

import { PreferenceSheetBody } from './PreferenceSheetBody'
import { SettingsAccountActionsSection } from './SettingsAccountActionsSection'
import { SettingsPreferencesSection } from './SettingsPreferencesSection'
import { RateAppUnavailableDialog, SettingsSupportSection } from './SettingsSupportSection'
import { SettingsRow } from './components/SettingsRow'
import { SettingsSection } from './components/SettingsSection'
import { appBuildNumber, appVersion, currentYear } from './settings.constants'
import type { PreferenceSheet } from './settings.types'
import { useAccountProviderClassificationQuery } from './useAccountProviderClassificationQuery'

export const SettingsPage = () => {
  const intl = useIntl()
  const [activeSheet, setActiveSheet] = useState<PreferenceSheet | null>(null)
  const [rateDialogOpen, setRateDialogOpen] = useState(false)
  const theme = useAppPreferencesStore((state) => state.theme)
  const locale = useAppPreferencesStore((state) => state.locale)
  const weekStartsOn = useAppPreferencesStore((state) => state.weekStartsOn)
  const setTheme = useAppPreferencesStore((state) => state.setTheme)
  const setLocale = useAppPreferencesStore((state) => state.setLocale)
  const setWeekStartsOn = useAppPreferencesStore((state) => state.setWeekStartsOn)
  const providerClassification = useAccountProviderClassificationQuery()
  const showSecurityAndSignIn = canShowSecurityAndSignIn(providerClassification.data)
  const footerVersion = appBuildNumber
    ? intl.formatMessage(
        { id: 'settings.footer.versionWithBuild' },
        { version: appVersion, build: appBuildNumber },
      )
    : intl.formatMessage({ id: 'settings.footer.version' }, { version: appVersion })

  return (
    <section className="space-y-4">
      <SettingsSection>
        <SettingsRow
          ariaLabelId="settings.categories.accessibilityLabel"
          descriptionId="settings.categories.description"
          icon={Tags}
          labelId="settings.categories.title"
          to="/settings/categories"
        />
      </SettingsSection>

      <SettingsPreferencesSection
        locale={locale}
        theme={theme}
        weekStartsOn={weekStartsOn}
        onOpenSheet={setActiveSheet}
      />

      {showSecurityAndSignIn ? (
        <SettingsSection>
          <SettingsRow
            descriptionId="settings.security.description"
            icon={Shield}
            labelId="settings.security.title"
            to="/settings/security"
          />
        </SettingsSection>
      ) : null}

      <SettingsSection>
        <SettingsRow
          descriptionId="settings.dataPrivacy.description"
          icon={Database}
          labelId="settings.dataPrivacy.title"
          to="/settings/data-privacy"
        />
      </SettingsSection>

      <SettingsSection>
        <SettingsRow
          disabled
          descriptionId="settings.premium.status"
          icon={Crown}
          labelId="settings.premium.title"
        />
      </SettingsSection>

      <SettingsSupportSection onOpenRateDialog={() => setRateDialogOpen(true)} />

      <SettingsAccountActionsSection providerClassification={providerClassification.data} />

      <footer className="space-y-1 px-2 pb-2 pt-4 text-center text-xs text-muted-foreground">
        <p>{footerVersion}</p>
        <p>
          <FormattedMessage id="settings.footer.copyright" values={{ year: currentYear }} />
        </p>
        <p>
          <FormattedMessage id="settings.footer.tagline" />
        </p>
      </footer>

      <Sheet open={activeSheet !== null} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent className="animate-[habit-sheet-in_300ms_ease-out] motion-reduce:animate-none">
          <PreferenceSheetBody
            activeSheet={activeSheet}
            locale={locale}
            theme={theme}
            weekStartsOn={weekStartsOn}
            onLocaleSelect={(nextLocale) => {
              setLocale(nextLocale)
              setActiveSheet(null)
            }}
            onThemeSelect={(nextTheme) => {
              setTheme(nextTheme)
              setActiveSheet(null)
            }}
            onWeekStartsOnSelect={(nextWeekStartsOn) => {
              setWeekStartsOn(nextWeekStartsOn)
              setActiveSheet(null)
            }}
          />
        </SheetContent>
      </Sheet>

      <RateAppUnavailableDialog open={rateDialogOpen} onOpenChange={setRateDialogOpen} />
    </section>
  )
}
