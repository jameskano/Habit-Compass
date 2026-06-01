import { act, render, renderHook } from '@testing-library/react'
import { IntlProvider } from 'react-intl'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAppPreferencesStore } from '@/app/state/appPreferencesStore'
import { getMessages } from '@/i18n/messages'
import { DEFAULT_TOAST_DURATION_MS, Toaster } from '@/shared/ui/sonner'

import { useAppToast } from './useAppToast'

const sonnerMocks = vi.hoisted(() => ({
  Toaster: vi.fn(() => null),
  message: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  loading: vi.fn(),
  promise: vi.fn(),
  dismiss: vi.fn(),
}))

vi.mock('sonner', () => ({
  Toaster: sonnerMocks.Toaster,
  toast: {
    message: sonnerMocks.message,
    success: sonnerMocks.success,
    error: sonnerMocks.error,
    info: sonnerMocks.info,
    warning: sonnerMocks.warning,
    loading: sonnerMocks.loading,
    promise: sonnerMocks.promise,
    dismiss: sonnerMocks.dismiss,
  },
}))

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <IntlProvider locale="en" messages={getMessages('en')}>
      {children}
    </IntlProvider>
  )
}

describe('useAppToast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAppPreferencesStore.setState({ theme: 'dark' })
  })

  it('configures the global toaster with calm mobile-first defaults', () => {
    render(<Toaster />)

    expect(DEFAULT_TOAST_DURATION_MS).toBe(4000)
    expect(sonnerMocks.Toaster).toHaveBeenCalledWith(
      expect.objectContaining({
        theme: 'dark',
        position: 'top-center',
        duration: 4000,
        closeButton: true,
        richColors: true,
      }),
      undefined,
    )
  })

  it('formats localized variants and forwards per-toast options', () => {
    const { result } = renderHook(() => useAppToast(), { wrapper })

    act(() => {
      result.current.message({ id: 'page.items.task.edit.saved' })
      result.current.success(
        { id: 'page.items.task.completed', values: { task: 'Call the clinic' } },
        {
          description: { id: 'page.items.task.edit.saved' },
          duration: 2500,
          id: 'task-complete',
        },
      )
      result.current.error()
      result.current.info({ id: 'page.items.habit.detail.saved' })
      result.current.warning({ id: 'page.items.habit.detail.progressReset' })
      result.current.loading({ id: 'shared.loading.title' })
    })

    expect(sonnerMocks.message).toHaveBeenCalledWith('Task changes saved.', undefined)
    expect(sonnerMocks.success).toHaveBeenCalledWith('Call the clinic was completed.', {
      description: 'Task changes saved.',
      duration: 2500,
      id: 'task-complete',
    })
    expect(sonnerMocks.error).toHaveBeenCalledWith(
      'Something went wrong. Please try again.',
      undefined,
    )
    expect(sonnerMocks.info).toHaveBeenCalledWith('Habit changes saved.', undefined)
    expect(sonnerMocks.warning).toHaveBeenCalledWith(
      'Progress reset. The habit remains available.',
      undefined,
    )
    expect(sonnerMocks.loading).toHaveBeenCalledWith('Loading data', undefined)
  })

  it('maps localized promise messages, dismisses toasts, and hides mutation details', () => {
    const { result } = renderHook(() => useAppToast(), { wrapper })
    const promise = Promise.resolve('Fold laundry')

    act(() => {
      result.current.promise(promise, {
        loading: { id: 'shared.loading.title' },
        success: (task) => ({ id: 'page.items.task.completed', values: { task } }),
      })
      result.current.dismiss('task-complete')
      result.current.mutationError()
    })

    const promiseOptions = sonnerMocks.promise.mock.calls[0]?.[1]

    expect(sonnerMocks.promise).toHaveBeenCalledWith(
      promise,
      expect.objectContaining({
        loading: 'Loading data',
        error: 'Something went wrong. Please try again.',
      }),
    )
    expect(promiseOptions.success('Fold laundry')).toBe('Fold laundry was completed.')
    expect(sonnerMocks.dismiss).toHaveBeenCalledWith('task-complete')
    expect(sonnerMocks.error).toHaveBeenCalledWith(
      'Something went wrong. Please try again.',
      undefined,
    )
  })
})
