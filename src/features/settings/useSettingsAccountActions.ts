import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import type { UserAccountCapabilities } from '@/domain/auth'
import { useDeleteAccountMutation } from '@/features/account/useAccountLifecycleMutations'
import { getAuthCallbackUrl } from '@/features/auth/authRedirects'
import { useAuth } from '@/features/auth/authContext'
import { savePendingAccountDeletionState } from '@/features/auth/pendingAccountDeletionState'
import { authRepository } from '@/integrations/repositories'
import { unwrapResult } from '@/shared/utils/result'

import { accountDeletionRequiresPassword } from './settingsAccountActions.utils'
import type { DeleteAccountReauthMethod, DeleteAccountStep } from './settings.types'
import { useSignOutMutation } from './useSignOutMutation'

export const useSettingsAccountActions = (
  accountCapabilities: UserAccountCapabilities | undefined,
) => {
  const navigate = useNavigate()
  const { clearDeletedAccountState, state } = useAuth()
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false)
  const [signOutError, setSignOutError] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteStep, setDeleteStep] = useState<DeleteAccountStep>('intent')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState(false)
  const [deleteGooglePending, setDeleteGooglePending] = useState(false)
  const [deletionIdempotencyKey, setDeletionIdempotencyKey] = useState(() => crypto.randomUUID())
  const signOutMutation = useSignOutMutation()
  const deleteAccount = useDeleteAccountMutation()
  const deleteRequiresPassword = accountDeletionRequiresPassword(accountCapabilities)
  const deleteReauthMethod: DeleteAccountReauthMethod = deleteRequiresPassword
    ? 'password'
    : accountCapabilities?.googleEnabled
      ? 'google'
      : 'none'

  const openSignOutDialog = () => {
    setSignOutError(false)
    setSignOutDialogOpen(true)
  }

  const openDeleteAccountDialog = () => {
    setDeleteStep('intent')
    setDeletePassword('')
    setDeleteError(false)
    setDeletionIdempotencyKey(crypto.randomUUID())
    setDeleteDialogOpen(true)
  }

  const setDeleteDialogOpenState = (open: boolean) => {
    setDeleteDialogOpen(open)
    if (!open) {
      setDeleteStep('intent')
      setDeletePassword('')
      setDeleteError(false)
      setDeleteGooglePending(false)
    }
  }

  const setCurrentDeletePassword = (nextPassword: string) => {
    setDeleteError(false)
    setDeletePassword(nextPassword)
  }

  const confirmSignOut = () => {
    signOutMutation.mutate(undefined, {
      onSuccess: () => {
        setSignOutDialogOpen(false)
        navigate({ to: '/auth/sign-in' })
      },
      onError: () => setSignOutError(true),
    })
  }

  const submitAccountDeletion = () => {
    if (deleteReauthMethod === 'google') {
      if (state.status !== 'authenticated') {
        setDeleteError(true)
        return
      }

      setDeleteGooglePending(true)
      savePendingAccountDeletionState({
        idempotencyKey: deletionIdempotencyKey,
        originalUserId: state.user.id,
      })
      authRepository
        .signInWithGoogle({ redirectTo: getAuthCallbackUrl('delete-account') })
        .then((result) => {
          unwrapResult(result)
        })
        .catch(() => {
          setDeleteGooglePending(false)
          setDeleteError(true)
        })
      return
    }

    if (deleteReauthMethod === 'none') {
      setDeleteError(true)
      return
    }

    deleteAccount.mutate(
      {
        currentPassword: deletePassword,
        idempotencyKey: deletionIdempotencyKey,
        reauthProvider: 'password',
      },
      {
        onSuccess: async () => {
          setDeleteDialogOpen(false)
          await clearDeletedAccountState()
          navigate({ to: '/auth/sign-in' })
        },
        onError: () => setDeleteError(true),
      },
    )
  }

  return {
    deleteAccountDialog: {
      deleteError,
      deletePassword,
      deleteReauthMethod,
      isPending: deleteAccount.isPending || deleteGooglePending,
      onDeletePasswordChange: setCurrentDeletePassword,
      onOpenChange: setDeleteDialogOpenState,
      onStepChange: setDeleteStep,
      onSubmit: submitAccountDeletion,
      open: deleteDialogOpen,
      step: deleteStep,
    },
    openDeleteAccountDialog,
    openSignOutDialog,
    signOutDialog: {
      error: signOutError,
      isPending: signOutMutation.isPending,
      onConfirm: confirmSignOut,
      onOpenChange: setSignOutDialogOpen,
      open: signOutDialogOpen,
    },
  }
}
