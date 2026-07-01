import type {
  AccountDeletionRequestResult,
  AccountLifecycleRepository,
  AccountLifecycleState,
  CancelAccountDeletionResult,
  RequestAccountDeletionInput,
  RequestExternalAccountDeletionResult,
  RequestExternalAccountDeletionInput,
} from '@/domain/accountLifecycle'
import { createAppError } from '@/shared/utils/appError'
import { err, ok } from '@/shared/utils/result'

import { getSupabaseClient } from '../client'

type ProfileLifecycleRow = {
  id: string
  account_status: AccountLifecycleState['accountStatus']
  deletion_requested_at: string | null
  deletion_scheduled_for: string | null
  deletion_cancelled_at?: string | null
  deletion_request_source?: AccountLifecycleState['deletionRequestSource']
}

const mapProfileLifecycle = (row: ProfileLifecycleRow): AccountLifecycleState => ({
  userId: row.id,
  accountStatus: row.account_status,
  deletionRequestedAt: row.deletion_requested_at,
  deletionScheduledFor: row.deletion_scheduled_for,
  deletionCancelledAt: row.deletion_cancelled_at ?? null,
  deletionRequestSource: row.deletion_request_source ?? null,
})

const toUnknownError = (message: string, cause: unknown) =>
  createAppError('unknown', message, { cause })

export const supabaseAccountLifecycleRepository: AccountLifecycleRepository = {
  async getAccountLifecycle() {
    const supabase = getSupabaseClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      return err(
        createAppError('unauthorized', 'Could not load account status.', { cause: userError }),
      )
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(
        'id, account_status, deletion_requested_at, deletion_scheduled_for, deletion_cancelled_at, deletion_request_source',
      )
      .eq('id', userData.user.id)
      .single()

    if (error || !data) {
      return err(toUnknownError('Could not load account status.', error))
    }

    return ok(mapProfileLifecycle(data as ProfileLifecycleRow))
  },

  async requestAccountDeletion(input: RequestAccountDeletionInput) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.functions.invoke('request-account-deletion', {
      body: input,
    })

    if (error) {
      return err(
        createAppError('unauthorized', 'Account deletion could not be scheduled.', {
          cause: error,
        }),
      )
    }

    return ok(data as AccountDeletionRequestResult)
  },

  async cancelAccountDeletion() {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.functions.invoke('cancel-account-deletion')

    if (error) {
      return err(toUnknownError('Account deletion could not be cancelled.', error))
    }

    return ok(data as CancelAccountDeletionResult)
  },

  async requestExternalAccountDeletion(input: RequestExternalAccountDeletionInput) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase.functions.invoke('request-external-account-deletion', {
      body: input,
    })

    if (error) {
      return err(toUnknownError('Account deletion request could not be started.', error))
    }

    return ok(data as RequestExternalAccountDeletionResult)
  },
}
