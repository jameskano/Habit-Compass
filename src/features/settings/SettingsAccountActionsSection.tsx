import { LogOut, Trash2 } from 'lucide-react'

import type { UserAccountCapabilities } from '@/domain/auth'

import { DeleteAccountDialog } from './DeleteAccountDialog'
import { SignOutDialog } from './SignOutDialog'
import { SettingsRow } from './components/SettingsRow'
import { SettingsSection } from './components/SettingsSection'
import { useSettingsAccountActions } from './useSettingsAccountActions'
import { useSubscriptionSnapshotQuery } from './useSubscriptionSnapshotQuery'

type SettingsAccountActionsSectionProps = {
  accountCapabilities: UserAccountCapabilities | undefined
}

export const SettingsAccountActionsSection = ({
  accountCapabilities,
}: SettingsAccountActionsSectionProps) => {
  const subscriptionSnapshot = useSubscriptionSnapshotQuery()
  const { deleteAccountDialog, openDeleteAccountDialog, openSignOutDialog, signOutDialog } =
    useSettingsAccountActions(accountCapabilities)

  return (
    <>
      <SettingsSection titleId="settings.account.title">
        <SettingsRow icon={LogOut} labelId="settings.account.signOut" onClick={openSignOutDialog} />
        <SettingsRow
          destructive
          icon={Trash2}
          labelId="settings.account.delete"
          onClick={openDeleteAccountDialog}
        />
      </SettingsSection>

      <SignOutDialog {...signOutDialog} />
      <DeleteAccountDialog
        {...deleteAccountDialog}
        subscriptionSnapshot={subscriptionSnapshot.data}
        subscriptionSnapshotLoading={subscriptionSnapshot.isLoading}
      />
    </>
  )
}
