import type { FeedbackType } from '@/domain/feedback'

export const feedbackTypeOptions: { value: FeedbackType; labelId: string }[] = [
  { value: 'suggestion', labelId: 'settings.support.feedback.type.suggestion' },
  { value: 'problem', labelId: 'settings.support.feedback.type.problem' },
  { value: 'other', labelId: 'settings.support.feedback.type.other' },
]

export const supportAppVersion = import.meta.env.VITE_APP_VERSION ?? 'dev'
export const supportAppBuildNumber = import.meta.env.VITE_APP_BUILD_NUMBER ?? null
