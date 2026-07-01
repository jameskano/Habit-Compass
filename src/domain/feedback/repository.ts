import type { Result } from '@/shared/utils/result'

import type { CreateFeedbackSubmissionInput, FeedbackSubmission } from './types'

export type FeedbackRepository = {
  submit(input: CreateFeedbackSubmissionInput): Promise<Result<FeedbackSubmission>>
}
