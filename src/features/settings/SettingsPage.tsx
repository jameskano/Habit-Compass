import {
  CalendarDays,
  Check,
  ChevronRight,
  Crown,
  Database,
  Languages,
  LifeBuoy,
  LogOut,
  Palette,
  Shield,
  Tags,
  Trash2,
  X,
} from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { type ComponentType, type ReactNode, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import { calculateDeletionScheduledFor } from '@/domain/accountLifecycle'
import { canShowSecurityAndSignIn } from '@/domain/auth'
import { useRequestAccountDeletionMutation } from '@/features/account/useAccountLifecycleMutations'
import type { AppLocale, AppSettings, ThemePreference } from '@/domain/settings'
import { Button } from '@/shared/ui/button'
import { Card } from '@/shared/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from '@/shared/ui/sheet'
import { cn } from '@/shared/utils/cn'

import { useAccountProviderClassificationQuery } from './useAccountProviderClassificationQuery'
import { useSignOutMutation } from './useSignOutMutation'

type SettingsIcon = ComponentType<{ className?: string; size?: number; 'aria-hidden'?: boolean }>

type SettingsRowProps = {
  icon: SettingsIcon
  labelId: string
  ariaLabelId?: string
  descriptionId?: string
  valueId?: string
  to?:
    | '/settings/categories'
    | '/settings/security'
    | '/settings/data-privacy'
    | '/settings/support'
  onClick?: () => void
  disabled?: boolean
  destructive?: boolean
}

type PreferenceSheet = 'language' | 'theme' | 'weekStartsOn'

type DeleteAccountStep = 'intent' | 'reauth' | 'schedule'

type PreferenceOption<Value extends string | number> = {
  value: Value
  labelId: string
}

const currentYear = new Date().getFullYear()

const appVersion = import.meta.env.VITE_APP_VERSION ?? 'dev'
const appBuildNumber = import.meta.env.VITE_APP_BUILD_NUMBER

const languageOptions: PreferenceOption<AppLocale>[] = [
  { value: 'system', labelId: 'settings.locale.system' },
  { value: 'en', labelId: 'settings.locale.en' },
  { value: 'es', labelId: 'settings.locale.es' },
]

const themeOptions: PreferenceOption<ThemePreference>[] = [
  { value: 'system', labelId: 'settings.theme.system' },
  { value: 'light', labelId: 'settings.theme.light' },
  { value: 'dark', labelId: 'settings.theme.dark' },
]

const weekStartsOnOptions: PreferenceOption<AppSettings['weekStartsOn']>[] = [
  { value: 1, labelId: 'settings.weekStartsOn.1' },
  { value: 0, labelId: 'settings.weekStartsOn.0' },
]

const SettingsRow = ({
  ariaLabelId,
  descriptionId,
  destructive = false,
  disabled = false,
  icon: Icon,
  labelId,
  onClick,
  to,
  valueId,
}: SettingsRowProps) => {
  const intl = useIntl()
  const content = (
    <>
      <span
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-lg',
          destructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
        )}
      >
        <Icon aria-hidden size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block font-medium', destructive ? 'text-destructive' : null)}>
          <FormattedMessage id={labelId} />
        </span>
        {descriptionId ? (
          <span className="mt-0.5 block text-sm text-muted-foreground">
            <FormattedMessage id={descriptionId} />
          </span>
        ) : null}
      </span>
      {valueId ? (
        <span className="shrink-0 text-sm text-muted-foreground">
          <FormattedMessage id={valueId} />
        </span>
      ) : null}
      {to || onClick ? (
        <ChevronRight aria-hidden className="shrink-0 text-muted-foreground" size={18} />
      ) : null}
    </>
  )

  const className = cn(
    'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors',
    to || onClick
      ? 'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      : '',
    disabled ? 'cursor-not-allowed opacity-60' : '',
  )

  if (to) {
    return (
      <Link
        to={to}
        aria-label={ariaLabelId ? intl.formatMessage({ id: ariaLabelId }) : undefined}
        className={className}
      >
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button className={className} disabled={disabled} type="button" onClick={onClick}>
        {content}
      </button>
    )
  }

  return (
    <div aria-disabled={disabled || undefined} className={className}>
      {content}
    </div>
  )
}

