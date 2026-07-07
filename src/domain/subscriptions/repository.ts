import type { Result } from '@/shared/utils/result'

import type { SubscriptionSnapshot } from './types'

export type SubscriptionRepository = {
  identifyUser(userId: string): Promise<Result<SubscriptionSnapshot>>
  getSnapshot(): Promise<Result<SubscriptionSnapshot>>
  clearIdentity(): Promise<Result<null>>
}
