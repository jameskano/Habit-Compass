import { AppError } from '@/shared/utils/appError'

export type ErrorPageKind = 'generic' | 'network' | 'unauthorized' | 'configuration' | 'validation'

type ErrorPageMessageIds = {
  titleId: string
  descriptionId: string
}

const errorPageMessages: Record<ErrorPageKind, ErrorPageMessageIds> = {
  generic: {
    titleId: 'errorPage.generic.title',
    descriptionId: 'errorPage.generic.description',
  },
  network: {
    titleId: 'errorPage.network.title',
    descriptionId: 'errorPage.network.description',
  },
  unauthorized: {
    titleId: 'errorPage.unauthorized.title',
    descriptionId: 'errorPage.unauthorized.description',
  },
  configuration: {
    titleId: 'errorPage.configuration.title',
    descriptionId: 'errorPage.configuration.description',
  },
  validation: {
    titleId: 'errorPage.validation.title',
    descriptionId: 'errorPage.validation.description',
  },
}

const hasAuthNetworkCode = (error: AppError) => {
  const details = error.details

  return (
    typeof details === 'object' &&
    details !== null &&
    'authCode' in details &&
    details.authCode === 'NETWORK'
  )
}

const isOffline = () => {
  return typeof navigator !== 'undefined' && navigator.onLine === false
}

export const getErrorPageKind = (error: unknown): ErrorPageKind => {
  if (isOffline()) {
    return 'network'
  }

  if (error instanceof AppError) {
    if (error.code === 'network' || hasAuthNetworkCode(error)) {
      return 'network'
    }

    if (
      error.code === 'unauthorized' ||
      error.code === 'configuration' ||
      error.code === 'validation'
    ) {
      return error.code
    }
  }

  return 'generic'
}

export const getErrorPageMessageIds = (error: unknown) => {
  return errorPageMessages[getErrorPageKind(error)]
}
