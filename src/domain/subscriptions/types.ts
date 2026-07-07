export type SubscriptionSnapshot = {
  loading: boolean
  hasActiveEntitlement: boolean
  hasActiveGooglePlayAutoRenewingSubscription: boolean
  willRenew: boolean | null
  managementUrl: string | null
  expirationDate: string | null
}

export const emptySubscriptionSnapshot: SubscriptionSnapshot = {
  expirationDate: null,
  hasActiveEntitlement: false,
  hasActiveGooglePlayAutoRenewingSubscription: false,
  loading: false,
  managementUrl: null,
  willRenew: null,
}
