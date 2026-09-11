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
import { PendingState } from '@/shared/ui/PendingState'

import { SettingsStatusMessage } from './components/SettingsStatusMessage'
import type { DeleteAccountReauthMethod, DeleteAccountStep } from './settings.types'

type DeleteAccountDialogProps = {
  deleteError: boolean
  deletePassword: string
  deleteReauthMethod: DeleteAccountReauthMethod
  googleReauthVerified: boolean
  isPending: boolean
  open: boolean
  step: DeleteAccountStep
  subscriptionSnapshot: SubscriptionSnapshot | undefined
  subscriptionSnapshotLoading: boolean
  onDeletePasswordChange: (password: string) => void
  onOpenChange: (open: boolean) => void
  onRestartGoogleReauthentication: () => void
  onStepChange: (step: DeleteAccountStep) => void
  onSubmit: () => void
}

export const DeleteAccountDialog = ({
  deleteError,
  deletePassword,
  deleteReauthMethod,
  googleReauthVerified,
  isPending,
  onDeletePasswordChange,
  onOpenChange,
  onRestartGoogleReauthentication,
  onStepChange,
  onSubmit,
  open,
  step,
  subscriptionSnapshot,
  subscriptionSnapshotLoading,
}: DeleteAccountDialogProps) => {
  const googleReauthStep = step === 'reauth' && deleteReauthMethod === 'google'
  const cancelVerifiedGoogleDeletion =
    step === 'confirm' && deleteReauthMethod === 'google' && googleReauthVerified
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isPending) {
      return
    }

    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        onEscapeKeyDown={(event) => isPending && event.preventDefault()}
        onPointerDownOutside={(event) => isPending && event.preventDefault()}
      >
        {step === 'intent' ? (
          <>
            <DialogHeader>
              <DialogTitle>
                <FormattedMessage id="settings.account.delete.intentTitle" />
              </DialogTitle>
              <DialogDescription>
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
                onClick={() => onStepChange(deleteReauthMethod === 'none' ? 'confirm' : 'reauth')}
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
              <DialogDescription>
                <FormattedMessage
                  id={
                    googleReauthStep
                      ? 'settings.account.delete.googleReauthDescription'
                      : 'settings.account.delete.reauthDescription'
                  }
                />
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 p-4 sm:px-6">
              {!googleReauthStep ? (
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
              ) : null}
              {deleteError ? (
                <SettingsStatusMessage messageId="settings.account.delete.error" tone="error" />
              ) : null}
              <div className="flex justify-end gap-2">
                <Button
                  disabled={isPending}
                  variant="secondary"
                  onClick={() => onStepChange('intent')}
                >
                  <FormattedMessage id="action.back" />
                </Button>
                <Button
                  disabled={isPending || (!googleReauthStep && deletePassword.trim().length === 0)}
                  onClick={() => (googleReauthStep ? onSubmit() : onStepChange('confirm'))}
                >
                  <FormattedMessage
                    id={
                      googleReauthStep
                        ? 'settings.account.delete.continueWithGoogle'
                        : 'action.continue'
                    }
                  />
                </Button>
              </div>
            </div>
          </>
        ) : null}

        {step === 'confirm' ? (
          <>
            <DialogHeader>
              <DialogTitle>
                <FormattedMessage
                  id={
                    isPending
                      ? 'settings.account.delete.deletingTitle'
                      : 'settings.account.delete.confirmTitle'
                  }
                />
              </DialogTitle>
              <DialogDescription>
                <FormattedMessage
                  id={
                    isPending
                      ? 'settings.account.delete.deletingDescription'
                      : 'settings.account.delete.confirmDescription'
                  }
                />
              </DialogDescription>
            </DialogHeader>
            {isPending ? (
              <PendingState
                className="min-h-28 px-4 py-6"
                messageId="settings.account.delete.deleting"
              />
            ) : (
              <div className="space-y-4 p-4 sm:px-6">
                {deleteError ? (
                  <SettingsStatusMessage messageId="settings.account.delete.error" tone="error" />
                ) : null}
                {deleteError && googleReauthVerified ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={onRestartGoogleReauthentication}
                  >
                    <FormattedMessage id="settings.account.delete.verifyWithGoogleAgain" />
                  </Button>
                ) : null}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      cancelVerifiedGoogleDeletion ? onOpenChange(false) : onStepChange('reauth')
                    }
                  >
                    <FormattedMessage
                      id={cancelVerifiedGoogleDeletion ? 'action.cancel' : 'action.back'}
                    />
                  </Button>
                  <Button
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={onSubmit}
                  >
                    <FormattedMessage id="settings.account.delete.confirmAction" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
