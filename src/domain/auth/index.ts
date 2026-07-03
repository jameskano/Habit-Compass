export { canShowSecurityAndSignIn, classifyAccountProviders } from './providerClassification'
export { legalStatusRequiresAcceptance } from './legalStatus'
export type { AuthRepository } from './repository'
export { accountProviderClassifications } from './types'
export type {
  AccountProviderClassification,
  AuthEventName,
  AuthIdentity,
  AuthSessionSnapshot,
  AuthSessionUser,
  AuthStateChangeHandler,
  AuthSecurityProfile,
  AuthSubscription,
  CurrentLegalStatus,
  RequestEmailChangeInput,
  RequestEmailChangeResult,
  UpdatePasswordInput,
  UserAccountCapabilities,
} from './types'
