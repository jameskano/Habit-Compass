import { KeyRound, Mail } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FormattedMessage } from 'react-intl'

import { canShowSecurityAndSignIn } from '@/domain/auth'
import { BackButton } from '@/shared/ui/BackButton'
import { Card } from '@/shared/ui/card'
import { useShellLeading } from '@/shared/ui/useShellLeading'
import { useShellTitle } from '@/shared/ui/useShellTitle'

import { SettingsRow } from '../components/SettingsRow'
import { ChangeEmailSheet } from './ChangeEmailSheet'
import { ChangePasswordSheet } from './ChangePasswordSheet'
import { useSecurityProfileQuery } from './useSecurityProfileQuery'

export const SecurityPage = () => {
  const securityProfile = useSecurityProfileQuery()
  const [emailSheetOpen, setEmailSheetOpen] = useState(false)
  const [passwordSheetOpen, setPasswordSheetOpen] = useState(false)
  useShellTitle('settings.security.title')

  const shellLeading = useMemo(() => <BackButton to="/settings" />, [])
  useShellLeading(shellLeading)

  const showSecurityControls = canShowSecurityAndSignIn(
    securityProfile.data?.providerClassification,
  )

  return (
    <>
      <section className="space-y-4">
        <Card className="space-y-2 p-3">
          <h2 className="px-3 pt-1 text-sm font-semibold uppercase tracking-normal text-muted-foreground">
            <FormattedMessage id="settings.security.title" />
          </h2>
          {securityProfile.isLoading ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              <FormattedMessage id="settings.security.loading" />
            </p>
          ) : null}
          {!securityProfile.isLoading && !showSecurityControls ? (
            <p className="px-3 py-3 text-sm leading-6 text-muted-foreground">
              <FormattedMessage id="settings.security.notAvailableForAccount" />
            </p>
          ) : null}
          {showSecurityControls ? (
            <div className="space-y-1">
              <SettingsRow
                descriptionId="settings.security.changeEmail.description"
                icon={Mail}
                labelId="settings.security.changeEmail.title"
                onClick={() => setEmailSheetOpen(true)}
              />
              <SettingsRow
                descriptionId="settings.security.changePassword.description"
                icon={KeyRound}
                labelId="settings.security.changePassword.title"
                onClick={() => setPasswordSheetOpen(true)}
              />
            </div>
          ) : null}
        </Card>
      </section>

      <ChangeEmailSheet
        key={securityProfile.data?.currentEmail ?? 'no-email'}
        currentEmail={securityProfile.data?.currentEmail ?? null}
        open={emailSheetOpen}
        onOpenChange={setEmailSheetOpen}
      />
      <ChangePasswordSheet open={passwordSheetOpen} onOpenChange={setPasswordSheetOpen} />
    </>
  )
}
