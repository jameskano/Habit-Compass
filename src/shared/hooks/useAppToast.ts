import { useIntl } from 'react-intl'
import { toast, type ExternalToast } from 'sonner'

type ToastValue = string | number | boolean | Date | null | undefined

export type AppToastMessage = {
  id: string
  values?: Record<string, ToastValue>
}

export type AppToastOptions = Omit<ExternalToast, 'description'> & {
  description?: AppToastMessage
}

type AppPromiseToastMessages<T> = {
  loading: AppToastMessage
  success: AppToastMessage | ((data: T) => AppToastMessage)
  error?: AppToastMessage | ((error: unknown) => AppToastMessage)
  description?: AppToastMessage
}

export function useAppToast() {
  const intl = useIntl()

  const format = (message: AppToastMessage) =>
    intl.formatMessage({ id: message.id }, message.values)

  const formatOptions = (options?: AppToastOptions): ExternalToast | undefined => {
    if (!options) {
      return undefined
    }

    const { description, ...toastOptions } = options

    return {
      ...toastOptions,
      description: description ? format(description) : undefined,
    }
  }

  const error = (
    message: AppToastMessage = { id: 'shared.toast.error.generic' },
    options?: AppToastOptions,
  ) => toast.error(format(message), formatOptions(options))

  return {
    message: (message: AppToastMessage, options?: AppToastOptions) =>
      toast.message(format(message), formatOptions(options)),
    success: (message: AppToastMessage, options?: AppToastOptions) =>
      toast.success(format(message), formatOptions(options)),
    error,
    info: (message: AppToastMessage, options?: AppToastOptions) =>
      toast.info(format(message), formatOptions(options)),
    warning: (message: AppToastMessage, options?: AppToastOptions) =>
      toast.warning(format(message), formatOptions(options)),
    loading: (message: AppToastMessage, options?: AppToastOptions) =>
      toast.loading(format(message), formatOptions(options)),
    promise: <T>(
      promise: Promise<T> | (() => Promise<T>),
      messages: AppPromiseToastMessages<T>,
      options?: Omit<AppToastOptions, 'description'>,
    ) => {
      const success = messages.success
      const promiseError = messages.error

      return toast.promise(promise, {
        ...options,
        loading: format(messages.loading),
        success: typeof success === 'function' ? (data) => format(success(data)) : format(success),
        error:
          typeof promiseError === 'function'
            ? (toastError) => format(promiseError(toastError))
            : format(promiseError ?? { id: 'shared.toast.error.generic' }),
        description: messages.description ? format(messages.description) : undefined,
      })
    },
    dismiss: toast.dismiss,
    mutationError: () => error(),
  }
}
