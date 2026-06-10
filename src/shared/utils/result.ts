import { AppError } from './appError'

export type OkResult<T> = {
  ok: true
  data: T
}

export type ErrResult<E extends AppError = AppError> = {
  ok: false
  error: E
}

export type Result<T, E extends AppError = AppError> = OkResult<T> | ErrResult<E>

export const ok = <T>(data: T): OkResult<T> => {
  return { ok: true, data }
}

export const err = <E extends AppError>(error: E): ErrResult<E> => {
  return { ok: false, error }
}

export const unwrapResult = <T, E extends AppError>(result: Result<T, E>) => {
  if (!result.ok) {
    throw result.error
  }

  return result.data
}
