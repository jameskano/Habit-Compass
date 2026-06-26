import { LifeBuoy, Star } from 'lucide-react'
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

import { SettingsRow } from './components/SettingsRow'
import { SettingsSection } from './components/SettingsSection'

type SettingsSupportSectionProps = {
  onOpenRateDialog: () => void
}

type RateAppUnavailableDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const SettingsSupportSection = ({ onOpenRateDialog }: SettingsSupportSectionProps) => (
  <SettingsSection titleId="settings.support.title">
    <SettingsRow
      descriptionId="settings.support.rate.description"
      icon={Star}
      labelId="settings.support.rate.title"
      onClick={onOpenRateDialog}
    />
    <SettingsRow icon={LifeBuoy} labelId="settings.support.feedback" to="/settings/support" />
  </SettingsSection>
)

export const RateAppUnavailableDialog = ({
  onOpenChange,
  open,
}: RateAppUnavailableDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent aria-describedby="rate-app-description">
      <DialogHeader>
        <DialogTitle>
          <FormattedMessage id="settings.support.rate.title" />
        </DialogTitle>
        <DialogDescription id="rate-app-description">
          <FormattedMessage id="settings.support.rate.unavailable" />
        </DialogDescription>
      </DialogHeader>
      <div className="flex justify-end p-4 sm:px-6">
        <DialogClose asChild>
          <Button variant="secondary">
            <FormattedMessage id="action.close" />
          </Button>
        </DialogClose>
      </div>
    </DialogContent>
  </Dialog>
)
