import type { SubscriptionRepository } from '@/domain/subscriptions'
import { ok } from '@/shared/utils/result'

import { emptySubscriptionSnapshot } from '@/domain/subscriptions'

import { getMockState } from './mockData'

export const mockSubscriptionRepository: SubscriptionRepository = {
  async identifyUser(userId) {
    const subscription = getMockState().subscription
    subscription.identifiedUserIds.push(userId)
    return ok(subscription.snapshot)
  },

  async getSnapshot() {
    return ok(getMockState().subscription.snapshot)
  },

  async getCurrentOffering() {
    return ok(null)
  },

  async purchaseProduct() {
    return ok(getMockState().subscription.snapshot)
  },

  async restorePurchases() {
    return ok(getMockState().subscription.snapshot)
  },

  async presentPaywall() {
    return ok('not_presented')
  },

  async presentCustomerCenter() {
    return ok(null)
  },

  async clearIdentity() {
    const subscription = getMockState().subscription
    subscription.clearRequests += 1
    subscription.snapshot = emptySubscriptionSnapshot
    return ok(null)
  },
}
