import type { Result } from '@/shared/utils/result'

import type {
  AccountProviderClassification,
  AuthSecurityProfile,
  RequestEmailChangeInput,
  RequestEmailChangeResult,
  UpdatePasswordInput,
} from './types'

export type AuthRepository = {
  getProviderClassification(): Promise<Result<AccountProviderClassification>>
  getSecurityProfile(): Promise<Result<AuthSecurityProfile>>
  requestEmailChange(input: RequestEmailChangeInput): Promise<Result<RequestEmailChangeResult>>
  updatePassword(input: UpdatePasswordInput): Promise<Result<null>>
  sendPasswordReset(): Promise<Result<null>>
  signOutLocal(): Promise<Result<null>>
}
