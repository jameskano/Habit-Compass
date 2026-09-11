import { useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import type { UserAccountCapabilities } from '@/domain/auth'
import { useDeleteAccountMutation } from '@/features/account/useAccountLifecycleMutations'
import { saveAccountDeletionSuccessState } from '@/features/auth/accountDeletionSuccessState'
import { getAuthCallbackUrl } from '@/features/auth/authRedirects'
import { useAuth } from '@/features/auth/authContext'
import {
  clearPendingAccountDeletionState,
  readPendingAccountDeletionState,
  savePendingAccountDeletionState,
} from '@/features/auth/pendingAccountDeletionState'
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
  const [googleReauthVerified, setGoogleReauthVerified] = useState(false)
  const [deletionIdempotencyKey, setDeletionIdempotencyKey] = useState<string>(() =>
    crypto.randomUUID(),
  )
  const signOutMutation = useSignOutMutation()
  const deleteAccount = useDeleteAccountMutation()
  const deleteRequiresPassword = accountDeletionRequiresPassword(accountCapabilities)
  const deleteReauthMethod: DeleteAccountReauthMethod = deleteRequiresPassword
    ? 'password'
    : accountCapabilities?.googleEnabled
      ? 'google'
      : 'none'
  const deletionPending = deleteAccount.isPending || deleteGooglePending

  useEffect(() => {
    const pendingDeletion = readPendingAccountDeletionState()

    if (!pendingDeletion || pendingDeletion.phase !== 'google_verified') {
      return
    }

    if (state.status !== 'authenticated' || !accountCapabilities) {
      return
    }

    if (!accountCapabilities.googleEnabled || pendingDeletion.originalUserId !== state.user.id) {
      clearPendingAccountDeletionState()
      return
    }

    setDeletionIdempotencyKey(pendingDeletion.idempotencyKey)
    setGoogleReauthVerified(true)
    setDeleteError(false)
    setDeleteStep('confirm')
    setDeleteDialogOpen(true)
  }, [accountCapabilities, state])

  const resetDeleteDialog = () => {
    setDeleteStep('intent')
    setDeletePassword('')
    setDeleteError(false)
    setDeleteGooglePending(false)
    setGoogleReauthVerified(false)
  }

  const openSignOutDialog = () => {
    setSignOutError(false)
    setSignOutDialogOpen(true)
  }

  const openDeleteAccountDialog = () => {
    clearPendingAccountDeletionState()
    resetDeleteDialog()
    setDeletionIdempotencyKey(crypto.randomUUID())
    setDeleteDialogOpen(true)
  }

  const setDeleteDialogOpenState = (open: boolean) => {
    if (!open && deletionPending) {
      return
    }

    setDeleteDialogOpen(open)
    if (!open) {
      clearPendingAccountDeletionState()
      resetDeleteDialog()
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

  const startGoogleReauthentication = () => {
    if (state.status !== 'authenticated') {
      setDeleteError(true)
      return
    }

    setDeleteError(false)
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
        clearPendingAccountDeletionState()
        setDeleteGooglePending(false)
        setDeleteError(true)
      })
  }

  const completeAccountDeletion = () => {
    const input =
      deleteReauthMethod === 'password'
        ? {
            currentPassword: deletePassword,
            idempotencyKey: deletionIdempotencyKey,
            reauthProvider: 'password' as const,
          }
        : {
            idempotencyKey: deletionIdempotencyKey,
            reauthProvider: 'google' as const,
          }

    deleteAccount.mutate(input, {
      onSuccess: async () => {
        saveAccountDeletionSuccessState()
        clearPendingAccountDeletionState()
        setDeleteDialogOpen(false)
        await navigate({ replace: true, to: '/auth/account-deleted' as never })
        await clearDeletedAccountState()
      },
      onError: () => setDeleteError(true),
    })
  }

  const submitAccountDeletion = () => {
    if (deleteReauthMethod === 'google') {
      if (!googleReauthVerified) {
        startGoogleReauthentication()
        return
      }

      completeAccountDeletion()
      return
    }

    if (deleteReauthMethod === 'none') {
      setDeleteError(true)
      return
    }

    completeAccountDeletion()
  }

  const restartGoogleReauthentication = () => {
    clearPendingAccountDeletionState()
    setGoogleReauthVerified(false)
    setDeleteError(false)
    setDeleteStep('reauth')
  }

  return {
    deleteAccountDialog: {
      deleteError,
      deletePassword,
      deleteReauthMethod,
      googleReauthVerified,
      isPending: deletionPending,
      onDeletePasswordChange: setCurrentDeletePassword,
      onOpenChange: setDeleteDialogOpenState,
      onRestartGoogleReauthentication: restartGoogleReauthentication,
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
