import type { Result } from '@/shared/utils/result'

import type { AppSettings } from './types'

export type AppProfilePreferences = Pick<AppSettings, 'locale' | 'theme' | 'weekStartsOn'>

export type OnboardingStatus = {
  onboardingCompletedAt: string | null
}

export type ProfileSettings = AppProfilePreferences & OnboardingStatus

export type CompletedOnboardingStatus = {
  onboardingCompletedAt: string
}

export type SettingsRepository = {
  getProfileSettings(): Promise<Result<ProfileSettings>>
  getOnboardingStatus(): Promise<Result<OnboardingStatus>>
  updateProfilePreferences(
    preferences: Partial<AppProfilePreferences>,
  ): Promise<Result<AppProfilePreferences>>
  completeOnboarding(completedAt: string): Promise<Result<CompletedOnboardingStatus>>
}
