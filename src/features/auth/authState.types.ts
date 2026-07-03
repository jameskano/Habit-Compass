import type { AppError } from '@/shared/utils/appError'
import type { AuthSessionUser, CurrentLegalStatus, UserAccountCapabilities } from '@/domain/auth'

export type AuthLifecycleState =
  | {
      status: 'initializing'
    }
  | {
      status: 'unauthenticated'
    }
  | {
      status: 'authenticated'
      user: AuthSessionUser
      capabilities: UserAccountCapabilities
      legalStatus: CurrentLegalStatus
    }
  | {
      status: 'error'
      error: AppError
    }

export type AuthContextValue = {
  state: AuthLifecycleState
  refreshAccountContext: () => Promise<void>
  signOut: () => Promise<void>
}
