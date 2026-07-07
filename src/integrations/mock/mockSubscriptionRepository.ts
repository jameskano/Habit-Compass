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

  async clearIdentity() {
    const subscription = getMockState().subscription
    subscription.clearRequests += 1
    subscription.snapshot = emptySubscriptionSnapshot
    return ok(null)
  },
}