type SettingsSectionProps = {
  titleId: string
  children: ReactNode
}

const SettingsSection = ({ children, titleId }: SettingsSectionProps) => (
  <Card className="space-y-2 p-3">
    <h2 className="px-3 pt-1 text-sm font-semibold uppercase tracking-normal text-muted-foreground">
      <FormattedMessage id={titleId} />
    </h2>
    <div className="space-y-1">{children}</div>
  </Card>
)

type PreferenceSheetContentProps<Value extends string | number> = {
  titleId: string
  descriptionId: string
  options: PreferenceOption<Value>[]
  value: Value
  onSelect: (value: Value) => void
}

const PreferenceSheetContent = <Value extends string | number>({
  descriptionId,
  onSelect,
  options,
  titleId,
  value,
}: PreferenceSheetContentProps<Value>) => (
  <div className="space-y-4">
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-2">
        <SheetTitle className="text-lg font-semibold">
          <FormattedMessage id={titleId} />
        </SheetTitle>
        <SheetDescription className="text-sm leading-6 text-muted-foreground">
          <FormattedMessage id={descriptionId} />
        </SheetDescription>
      </div>
      <SheetClose className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <X aria-hidden size={18} />
        <span className="sr-only">
          <FormattedMessage id="action.close" />
        </span>
      </SheetClose>
    </div>
    <div className="space-y-2">
      {options.map((option) => {
        const selected = option.value === value

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(option.value)}
            className={cn(
              'flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors',
              selected
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border/70 bg-card text-foreground hover:bg-muted',
            )}
          >
            <FormattedMessage id={option.labelId} />
            {selected ? <Check aria-hidden className="text-primary" size={18} /> : null}
          </button>
        )
      })}
    </div>
  </div>
)

