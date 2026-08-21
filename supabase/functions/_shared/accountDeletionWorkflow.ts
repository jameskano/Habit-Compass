import { getRequiredGooglePlayRenewals, type RevenueCatSubscriberResponse } from './revenuecat.ts'

export type AccountDeletionStatus =
  | 'started'
  | 'subscriptions_cancelled'
  | 'revenuecat_deleted'
  | 'app_data_deleted'
  | 'auth_user_deleted'
  | 'failed'

export type AccountDeletionWorkflowResponse =
  | {
      deleted: true
      status: 200
    }
  | {
      deleted: false
      error: string
      status: 409 | 500
    }

export type AccountDeletionWorkflowDeps = {
  deleteAuthUser: () => Promise<{ error?: unknown | null }>
  deleteRevenueCatCustomer: () => Promise<void>
  loadRevenueCatCustomer: () => Promise<RevenueCatSubscriberResponse>
  removeFeedbackAttachments: () => Promise<void>
  updateOperation: (status: AccountDeletionStatus, failureCode?: string | null) => Promise<void>
  cancelGooglePlayRenewal: (storeTransactionId: string) => Promise<void>
}

export const runAccountDeletionWorkflow = async ({
  cancelGooglePlayRenewal,
  deleteAuthUser,
  deleteRevenueCatCustomer,
  loadRevenueCatCustomer,
  removeFeedbackAttachments,
  updateOperation,
}: AccountDeletionWorkflowDeps): Promise<AccountDeletionWorkflowResponse> => {
  const customer = await loadRevenueCatCustomer()
  const renewals = getRequiredGooglePlayRenewals(customer)

  try {
    for (const [, renewal] of renewals) {
      await cancelGooglePlayRenewal(String(renewal.store_transaction_id))
    }
  } catch {
    await updateOperation('failed', 'subscription_cancellation_failed')
    return {
      deleted: false,
      error: 'Subscription cancellation failed.',
      status: 500,
    }
  }

  await updateOperation('subscriptions_cancelled')

  const verifiedCustomer = await loadRevenueCatCustomer()
  if (getRequiredGooglePlayRenewals(verifiedCustomer).length > 0) {
    await updateOperation('failed', 'subscription_cancellation_unconfirmed')
    return {
      deleted: false,
      error: 'Subscription cancellation could not be confirmed.',
      status: 409,
    }
  }

  try {
    await deleteRevenueCatCustomer()
  } catch {
    await updateOperation('failed', 'revenuecat_deletion_failed')
    return {
      deleted: false,
      error: 'RevenueCat customer could not be deleted.',
      status: 500,
    }
  }

  await updateOperation('revenuecat_deleted')

  await removeFeedbackAttachments()
  await updateOperation('app_data_deleted')

  const { error: deleteUserError } = await deleteAuthUser()
  if (deleteUserError) {
    await updateOperation('failed', 'auth_user_deletion_failed')
    return {
      deleted: false,
      error: 'Account could not be deleted.',
      status: 500,
    }
  }

  await updateOperation('auth_user_deleted')

  return {
    deleted: true,
    status: 200,
  }
}
