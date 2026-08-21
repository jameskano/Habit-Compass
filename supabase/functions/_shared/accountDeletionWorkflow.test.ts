import { describe, expect, it } from 'vitest'

import {
  runAccountDeletionWorkflow,
  type AccountDeletionWorkflowDeps,
} from './accountDeletionWorkflow'
import type { RevenueCatSubscriberResponse } from './revenuecat'

const futureDate = '2099-01-01T00:00:00Z'

const customerWithRenewal = (transactionId = 'play-token-1'): RevenueCatSubscriberResponse => ({
  subscriber: {
    subscriptions: {
      premium: {
        expires_date: futureDate,
        store: 'play_store',
        store_transaction_id: transactionId,
        unsubscribe_detected_at: null,
      },
    },
  },
})

const customerWithoutRenewal = (): RevenueCatSubscriberResponse => ({
  subscriber: {
    subscriptions: {
      premium: {
        expires_date: futureDate,
        store: 'play_store',
        store_transaction_id: 'play-token-1',
        unsubscribe_detected_at: '2098-01-01T00:00:00Z',
      },
    },
  },
})

const buildDeps = (
  customers: RevenueCatSubscriberResponse[],
  events: string[],
  overrides: Partial<AccountDeletionWorkflowDeps> = {},
): AccountDeletionWorkflowDeps => {
  let loadIndex = 0

  return {
    cancelGooglePlayRenewal: async (storeTransactionId) => {
      events.push(`cancel:${storeTransactionId}`)
    },
    deleteAuthUser: async () => {
      events.push('delete-auth-user')
      return { error: null }
    },
    deleteRevenueCatCustomer: async () => {
      events.push('delete-revenuecat-customer')
    },
    loadRevenueCatCustomer: async () => {
      events.push('load-revenuecat-customer')
      const customer = customers[Math.min(loadIndex, customers.length - 1)]
      loadIndex += 1
      return customer
    },
    removeFeedbackAttachments: async () => {
      events.push('remove-feedback-attachments')
    },
    updateOperation: async (status, failureCode = null) => {
      events.push(failureCode ? `status:${status}:${failureCode}` : `status:${status}`)
    },
    ...overrides,
  }
}

describe('runAccountDeletionWorkflow', () => {
  it('cancels Play renewals before deleting RevenueCat, app data, and the Auth user', async () => {
    const events: string[] = []
    const result = await runAccountDeletionWorkflow(
      buildDeps([customerWithRenewal(), customerWithoutRenewal()], events),
    )

    expect(result).toEqual({ deleted: true, status: 200 })
    expect(events).toEqual([
      'load-revenuecat-customer',
      'cancel:play-token-1',
      'status:subscriptions_cancelled',
      'load-revenuecat-customer',
      'delete-revenuecat-customer',
      'status:revenuecat_deleted',
      'remove-feedback-attachments',
      'status:app_data_deleted',
      'delete-auth-user',
      'status:auth_user_deleted',
    ])
  })

  it('stops before RevenueCat deletion and Auth deletion when subscription cancellation fails', async () => {
    const events: string[] = []
    const result = await runAccountDeletionWorkflow(
      buildDeps([customerWithRenewal()], events, {
        cancelGooglePlayRenewal: async (storeTransactionId) => {
          events.push(`cancel:${storeTransactionId}`)
          throw new Error('subscription_cancellation_failed')
        },
      }),
    )

    expect(result).toEqual({
      deleted: false,
      error: 'Subscription cancellation failed.',
      status: 500,
    })
    expect(events).toEqual([
      'load-revenuecat-customer',
      'cancel:play-token-1',
      'status:failed:subscription_cancellation_failed',
    ])
  })

  it('stops before RevenueCat deletion when cancellation cannot be confirmed', async () => {
    const events: string[] = []
    const result = await runAccountDeletionWorkflow(
      buildDeps([customerWithRenewal(), customerWithRenewal()], events),
    )

    expect(result).toEqual({
      deleted: false,
      error: 'Subscription cancellation could not be confirmed.',
      status: 409,
    })
    expect(events).toEqual([
      'load-revenuecat-customer',
      'cancel:play-token-1',
      'status:subscriptions_cancelled',
      'load-revenuecat-customer',
      'status:failed:subscription_cancellation_unconfirmed',
    ])
  })

  it('stops before app data and Auth deletion when RevenueCat customer deletion fails', async () => {
    const events: string[] = []
    const result = await runAccountDeletionWorkflow(
      buildDeps([customerWithoutRenewal(), customerWithoutRenewal()], events, {
        deleteRevenueCatCustomer: async () => {
          events.push('delete-revenuecat-customer')
          throw new Error('revenuecat_deletion_failed')
        },
      }),
    )

    expect(result).toEqual({
      deleted: false,
      error: 'RevenueCat customer could not be deleted.',
      status: 500,
    })
    expect(events).toEqual([
      'load-revenuecat-customer',
      'status:subscriptions_cancelled',
      'load-revenuecat-customer',
      'delete-revenuecat-customer',
      'status:failed:revenuecat_deletion_failed',
    ])
  })

  it('can be retried successfully after a transient cancellation failure', async () => {
    const failedEvents: string[] = []
    const failedResult = await runAccountDeletionWorkflow(
      buildDeps([customerWithRenewal()], failedEvents, {
        cancelGooglePlayRenewal: async (storeTransactionId) => {
          failedEvents.push(`cancel:${storeTransactionId}`)
          throw new Error('temporary_failure')
        },
      }),
    )

    const retryEvents: string[] = []
    const retryResult = await runAccountDeletionWorkflow(
      buildDeps([customerWithRenewal(), customerWithoutRenewal()], retryEvents),
    )

    expect(failedResult.deleted).toBe(false)
    expect(retryResult).toEqual({ deleted: true, status: 200 })
    expect(retryEvents).toContain('status:auth_user_deleted')
  })
})