export const SettingsPage = () => {
  const intl = useIntl()
  const navigate = useNavigate()
  const [activeSheet, setActiveSheet] = useState<PreferenceSheet | null>(null)
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false)
  const [signOutError, setSignOutError] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteStep, setDeleteStep] = useState<DeleteAccountStep>('intent')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState(false)
  const theme = useAppPreferencesStore((state) => state.theme)
  const locale = useAppPreferencesStore((state) => state.locale)
  const weekStartsOn = useAppPreferencesStore((state) => state.weekStartsOn)
  const setTheme = useAppPreferencesStore((state) => state.setTheme)
  const setLocale = useAppPreferencesStore((state) => state.setLocale)
  const setWeekStartsOn = useAppPreferencesStore((state) => state.setWeekStartsOn)
  const providerClassification = useAccountProviderClassificationQuery()
  const signOutMutation = useSignOutMutation()
  const requestAccountDeletion = useRequestAccountDeletionMutation()

  const themeValueId = `settings.theme.${theme}`
  const localeValueId = `settings.locale.${locale}`
  const weekStartsOnValueId = `settings.weekStartsOn.${weekStartsOn}`
  const showSecurityAndSignIn = canShowSecurityAndSignIn(providerClassification.data)
  const deleteRequiresPassword =
    providerClassification.data === 'email_password' || providerClassification.data === 'mixed'
  const deletionPreviewDate = calculateDeletionScheduledFor(new Date())
  const deletionPreviewLabel = intl.formatDate(deletionPreviewDate, {
    dateStyle: 'long',
    timeStyle: 'short',
  })
  const footerVersion = appBuildNumber
    ? intl.formatMessage(
        { id: 'settings.footer.versionWithBuild' },
        { version: appVersion, build: appBuildNumber },
      )
    : intl.formatMessage({ id: 'settings.footer.version' }, { version: appVersion })

  return (
    <section className="space-y-4">
      <SettingsRow
        ariaLabelId="settings.categories.accessibilityLabel"
        descriptionId="settings.categories.description"
        icon={Tags}
        labelId="settings.categories.title"
        to="/settings/categories"
      />

      <SettingsSection titleId="settings.preferences.title">
        <SettingsRow
          icon={Languages}
          labelId="settings.locale.title"
          onClick={() => setActiveSheet('language')}
          valueId={localeValueId}
        />
        <SettingsRow
          icon={Palette}
          labelId="settings.theme.title"
          onClick={() => setActiveSheet('theme')}
          valueId={themeValueId}
        />
        <SettingsRow
          icon={CalendarDays}
          labelId="settings.weekStartsOn.title"
          onClick={() => setActiveSheet('weekStartsOn')}
          valueId={weekStartsOnValueId}
        />
      </SettingsSection>

      {showSecurityAndSignIn ? (
        <SettingsSection titleId="settings.security.title">
          <SettingsRow
            descriptionId="settings.security.description"
            icon={Shield}
            labelId="settings.security.title"
            to="/settings/security"
          />
        </SettingsSection>
      ) : null}

      <SettingsSection titleId="settings.dataPrivacy.title">
        <SettingsRow
          descriptionId="settings.dataPrivacy.description"
          icon={Database}
          labelId="settings.dataPrivacy.title"
          to="/settings/data-privacy"
        />
      </SettingsSection>

      <SettingsSection titleId="settings.premium.sectionTitle">
        <SettingsRow
          disabled
          descriptionId="settings.premium.status"
          icon={Crown}
          labelId="settings.premium.title"
        />
      </SettingsSection>

      <SettingsSection titleId="settings.support.title">
        <SettingsRow
          descriptionId="settings.support.description"
          icon={LifeBuoy}
          labelId="settings.support.feedback"
          to="/settings/support"
        />
      </SettingsSection>

      <SettingsSection titleId="settings.account.title">
        <SettingsRow
          icon={LogOut}
          labelId="settings.account.signOut"
          onClick={() => {
            setSignOutError(false)
            setSignOutDialogOpen(true)
          }}
        />
        <SettingsRow
          destructive
          icon={Trash2}
          labelId="settings.account.delete"
          onClick={() => {
            setDeleteStep('intent')
            setDeletePassword('')
            setDeleteError(false)
            setDeleteDialogOpen(true)
          }}
        />
      </SettingsSection>

      <footer className="space-y-1 px-2 pb-2 pt-1 text-center text-xs text-muted-foreground">
        <p>{footerVersion}</p>
        <p>
          <FormattedMessage id="settings.footer.copyright" values={{ year: currentYear }} />
        </p>
        <p>
          <FormattedMessage id="settings.footer.tagline" />
        </p>
      </footer>

      <Sheet open={activeSheet !== null} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent>
          {activeSheet === 'language' ? (
            <PreferenceSheetContent
              descriptionId="settings.locale.description"
              options={languageOptions}
              titleId="settings.locale.title"
              value={locale}
              onSelect={(nextLocale) => {
                setLocale(nextLocale)
                setActiveSheet(null)
              }}
            />
          ) : null}
          {activeSheet === 'theme' ? (
            <PreferenceSheetContent
              descriptionId="settings.theme.description"
              options={themeOptions}
              titleId="settings.theme.title"
              value={theme}
              onSelect={(nextTheme) => {
                setTheme(nextTheme)
                setActiveSheet(null)
              }}
            />
          ) : null}
          {activeSheet === 'weekStartsOn' ? (
            <PreferenceSheetContent
              descriptionId="settings.weekStartsOn.description"
              options={weekStartsOnOptions}
              titleId="settings.weekStartsOn.title"
              value={weekStartsOn}
              onSelect={(nextWeekStartsOn) => {
                setWeekStartsOn(nextWeekStartsOn)
                setActiveSheet(null)
              }}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={signOutDialogOpen} onOpenChange={setSignOutDialogOpen}>
        <DialogContent aria-describedby="settings-sign-out-description">
          <DialogHeader>
            <DialogTitle>
              <FormattedMessage id="settings.account.signOut.confirmTitle" />
            </DialogTitle>
            <DialogDescription id="settings-sign-out-description">
              <FormattedMessage id="settings.account.signOut.confirmDescription" />
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-4 sm:px-6">
            {signOutError ? (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <FormattedMessage id="settings.account.signOut.error" />
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="secondary">
                  <FormattedMessage id="action.cancel" />
                </Button>
              </DialogClose>
              <Button
                disabled={signOutMutation.isPending}
                onClick={() =>
                  signOutMutation.mutate(undefined, {
                    onSuccess: () => {
                      setSignOutDialogOpen(false)
                      navigate({ to: '/signed-out' })
                    },
                    onError: () => setSignOutError(true),
                  })
                }
              >
                <FormattedMessage id="settings.account.signOut" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) {
            setDeleteStep('intent')
            setDeletePassword('')
            setDeleteError(false)
          }
        }}
      >
        <DialogContent aria-describedby={`settings-delete-account-${deleteStep}-description`}>
          {deleteStep === 'intent' ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  <FormattedMessage id="settings.account.delete.intentTitle" />
                </DialogTitle>
                <DialogDescription id="settings-delete-account-intent-description">
                  <FormattedMessage id="settings.account.delete.intentDescription" />
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 p-4 sm:px-6">
                <DialogClose asChild>
                  <Button variant="secondary">
                    <FormattedMessage id="action.cancel" />
                  </Button>
                </DialogClose>
                <Button
                  onClick={() => setDeleteStep(deleteRequiresPassword ? 'reauth' : 'schedule')}
                >
                  <FormattedMessage id="action.continue" />
                </Button>
              </div>
            </>
          ) : null}

          {deleteStep === 'reauth' ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  <FormattedMessage id="settings.account.delete.reauthTitle" />
                </DialogTitle>
                <DialogDescription id="settings-delete-account-reauth-description">
                  <FormattedMessage id="settings.account.delete.reauthDescription" />
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 p-4 sm:px-6">
                <div className="space-y-2">
                  <Label htmlFor="delete-account-current-password">
                    <FormattedMessage id="settings.account.delete.currentPassword" />
                  </Label>
                  <Input
                    id="delete-account-current-password"
                    autoComplete="current-password"
                    type="password"
                    value={deletePassword}
                    onChange={(event) => {
                      setDeleteError(false)
                      setDeletePassword(event.currentTarget.value)
                    }}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setDeleteStep('intent')}>
                    <FormattedMessage id="action.back" />
                  </Button>
                  <Button
                    disabled={deletePassword.trim().length === 0}
                    onClick={() => setDeleteStep('schedule')}
                  >
                    <FormattedMessage id="action.continue" />
                  </Button>
                </div>
              </div>
            </>
          ) : null}

          {deleteStep === 'schedule' ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  <FormattedMessage id="settings.account.delete.scheduleTitle" />
                </DialogTitle>
                <DialogDescription id="settings-delete-account-schedule-description">
                  <FormattedMessage
                    id="settings.account.delete.scheduleDescription"
                    values={{ date: deletionPreviewLabel }}
                  />
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 p-4 sm:px-6">
                {deleteError ? (
                  <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    <FormattedMessage id="settings.account.delete.error" />
                  </p>
                ) : null}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setDeleteStep(deleteRequiresPassword ? 'reauth' : 'intent')}
                  >
                    <FormattedMessage id="action.back" />
                  </Button>
                  <Button
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={requestAccountDeletion.isPending}
                    onClick={() =>
                      requestAccountDeletion.mutate(
                        {
                          currentPassword: deleteRequiresPassword ? deletePassword : undefined,
                          source: 'in_app',
                        },
                        {
                          onSuccess: () => {
                            setDeleteDialogOpen(false)
                            navigate({ to: '/account/pending-deletion' })
                          },
                          onError: () => setDeleteError(true),
                        },
                      )
                    }
                  >
                    <FormattedMessage id="settings.account.delete" />
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}
