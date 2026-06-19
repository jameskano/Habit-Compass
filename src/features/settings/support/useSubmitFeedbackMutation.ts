import { useMutation } from '@tanstack/react-query'

import type { CreateFeedbackSubmissionInput } from '@/domain/feedback'
import { feedbackRepository } from '@/integrations/repositories'
import { unwrapResult } from '@/shared/utils/result'

export const useSubmitFeedbackMutation = () => {
  return useMutation({
    mutationFn: async (input: CreateFeedbackSubmissionInput) =>
      unwrapResult(await feedbackRepository.submit(input)),
  })
}
