export const appErrorCodes = [
  'unknown',
  'not_implemented',
  'not_found',
  'validation',
  'configuration',
  'unauthorized',
] as const

export type AppErrorCode = (typeof appErrorCodes)[number]

type AppErrorOptions = {
  cause?: unknown
  details?: unknown
}

export class AppError extends Error {
  readonly code: AppErrorCode
  readonly cause?: unknown
  readonly details?: unknown

  constructor(code: AppErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.cause = options.cause
    this.details = options.details
  }
}

export function createAppError(
  code: AppErrorCode,
  message: string,
  options?: AppErrorOptions,
) {
  return new AppError(code, message, options)
}

export function createNotImplementedError(feature: string) {
  return createAppError(
    'not_implemented',
    `${feature} is not implemented for the current data source.`,
  )
}

export function createNotFoundError(entityName: string, entityId: string) {
  return createAppError('not_found', `${entityName} "${entityId}" was not found.`)
}
