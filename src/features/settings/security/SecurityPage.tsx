import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, ChevronRight, KeyRound, Mail } from 'lucide-react'
import { useCallback, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { canShowSecurityAndSignIn } from '@/domain/auth'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import { useShellLeading } from '@/shared/ui/useShellLeading'
import { useShellTitle } from '@/shared/ui/useShellTitle'

import { ChangeEmailSheet } from './ChangeEmailSheet'
import { ChangePasswordSheet } from './ChangePasswordSheet'
import { useSecurityProfileQuery } from './useSecurityProfileQuery'

type SecurityIcon = ComponentType<{ className?: string; size?: number; 'aria-hidden'?: boolean }>

const BackButton = ({ children, onBack }: { children: ReactNode; onBack: () => void }) => (
  <Button
    variant="ghost"
    className="size-10 rounded-full border border-border/70 bg-card/90 p-0 text-foreground"
    aria-label={String(children)}
    onClick={onBack}
  >
    <ArrowLeft aria-hidden size={20} />
    <span className="sr-only">{children}</span>
  </Button>
)

const SecurityRow = ({
  descriptionId,
  icon: Icon,
  labelId,
  onClick,
}: {
  descriptionId: string
  icon: SecurityIcon
  labelId: string
  onClick: () => void
}) => (
  <button
    type="button"
    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    onClick={onClick}
  >
    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
      <Icon aria-hidden size={18} />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block font-medium">
        <FormattedMessage id={labelId} />
      </span>
      <span className="mt-0.5 block text-sm text-muted-foreground">
        <FormattedMessage id={descriptionId} />
      </span>
    </span>
    <ChevronRight aria-hidden className="shrink-0 text-muted-foreground" size={18} />
  </button>
)

export const SecurityPage = () => {
  const intl = useIntl()
  const navigate = useNavigate()
  const securityProfile = useSecurityProfileQuery()
  const [emailSheetOpen, setEmailSheetOpen] = useState(false)
  const [passwordSheetOpen, setPasswordSheetOpen] = useState(false)
  useShellTitle('settings.security.title')

  const handleBack = useCallback(() => {
    navigate({ to: '/settings' })
  }, [navigate])
  const shellLeading = useMemo(
    () => <BackButton onBack={handleBack}>{intl.formatMessage({ id: 'action.back' })}</BackButton>,
    [handleBack, intl],
  )
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
              <SecurityRow
                descriptionId="settings.security.changeEmail.description"
                icon={Mail}
                labelId="settings.security.changeEmail.title"
                onClick={() => setEmailSheetOpen(true)}
              />
              <SecurityRow
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
