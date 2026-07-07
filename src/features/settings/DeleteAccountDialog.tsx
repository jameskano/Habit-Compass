import { FormattedMessage } from 'react-intl'

import type { SubscriptionSnapshot } from '@/domain/subscriptions'
import { Button } from '@/shared/ui/button'
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

import { SettingsStatusMessage } from './components/SettingsStatusMessage'
import type { DeleteAccountReauthMethod, DeleteAccountStep } from './settings.types'

type DeleteAccountDialogProps = {
  deleteError: boolean
  deletePassword: string
  deleteReauthMethod: DeleteAccountReauthMethod
  isPending: boolean
  open: boolean
  step: DeleteAccountStep
  subscriptionSnapshot: SubscriptionSnapshot | undefined
  subscriptionSnapshotLoading: boolean
  onDeletePasswordChange: (password: string) => void
  onOpenChange: (open: boolean) => void
  onStepChange: (step: DeleteAccountStep) => void
  onSubmit: () => void
}

export const DeleteAccountDialog = ({
  deleteError,
  deletePassword,
  deleteReauthMethod,
  isPending,
  onDeletePasswordChange,
  onOpenChange,
  onStepChange,
  onSubmit,
  open,
  step,
  subscriptionSnapshot,
  subscriptionSnapshotLoading,
}: DeleteAccountDialogProps) => {
  const deleteButtonMessageId =
    deleteReauthMethod === 'google'
      ? 'settings.account.delete.continueWithGoogle'
      : 'settings.account.delete'
  const confirmBackStep = deleteReauthMethod === 'password' ? 'reauth' : 'intent'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={`settings-delete-account-${step}-description`}>
        {step === 'intent' ? (
          <>
            <DialogHeader>
              <DialogTitle>
                <FormattedMessage id="settings.account.delete.intentTitle" />
              </DialogTitle>
              <DialogDescription id="settings-delete-account-intent-description">
                <FormattedMessage id="settings.account.delete.intentDescription" />
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 px-4 text-sm leading-6 text-muted-foreground sm:px-6">
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <FormattedMessage id="settings.account.delete.consequence.data" />
                </li>
                <li>
                  <FormattedMessage id="settings.account.delete.consequence.access" />
                </li>
                <li>
                  <FormattedMessage id="settings.account.delete.consequence.refund" />
                </li>
              </ul>
              {subscriptionSnapshotLoading ? (
                <SettingsStatusMessage
                  messageId="settings.account.delete.subscription.loading"
                  tone="info"
                />
              ) : null}
              {subscriptionSnapshot?.hasActiveGooglePlayAutoRenewingSubscription ? (
                <SettingsStatusMessage
                  messageId="settings.account.delete.subscription.autoRenewing"
                  tone="warning"
                />
              ) : null}
              {subscriptionSnapshot?.hasActiveEntitlement &&
              !subscriptionSnapshot.hasActiveGooglePlayAutoRenewingSubscription ? (
                <SettingsStatusMessage
                  messageId="settings.account.delete.subscription.active"
                  tone="warning"
                />
              ) : null}
            </div>
            <div className="flex justify-end gap-2 p-4 sm:px-6">
              <DialogClose asChild>
                <Button variant="secondary">
                  <FormattedMessage id="action.cancel" />
                </Button>
              </DialogClose>
              <Button
                onClick={() =>
                  onStepChange(deleteReauthMethod === 'password' ? 'reauth' : 'confirm')
                }
              >
                <FormattedMessage id="action.continue" />
              </Button>
            </div>
          </>
        ) : null}

        {step === 'reauth' ? (
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
                  onChange={(event) => onDeletePasswordChange(event.currentTarget.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => onStepChange('intent')}>
                  <FormattedMessage id="action.back" />
                </Button>
                <Button
                  disabled={deletePassword.trim().length === 0}
                  onClick={() => onStepChange('confirm')}
                >
                  <FormattedMessage id="action.continue" />
                </Button>
              </div>
            </div>
          </>
        ) : null}

        {step === 'confirm' ? (
          <>
            <DialogHeader>
              <DialogTitle>
                <FormattedMessage id="settings.account.delete.confirmTitle" />
              </DialogTitle>
              <DialogDescription id="settings-delete-account-confirm-description">
                <FormattedMessage id="settings.account.delete.confirmDescription" />
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 p-4 sm:px-6">
              {deleteError ? (
                <SettingsStatusMessage messageId="settings.account.delete.error" tone="error" />
              ) : null}
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  disabled={isPending}
                  onClick={() => onStepChange(confirmBackStep)}
                >
                  <FormattedMessage id="action.back" />
                </Button>
                <Button
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isPending}
                  onClick={onSubmit}
                >
                  <FormattedMessage id={deleteButtonMessageId} />
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
