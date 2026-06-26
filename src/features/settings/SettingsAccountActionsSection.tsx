import { LogOut, Trash2 } from 'lucide-react'

import type { AccountProviderClassification } from '@/domain/auth'

import { DeleteAccountDialog } from './DeleteAccountDialog'
import { SignOutDialog } from './SignOutDialog'
import { SettingsRow } from './components/SettingsRow'
import { SettingsSection } from './components/SettingsSection'
import { useSettingsAccountActions } from './useSettingsAccountActions'

type SettingsAccountActionsSectionProps = {
  providerClassification: AccountProviderClassification | undefined
}

export const SettingsAccountActionsSection = ({
  providerClassification,
}: SettingsAccountActionsSectionProps) => {
  const {
    deleteAccountDialog,
    openDeleteAccountDialog,
    openSignOutDialog,
    signOutDialog,
  } = useSettingsAccountActions(providerClassification)

  return (
    <>
      <SettingsSection titleId="settings.account.title">
        <SettingsRow
          icon={LogOut}
          labelId="settings.account.signOut"
          onClick={openSignOutDialog}
        />
        <SettingsRow
          destructive
          icon={Trash2}
          labelId="settings.account.delete"
          onClick={openDeleteAccountDialog}
        />
      </SettingsSection>

      <SignOutDialog {...signOutDialog} />
      <DeleteAccountDialog {...deleteAccountDialog} />
    </>
  )
}
