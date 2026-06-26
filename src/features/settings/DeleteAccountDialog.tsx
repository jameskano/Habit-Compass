import { FormattedMessage } from 'react-intl'

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
import type { DeleteAccountStep } from './settings.types'

type DeleteAccountDialogProps = {
  deleteError: boolean
  deletePassword: string
  deleteRequiresPassword: boolean
  deletionPreviewLabel: string
  isPending: boolean
  open: boolean
  step: DeleteAccountStep
  onDeletePasswordChange: (password: string) => void
  onOpenChange: (open: boolean) => void
  onStepChange: (step: DeleteAccountStep) => void
  onSubmit: () => void
}

export const DeleteAccountDialog = ({
  deleteError,
  deletePassword,
  deleteRequiresPassword,
  deletionPreviewLabel,
  isPending,
  onDeletePasswordChange,
  onOpenChange,
  onStepChange,
  onSubmit,
  open,
  step,
}: DeleteAccountDialogProps) => (
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
          <div className="flex justify-end gap-2 p-4 sm:px-6">
            <DialogClose asChild>
              <Button variant="secondary">
                <FormattedMessage id="action.cancel" />
              </Button>
            </DialogClose>
            <Button onClick={() => onStepChange(deleteRequiresPassword ? 'reauth' : 'schedule')}>
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
                onClick={() => onStepChange('schedule')}
              >
                <FormattedMessage id="action.continue" />
              </Button>
            </div>
          </div>
        </>
      ) : null}

      {step === 'schedule' ? (
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
              <SettingsStatusMessage messageId="settings.account.delete.error" tone="error" />
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => onStepChange(deleteRequiresPassword ? 'reauth' : 'intent')}
              >
                <FormattedMessage id="action.back" />
              </Button>
              <Button
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isPending}
                onClick={onSubmit}
              >
                <FormattedMessage id="settings.account.delete" />
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </DialogContent>
  </Dialog>
)
