import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useIntl } from 'react-intl'

import { calculateDeletionScheduledFor } from '@/domain/accountLifecycle'
import type { AccountProviderClassification } from '@/domain/auth'
import { useRequestAccountDeletionMutation } from '@/features/account/useAccountLifecycleMutations'

import { accountDeletionRequiresPassword } from './settingsAccountActions.utils'
import type { DeleteAccountStep } from './settings.types'
import { useSignOutMutation } from './useSignOutMutation'

export const useSettingsAccountActions = (
  providerClassification: AccountProviderClassification | undefined,
) => {
  const navigate = useNavigate()
  const intl = useIntl()
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false)
  const [signOutError, setSignOutError] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteStep, setDeleteStep] = useState<DeleteAccountStep>('intent')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState(false)
  const signOutMutation = useSignOutMutation()
  const requestAccountDeletion = useRequestAccountDeletionMutation()
  const deleteRequiresPassword = accountDeletionRequiresPassword(providerClassification)
  const deletionPreviewLabel = intl.formatDate(calculateDeletionScheduledFor(new Date()), {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  const openSignOutDialog = () => {
    setSignOutError(false)
    setSignOutDialogOpen(true)
  }

  const openDeleteAccountDialog = () => {
    setDeleteStep('intent')
    setDeletePassword('')
    setDeleteError(false)
    setDeleteDialogOpen(true)
  }

  const setDeleteDialogOpenState = (open: boolean) => {
    setDeleteDialogOpen(open)
    if (!open) {
      setDeleteStep('intent')
      setDeletePassword('')
      setDeleteError(false)
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
        navigate({ to: '/signed-out' })
      },
      onError: () => setSignOutError(true),
    })
  }

  const submitAccountDeletion = () => {
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

  return {
    deleteAccountDialog: {
      deleteError,
      deletePassword,
      deleteRequiresPassword,
      deletionPreviewLabel,
      isPending: requestAccountDeletion.isPending,
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
