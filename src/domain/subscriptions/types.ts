export type SubscriptionSnapshot = {
  loading: boolean
  hasActiveEntitlement: boolean
  hasActiveGooglePlayAutoRenewingSubscription: boolean
  willRenew: boolean | null
  managementUrl: string | null
  expirationDate: string | null
}

export type SubscriptionProductId = 'lifetime' | 'yearly' | 'monthly'

export type SubscriptionProduct = {
  id: SubscriptionProductId
  title: string
  description: string
  price: string
}

export type SubscriptionOffering = {
  id: string
  products: SubscriptionProduct[]
}

export type PaywallPresentationResult =
  | 'not_presented'
  | 'cancelled'
  | 'purchased'
  | 'restored'
  | 'error'

export const emptySubscriptionSnapshot: SubscriptionSnapshot = {
  expirationDate: null,
  hasActiveEntitlement: false,
  hasActiveGooglePlayAutoRenewingSubscription: false,
  loading: false,
  managementUrl: null,
  willRenew: null,
}
