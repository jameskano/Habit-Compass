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
      onboardingCompletedAt: string | null
    }
  | {
      status: 'error'
      error: AppError
    }

export type AuthContextValue = {
  state: AuthLifecycleState
  clearDeletedAccountState: () => Promise<void>
  refreshAccountContext: () => Promise<void>
  signOut: () => Promise<void>
}
