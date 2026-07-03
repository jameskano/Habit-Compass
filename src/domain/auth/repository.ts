import type { Result } from '@/shared/utils/result'

import type {
  AccountProviderClassification,
  AuthStateChangeHandler,
  AuthSessionSnapshot,
  AuthSessionUser,
  AuthSecurityProfile,
  AuthSubscription,
  CurrentLegalStatus,
  RequestEmailChangeInput,
  RequestEmailChangeResult,
  UpdatePasswordInput,
  UserAccountCapabilities,
} from './types'

export type AuthRepository = {
  getStoredSession(): Promise<Result<AuthSessionSnapshot | null>>
  getVerifiedUser(): Promise<Result<AuthSessionUser | null>>
  subscribeToAuthChanges(handler: AuthStateChangeHandler): AuthSubscription
  ensureUserProvisioned(): Promise<Result<UserAccountCapabilities>>
  getCurrentLegalStatus(): Promise<Result<CurrentLegalStatus>>
  getProviderClassification(): Promise<Result<AccountProviderClassification>>
  getSecurityProfile(): Promise<Result<AuthSecurityProfile>>
  requestEmailChange(input: RequestEmailChangeInput): Promise<Result<RequestEmailChangeResult>>
  updatePassword(input: UpdatePasswordInput): Promise<Result<null>>
  sendPasswordReset(): Promise<Result<null>>
  signOutLocal(): Promise<Result<null>>
}
