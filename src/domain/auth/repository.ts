import type { Result } from '@/shared/utils/result'

import type {
  AccountProviderClassification,
  AcceptCurrentLegalDocumentsInput,
  CurrentLegalVersions,
  AuthStateChangeHandler,
  AuthSessionSnapshot,
  AuthSessionUser,
  AuthSecurityProfile,
  AuthSubscription,
  CurrentLegalStatus,
  ExchangeAuthCodeInput,
  RequestEmailCodeInput,
  RequestEmailChangeInput,
  RequestEmailChangeResult,
  RequestPasswordResetInput,
  ResendSignupConfirmationInput,
  SignInWithGoogleInput,
  SignInWithPasswordInput,
  SignUpWithPasswordInput,
  UpdatePasswordInput,
  UpdateRecoveredPasswordInput,
  VerifyEmailCodeInput,
  UserAccountCapabilities,
} from './types'

export type AuthRepository = {
  getStoredSession(): Promise<Result<AuthSessionSnapshot | null>>
  getVerifiedUser(): Promise<Result<AuthSessionUser | null>>
  subscribeToAuthChanges(handler: AuthStateChangeHandler): AuthSubscription
  ensureUserProvisioned(): Promise<Result<UserAccountCapabilities>>
  getCurrentLegalStatus(): Promise<Result<CurrentLegalStatus>>
  getProviderClassification(): Promise<Result<AccountProviderClassification>>
  getAccountCapabilities(): Promise<Result<UserAccountCapabilities>>
  getSecurityProfile(): Promise<Result<AuthSecurityProfile>>
  signInWithPassword(input: SignInWithPasswordInput): Promise<Result<null>>
  requestEmailCode(input: RequestEmailCodeInput): Promise<Result<null>>
  verifyEmailCode(input: VerifyEmailCodeInput): Promise<Result<null>>
  signUpWithPassword(input: SignUpWithPasswordInput): Promise<Result<null>>
  signInWithGoogle(input: SignInWithGoogleInput): Promise<Result<null>>
  resendSignupConfirmation(input: ResendSignupConfirmationInput): Promise<Result<null>>
  requestPasswordReset(input: RequestPasswordResetInput): Promise<Result<null>>
  exchangeAuthCode(input: ExchangeAuthCodeInput): Promise<Result<null>>
  updateRecoveredPassword(input: UpdateRecoveredPasswordInput): Promise<Result<null>>
  getCurrentLegalVersions(): Promise<Result<CurrentLegalVersions>>
  acceptCurrentLegalDocuments(input: AcceptCurrentLegalDocumentsInput): Promise<Result<null>>
  requestEmailChange(input: RequestEmailChangeInput): Promise<Result<RequestEmailChangeResult>>
  updatePassword(input: UpdatePasswordInput): Promise<Result<null>>
  sendPasswordReset(): Promise<Result<null>>
  signOutLocal(): Promise<Result<null>>
}
