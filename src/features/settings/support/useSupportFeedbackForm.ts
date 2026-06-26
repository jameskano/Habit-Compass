import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'

import { MOCK_USER_ID } from '@/integrations/mock/mockData'

import { FeedbackFormSchema, type FeedbackFormValues } from './supportFeedback.schema'
import {
  buildAttachmentInput,
  buildTechnicalDetails,
  validateScreenshotFile,
} from './supportFeedback.utils'
import { useSubmitFeedbackMutation } from './useSubmitFeedbackMutation'

type SupportFeedbackStatus = 'idle' | 'offline' | 'success' | 'error'

type UseSupportFeedbackFormInput = {
  locale: string
  pathname: string
}

export const useSupportFeedbackForm = ({ locale, pathname }: UseSupportFeedbackFormInput) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileErrorId, setFileErrorId] = useState<string | null>(null)
  const [status, setStatus] = useState<SupportFeedbackStatus>('idle')
  const submitFeedback = useSubmitFeedbackMutation()
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(FeedbackFormSchema) as Resolver<FeedbackFormValues>,
    defaultValues: {
      type: 'suggestion',
      message: '',
      replyEmail: null,
    },
  })

  const handleFileChange = (fileList: FileList | null) => {
    const result = validateScreenshotFile(fileList?.[0] ?? null)

    if (!result.valid) {
      setSelectedFile(null)
      setFileErrorId(result.errorId)
      return
    }

    setSelectedFile(result.file)
    setFileErrorId(null)
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    setFileErrorId(null)
  }

  const submit = form.handleSubmit((values) => {
    setStatus('idle')

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setStatus('offline')
      return
    }

    submitFeedback.mutate(
      {
        userId: MOCK_USER_ID,
        type: values.type,
        message: values.message,
        replyEmail: values.replyEmail ?? null,
        technicalDetails: buildTechnicalDetails(locale, pathname),
        screenId: pathname,
        screenshotAttachment: buildAttachmentInput(selectedFile),
      },
      {
        onSuccess: () => {
          form.reset()
          setSelectedFile(null)
          setFileErrorId(null)
          setStatus('success')
        },
        onError: () => setStatus('error'),
      },
    )
  })

  return {
    fileErrorId,
    form,
    handleFileChange,
    isPending: submitFeedback.isPending,
    removeSelectedFile,
    selectedFile,
    status,
    submit,
  }
}
