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

import { SettingsStatusMessage } from './components/SettingsStatusMessage'

type SignOutDialogProps = {
  error: boolean
  isPending: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export const SignOutDialog = ({
  error,
  isPending,
  onConfirm,
  onOpenChange,
  open,
}: SignOutDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
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
        {error ? (
          <SettingsStatusMessage messageId="settings.account.signOut.error" tone="error" />
        ) : null}
        <div className="flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="secondary">
              <FormattedMessage id="action.cancel" />
            </Button>
          </DialogClose>
          <Button disabled={isPending} onClick={onConfirm}>
            <FormattedMessage id="settings.account.signOut" />
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)
