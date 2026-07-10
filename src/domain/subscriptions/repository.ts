import type { Result } from '@/shared/utils/result'

import type {
  PaywallPresentationResult,
  SubscriptionOffering,
  SubscriptionProductId,
  SubscriptionSnapshot,
} from './types'

export type SubscriptionRepository = {
  identifyUser(userId: string): Promise<Result<SubscriptionSnapshot>>
  getSnapshot(): Promise<Result<SubscriptionSnapshot>>
  getCurrentOffering(): Promise<Result<SubscriptionOffering | null>>
  purchaseProduct(productId: SubscriptionProductId): Promise<Result<SubscriptionSnapshot>>
  restorePurchases(): Promise<Result<SubscriptionSnapshot>>
  presentPaywall(): Promise<Result<PaywallPresentationResult>>
  presentCustomerCenter(): Promise<Result<null>>
  clearIdentity(): Promise<Result<null>>
}
