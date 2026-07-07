import type { Result } from '@/shared/utils/result'

export type OnboardingStatus = {
  onboardingCompletedAt: string | null
}

export type CompletedOnboardingStatus = {
  onboardingCompletedAt: string
}

export type SettingsRepository = {
  getOnboardingStatus(): Promise<Result<OnboardingStatus>>
  completeOnboarding(completedAt: string): Promise<Result<CompletedOnboardingStatus>>
}
